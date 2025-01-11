const Order = require('../models/Order')
const DetailsOrder = require('../models/DetailsOrder')
const Cart = require('../models/Cart')
const PurchasedProduct = require('../models/PurchasedProduct')
const Customer = require('../models/Customer')
const Product = require('../models/Product')

module.exports.add_order = async (req, res) => {
    const { customerId } = req.params;
    const { totalQuantity, totalPrice, method, isPaid, discountCode, discountPrice } = req.body

    const errors = [];

    if (!customerId) {
        errors.push("Customer ID is required.");
    }
    if (!totalQuantity || totalQuantity <= 0) {
        errors.push("Total quantity must be greater than 0.");
    }
    if (!totalPrice || totalPrice <= 0) {
        errors.push("Total price must be greater than 0.");
    }
    if (!method || !['cash', 'vnpay', 'momo'].includes(method)) {
        errors.push("Payment method is invalid. Choose 'cash', 'vnpay', or 'momo'.");
    }
    if (discountPrice < 0) {
        errors.push("Discount price cannot be negative.");
    }
    if (discountPrice > 0 && (!discountCode || discountCode.trim() === "")) {
        errors.push("Discount code is required if discount price is greater than 0.");
    }

    if (errors.length > 0) {
        return res.status(400).json({ code: 1, message: "Validation failed", errors });
    }

    try {
        const customer = await Customer.findById(customerId);

        if (!customer) {
            return res.status(404).json({ code: 1, message: 'Customer not found.' });
        }

        const cartItems = await Cart.find({ customerId }).populate('productId', 'amount name');

        // cartItems.productId lúc này lưu thông tin về product(amount, name) chứ ko còn là productId nữa

        if (!cartItems || cartItems.length === 0) {
            return res.status(400).json({ code: 1, message: 'Cart is empty. Cannot create order details and purchased products.' });
        }

        // Kiểm tra tồn kho
        for (const cartItem of cartItems) {
            const product = cartItem.productId;

            if (product.amount < cartItem.quantity) {
                return res.status(400).json({ code: 1, message: `Not enough stock for product ${product.name}. Only ${product.amount} available.` });
            }
        }

        const newOrder = new Order({
            customerId,
            customerName: customer.name,
            customerAddress: customer.address,
            totalQuantity,
            totalPrice,
            method,
            discountCode,
            discountPrice,
            isPaid
        });

        // Tạo Order
        await newOrder.save();

        const operations = cartItems.map(async (cartItem) => {
            // Tạo DetailsOrder
            const detailsOrder = new DetailsOrder({
                orderId: newOrder._id,
                productId: cartItem.productId._id,
                productName: cartItem.productName,
                price: cartItem.price,
                quantity: cartItem.quantity
            });

            await detailsOrder.save();

            // Tạo PurchasedProduct
            const purchasedProduct = new PurchasedProduct({
                customerId,
                productId: cartItem.productId._id,
                orderId: newOrder._id,
                productName: cartItem.productName,
                quantity: cartItem.quantity,
                totalPrice: cartItem.totalPrice
            });

            await purchasedProduct.save();

            // Cập nhật tồn kho
            const product = await Product.findById(cartItem.productId._id);
            if (product) {
                product.amount -= cartItem.quantity;
                await product.save();
            }
        });

        await Promise.all(operations);

        // Xóa sản phẩm trong Cart
        await Cart.deleteMany({ customerId });

        res.status(200).json({ code: 0, message: 'Order created successfully, and details and purchased products have been saved.', data: newOrder });
    }
    catch (error) {
        res.status(500).json({ code: 2, message: 'Error creating new order.', error: error.message });
    }
}

