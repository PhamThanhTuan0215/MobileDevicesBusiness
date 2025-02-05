const crypto = require("crypto");
const querystring = require("qs");
const moment = require("moment");
const Order = require('../models/Order')
require("dotenv").config();


module.exports.VNPay = (req, res, next) => {

    const { orderId, amount, bankCode, language } = req.body;
    
    process.env.TZ = "Asia/Ho_Chi_Minh";

    let date = new Date();
    let createDate = moment(date).format("YYYYMMDDHHmmss");

    let ipAddr =
        req.headers["x-forwarded-for"] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.connection.socket.remoteAddress;

    let tmnCode = "EXNLMNRI";
    let secretKey = "VSYN4JDWTCS3N7MLKSOMI7MCUHBSSARK";
    let vnpUrl = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
    let returnUrl = "http://localhost:9000/payments/vnpay_return";
    // let orderId = moment(date).format("DDHHmmss");


    let locale = language;
    if (locale === null || locale === "") {
        locale = "vn";
    }
    let currCode = "VND";
    let vnp_Params = {};
    vnp_Params["vnp_Version"] = "2.1.0";
    vnp_Params["vnp_Command"] = "pay";
    vnp_Params["vnp_TmnCode"] = tmnCode;
    vnp_Params["vnp_Locale"] = locale;
    vnp_Params["vnp_CurrCode"] = currCode;
    vnp_Params["vnp_TxnRef"] = orderId;
    vnp_Params["vnp_OrderInfo"] = "Thanh toan cho khach hang:" + orderId;
    vnp_Params["vnp_OrderType"] = "other";
    vnp_Params["vnp_Amount"] = amount*100;
    vnp_Params["vnp_ReturnUrl"] = returnUrl;
    vnp_Params["vnp_IpAddr"] = ipAddr;
    vnp_Params["vnp_CreateDate"] = createDate;
    if (bankCode !== null && bankCode !== "") {
        vnp_Params["vnp_BankCode"] = bankCode;
    }

    vnp_Params = sortObject(vnp_Params);

    for (let key in vnp_Params) {
        if (typeof vnp_Params[key] === "object") {
            console.log(`Lỗi: Key "${key}" có giá trị là object:`, vnp_Params[key]);
        }
    }


    let signData = querystring.stringify(vnp_Params, { encode: false });
    let hmac = crypto.createHmac("sha512", secretKey);
    let signed = hmac.update(new Buffer(signData, "utf-8")).digest("hex");
    vnp_Params["vnp_SecureHash"] = signed;
    
    vnpUrl += "?" + querystring.stringify(vnp_Params, { encode: false });

    res.json({ url: vnpUrl });
};

module.exports.VNPayReturn = async (req, res, next) => {
    try {
        let vnp_Params = req.query;

        let secureHash = vnp_Params["vnp_SecureHash"];

        delete vnp_Params["vnp_SecureHash"];
        delete vnp_Params["vnp_SecureHashType"];

        vnp_Params = sortObject(vnp_Params);

        let tmnCode = "EXNLMNRI";
        let secretKey = "VSYN4JDWTCS3N7MLKSOMI7MCUHBSSARK";

        let signData = querystring.stringify(vnp_Params, { encode: false });
        let hmac = crypto.createHmac("sha512", secretKey);
        let signed = hmac.update(new Buffer(signData, "utf-8")).digest("hex");

        if (secureHash === signed) {
            let code = vnp_Params["vnp_ResponseCode"];
            if (code === "00") {
                let orderId = String(vnp_Params["vnp_TxnRef"]);
                
                const order = await Order.findByIdAndUpdate(
                    orderId, 
                    {
                        method: "vnpay",  // Cập nhật phương thức thanh toán
                        isPaid: true      // Cập nhật trạng thái thanh toán thành "đã thanh toán"
                    },
                    { new: true }  // Trả về tài liệu đã được cập nhật
                );
                if (!order) {
                    return res.status(404).json({
                        code: 1,
                        success: false,
                        message: "Order not found."
                    });
                }
        
                return res.redirect("http://localhost:3000/");

            } else {
                return res.status(400).json({
                    code: 1,
                    success: false,
                    message: "Invalid signature."
                });
            }
        } else {
            return res.status(500).json({
                code: 1,
                success: false,
                message: "Internal server error."
            });
        }
    } catch (error) {
        return res.status(500).json({
            code: 1,
            success: false,
            message: error.message
        });
    }
};


function sortObject(obj) {
    let sorted = {};
    let str = [];
    let key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) {
            str.push(encodeURIComponent(key));
        }
    }
    str.sort();
    for (key = 0; key < str.length; key++) {
        sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(
            /%20/g,
            "+"
        );
    }
    return sorted;
}