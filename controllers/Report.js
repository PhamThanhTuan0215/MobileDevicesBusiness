const Order = require('../models/Order');
const DetailsOrder = require('../models/DetailsOrder');
const PurchasedProduct = require('../models/PurchasedProduct');

module.exports.get_report_orders = async (req, res) => {

    const { startDate, endDate } = req.query;

    try {
        let filter = { isCompleted: true };

        if (startDate && endDate) {
            // YYYY-MM-DD
            const isValidStartDate = /^\d{4}-\d{2}-\d{2}$/.test(startDate);
            const isValidEndDate = /^\d{4}-\d{2}-\d{2}$/.test(endDate);

            if (!isValidStartDate || !isValidEndDate) {
                return res.status(400).json({ code: 1, message: 'Invalid date format. Please use yyyy-mm-dd.' });
            }

            const selectedStartDate = new Date(startDate);
            const selectedEndDate = new Date(endDate);

            filter.creation_date = {
                $gte: new Date(selectedStartDate.setHours(0, 0, 0, 0)), // Bắt đầu từ 00:00:00
                $lte: new Date(selectedEndDate.setHours(23, 59, 59, 999)) // Kết thúc trước 23:59:59
            };
        }

        const orders = await Order.find(filter).sort({ isCompleted: 1, creation_date: -1 });

        if (!orders || orders.length === 0) {
            return res.status(404).json({ code: 1, message: 'No orders found.' });
        }

        const reportOrders = await Promise.all(
            orders.map(async (order) => {
                const details = await DetailsOrder.find({ orderId: order._id }).populate('productId', 'retail_price import_price'); // biến trường productId thành nơi lưu Product(chỉ chứa giá trị retail_price và import_price)
                let totalImportPrice = 0;

                for (const detail of details) {
                    const product = detail.productId
                    totalImportPrice += product.import_price * detail.quantity;
                }

                const profit = order.paymentPrice - totalImportPrice;
                const profitMargin = totalImportPrice > 0 ? ((profit / totalImportPrice) * 100).toFixed(2) : 0;

                return {
                    ...order.toObject(),
                    totalImportPrice,
                    profit,
                    profitMargin
                };
            })
        );

        res.status(200).json({ code: 0, message: 'Orders retrieved successfully.', data: reportOrders });
    } catch (error) {
        res.status(500).json({ code: 2, message: 'Error retrieving orders.', error: error.message });
    }
}

module.exports.get_report_order = async (req, res) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ code: 1, message: "Order ID is required." });
    }

    try {
        const order = await Order.findById(id);

        if (!order) {
            return res.status(404).json({ code: 1, message: "Order not found." });
        }

        const details = await DetailsOrder.find({ orderId: order._id }).populate('productId', 'retail_price import_price');

        let totalImportPrice = 0;

        for (const detail of details) {
            const product = detail.productId
            totalImportPrice += product.import_price * detail.quantity;
        }

        const profit = order.paymentPrice - totalImportPrice;
        const profitMargin = totalImportPrice > 0 ? ((profit / totalImportPrice) * 100).toFixed(2) : 0;

        const enrichedOrder = {
            ...order.toObject(),
            totalImportPrice,
            profit,
            profitMargin
        };

        res.status(200).json({ code: 0, message: 'Order report retrieved successfully.', data: enrichedOrder });
    } catch (error) {
        res.status(500).json({ code: 2, message: 'Error retrieving the order report.', error: error.message });
    }
}

module.exports.get_report_details_order = async (req, res) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ code: 1, message: "Order ID is required." });
    }

    try {
        const detailsOrder = await DetailsOrder.find({ orderId: id }).populate('productId', 'retail_price import_price');
        if (!detailsOrder || detailsOrder.length === 0) {
            return res.status(404).json({ code: 1, message: 'No details found for this order' });
        }

        const reportDetailsOrder = detailsOrder.map(detail => {
            const product = detail.productId
            const productId = product._id

            const importPrice = product.import_price;
            const retailPrice = product.retail_price;
            const quantity = detail.quantity;

            const totalImportPrice = importPrice * quantity;
            const profit = (retailPrice - importPrice) * quantity;

            return {
                ...detail.toObject(),
                productId,
                product,
                importPrice,
                totalImportPrice,
                profit
            };
        });

        res.status(200).json({ code: 0, message: 'Details retrieved successfully', data: reportDetailsOrder });
    } catch (error) {
        res.status(500).json({ code: 2, message: 'Error retrieving order details', error: error.message });
    }
}

module.exports.get_report_products = async (req, res) => {
    const { startDate, endDate } = req.query;

    try {
        let filter = {isOrderCompleted: true};

        if (startDate && endDate) {
            const isValidStartDate = /^\d{4}-\d{2}-\d{2}$/.test(startDate);
            const isValidEndDate = /^\d{4}-\d{2}-\d{2}$/.test(endDate);

            if (!isValidStartDate || !isValidEndDate) {
                return res.status(400).json({ code: 1, message: 'Invalid date format. Please use yyyy-mm-dd.' });
            }

            const selectedStartDate = new Date(startDate);
            const selectedEndDate = new Date(endDate);

            filter.date_purchased = {
                $gte: new Date(selectedStartDate.setHours(0, 0, 0, 0)),
                $lte: new Date(selectedEndDate.setHours(23, 59, 59, 999))
            };
        }

        const purchasedProducts = await PurchasedProduct.find(filter)
            .populate('productId', 'name retail_price import_price amount url_image');

        if (!purchasedProducts || purchasedProducts.length === 0) {
            return res.status(404).json({ code: 1, message: 'No purchased products found.' });
        }

        const productStats = {};

        purchasedProducts.forEach(purchasedProduct => {
            const product = purchasedProduct.productId;
            const productId = product._id.toString();

            if (!productStats[productId]) {
                productStats[productId] = {
                    productId,
                    name: product.name,
                    url_image: product.url_image,
                    quantitySold: 0,
                    import_price: product.import_price,
                    retailPrice: product.retail_price,
                    totalImportPrice: 0,
                    totalPrice: 0,
                    profit: 0,
                    profitMargin: 0,
                    amountInStock: product.amount
                };
            }

            const quantitySold = purchasedProduct.quantity;
            const totalPrice = product.retail_price * quantitySold;
            const totalImportPrice = product.import_price * quantitySold;
            const profit = totalPrice - totalImportPrice;

            // Cập nhật các thông tin thống kê cho sản phẩm
            productStats[productId].quantitySold += quantitySold;
            productStats[productId].totalPrice += totalPrice;
            productStats[productId].totalImportPrice += totalImportPrice;
            productStats[productId].profit += profit;
            productStats[productId].profitMargin = (productStats[productId].totalImportPrice > 0) ? 
                ((productStats[productId].profit / productStats[productId].totalImportPrice) * 100).toFixed(2) : 0;
        });

        const reportProducts = Object.values(productStats);

        res.status(200).json({ code: 0, message: 'Product report retrieved successfully.', data: reportProducts });
    }
    catch (error) {
        res.status(500).json({ code: 2, message: 'Error retrieving product report.', error: error.message });
    }
}