module.exports.get_all_order = async (req, res) => {

    const { startDate, endDate } = req.query;

    try {
        let filter = {};

        if (startDate && endDate) {
            // yyyy-mm-dd
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

        res.status(200).json({
            code: 0, message: 'Orders retrieved successfully.', data: orders
        });
    } catch (error) {
        res.status(500).json({ code: 2, message: 'Error retrieving orders.', error: error.message });
    }
}

module.exports.get_order = async (req, res) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ code: 1, message: "Order ID is required." });
    }

    try {
        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({ code: 1, message: 'Order not found' });
        }

        res.status(200).json({ code: 0, message: 'Order retrieved successfully', data: order });
    } catch (error) {
        res.status(500).json({ code: 2, message: 'Error retrieving order', error: error.message });
    }
}

module.exports.get_details_order = async (req, res) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ code: 1, message: "Order ID is required." });
    }

    try {
        const detailsOrder = await DetailsOrder.find({ orderId: id });
        if (!detailsOrder || detailsOrder.length === 0) {
            return res.status(404).json({ code: 1, message: 'No details found for this order' });
        }

        res.status(200).json({ code: 0, message: 'Details retrieved successfully', data: detailsOrder });
    } catch (error) {
        res.status(500).json({ code: 2, message: 'Error retrieving order details', error: error.message });
    }
}

module.exports.get_my_orders = async (req, res) => {
    const { customerId } = req.params;

    const { startDate, endDate } = req.query;

    if (!customerId) {
        return res.status(400).json({ code: 1, message: "Customer ID is required." });
    }

    try {

        let filter = { customerId };

        if (startDate && endDate) {
            // yyyy-mm-dd
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
            return res.status(404).json({ code: 1, message: 'No orders found' });
        }

        res.status(200).json({ code: 0, message: 'Orders retrieved successfully', data: orders });
    } catch (error) {
        res.status(500).json({ code: 2, message: 'Error retrieving orders', error: error.message });
    }
}

module.exports.change_status_order = async (req, res) => {
    const { id } = req.params;
    const { status, isPaid } = req.body

    const errors = [];

    if (!id) {
        errors.push('Order ID is required.');
    }
    if (status && !['processing', 'delivering', 'delivered'].includes(status)) {
        errors.push("status is invalid. Choose 'processing', 'delivering', or 'delivered'.");
    }

    if (errors.length > 0) {
        return res.status(400).json({ code: 1, message: 'Validation failed', errors });
    }

    try {
        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({ code: 1, message: 'Order not found' });
        }

        if (order.isCompleted) {
            return res.status(400).json({ code: 1, message: 'Order is completed, can not be changed' });
        }

        if (status !== undefined) {
            order.status = status;
        }
        if (isPaid) {
            order.isPaid = isPaid;
        }

        await order.save();

        if (order.isCompleted) {
            await PurchasedProduct.updateMany(
                { orderId: order._id },
                { $set: { isOrderCompleted: true } }
            );
        }

        res.status(200).json({ code: 0, message: 'Order status updated successfully', data: order });

    } catch (error) {
        res.status(500).json({ code: 2, message: 'Error updating order status', error: error.message });
    }
}

module.exports.cancel_order = async (req, res) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ code: 1, message: "Order ID is required." });
    }

    try {
        const order = await Order.findById(id);

        if (!order) {
            return res.status(404).json({ code: 1, message: "Order not found." });
        }

        if (order.isCompleted) {
            return res.status(400).json({ code: 1, message: "Can not cancel a completed order." });
        }

        order.status = 'cancel';
        await order.save();

        const purchasedProducts = await PurchasedProduct.find({ orderId: order._id });

        // Cập nhật tồn kho (tăng lại)
        const updateStockOperations = purchasedProducts.map(async (purchasedProduct) => {
            const product = await Product.findById(purchasedProduct.productId);

            if (product) {
                product.amount += purchasedProduct.quantity;
                await product.save();
            }
        });

        await Promise.all(updateStockOperations);

        await PurchasedProduct.deleteMany({ orderId: order._id });

        return res.status(200).json({ code: 0, message: "Order cancelled successfully.", data: order });

    } catch (error) {
        return res.status(500).json({ code: 2, message: "Error cancelling order.", error: error.message });
    }
}