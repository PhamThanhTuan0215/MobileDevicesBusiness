const Product = require('../models/Product')
const Wishlist = require('../models/Wishlist')

module.exports.get_wishlist = async (req, res) => {
    const { customerId } = req.params;

    try {
        const wishlistItems = await Wishlist.find({ customerId }).select('productId');

        if (!wishlistItems || wishlistItems.length === 0) {
            return res.status(200).json({ code: 0, message: 'Wishlist is empty', data: [] });
        }

        const productIds = wishlistItems.map(item => item.productId);
        const products = await Product.find({ _id: { $in: productIds } });

        res.status(200).json({ code: 0, message: 'Wishlist retrieved successfully', data: products });
    }
    catch (error) {
        res.status(500).json({ code: 2, message: 'Error fetching wishlist', error: error.message });
    }
}

module.exports.add_product_to_wishlist = async (req, res) => {
    const { customerId, productId } = req.params;

    try {
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ code: 1, message: 'Product not found' });
        }

        const existingItem = await Wishlist.findOne({ customerId, productId });
        if (existingItem) {
            return res.status(400).json({ code: 1, message: 'Product already in wishlist' });
        }

        const newWishlist = new Wishlist({ customerId, productId });
        await newWishlist.save();

        res.status(201).json({ code: 0, message: 'Product added to wishlist successfully', data: product });
    } catch (error) {
        res.status(500).json({ code: 2, message: 'Error adding product to wishlist', error: error.message });
    }
}

module.exports.remove_product_from_wishlist = async (req, res) => {
    const { customerId, productId } = req.params;

    try {
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ code: 1, message: 'Product not found' });
        }

        const deletedItem = await Wishlist.findOneAndDelete({ customerId, productId });
        if (!deletedItem) {
            return res.status(404).json({ code: 1, message: 'Product not found in wishlist' });
        }

        res.status(200).json({ code: 0, message: 'Product removed from wishlist successfully', data: product });

    } catch (error) {
        res.status(500).json({ code: 2, message: 'Error removing product from wishlist', error: error.message });
    }
}