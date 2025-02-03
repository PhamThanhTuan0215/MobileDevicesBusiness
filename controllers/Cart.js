const Product = require('../models/Product')
const Cart = require('../models/Cart')

module.exports.get_cart = async (req, res) => {
    const { customerId } = req.params;

    try {
        const carts = await Cart.find({ customerId })
            .populate({
                path: "productId",
                select: "name url_image"
            });

        if (!carts || carts.length === 0) {
            return res.status(200).json({ code: 0, message: 'Cart is empty', data: [] });
        }

        const cartData = carts.map(item => ({
            _id: item._id,
            customerId: item.customerId,
            productId: item.productId._id,
            productName: item.productId.name,
            url_image: item.productId.url_image,
            price: item.price,
            quantity: item.quantity,
            totalPrice: item.totalPrice
        }));

        res.status(200).json({ code: 0, message: 'Cart retrieved successfully', data: cartData });
    }
    catch (error) {
        res.status(500).json({ code: 2, message: 'Error fetching cart', error: error.message });
    }
}

module.exports.add_product_to_cart = async (req, res) => {
    const { customerId, productId } = req.params;

    try {
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ code: 1, message: 'Product not found' });
        }

        if (product.amount <= 0) {
            return res.status(400).json({ code: 1, message: 'Product is out of stock' });
        }

        let cartItem = await Cart.findOne({ customerId, productId });
        if (cartItem) {
            cartItem.quantity += 1;
            await cartItem.save();
        } else {
            cartItem = new Cart({
                customerId,
                productId,
                productName: product.name,
                price: product.retail_price,
            });
            await cartItem.save();
        }
        res.status(200).json({ code: 0, message: 'Product added to cart successfully', data: cartItem });
    }
    catch (error) {
        res.status(500).json({
            code: 2, message: 'Error adding product to cart', error: error.message
        });
    }
}

module.exports.remove_product_from_cart = async (req, res) => {
    const { id } = req.params;

    try {
        const cartItem = await Cart.findById(id);
        if (!cartItem) {
            return res.status(404).json({ code: 1, message: 'Product not found in cart' });
        }

        if (cartItem.quantity > 1) {
            cartItem.quantity -= 1;
            await cartItem.save();
            res.status(200).json({ code: 0, message: 'Product quantity decreased in cart', data: cartItem });
        }
        else {
            await Cart.deleteOne({ _id: cartItem._id });
            res.status(200).json({ code: 0, message: 'Product removed from cart successfully' });
        }
    }
    catch (error) {
        res.status(500).json({ code: 2, message: 'Error removing product from cart', error: error.message });
    }
}