const PurchasedProduct = require('../models/PurchasedProduct')
const Review = require('../models/Review')

module.exports.get_list_review = async (req, res) => {
    const { productId } = req.params;

    try {
        const reviews = await Review.find({ productId })

        if (!reviews || reviews.length === 0) {
            return res.status(200).json({ code: 0, message: 'List review is empty', data: [] });
        }

        res.status(200).json({ code: 0, message: 'List review retrieved successfully', data: reviews });
    }
    catch (error) {
        res.status(500).json({ code: 2, message: 'Error fetching list review', error: error.message });
    }
}

module.exports.write_review = async (req, res) => {
    const { customerId, productId } = req.params;
    const { rating, comment } = req.body

    if (!rating || !comment) {
        return res.status(400).json({ code: 1, message: 'Rating and comment are required.' })
    }

    try {
        const purchasedProduct = await PurchasedProduct.findOne({ customerId, productId }).sort({ date_purchased: -1 });
        if (!purchasedProduct) {
            return res.status(403).json({ code: 1, message: 'You have not purchased this product.' });
        }

        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        if (purchasedProduct.date_purchased < thirtyDaysAgo) {
            return res.status(403).json({ code: 1, message: 'You can only review product purchased within the last 30 days.' });
        }

        const existingReview = await Review.findOne({ customerId, productId });
        if (existingReview) {
            existingReview.rating = rating;
            existingReview.comment = comment;
            await existingReview.save();

            return res.status(200).json({ code: 0, message: 'Review updated successfully.', data: existingReview });
        }

        const newReview = new Review({ customerId, productId, rating, comment });

        await newReview.save();

        res.status(201).json({ code: 0, message: 'Review submitted successfully.', data: newReview });
    }
    catch (error) {
        res.status(500).json({ code: 2, message: 'Error submitting review.', error: error.message });
    }
}

module.exports.delete_review = async (req, res) => {
    const { customerId, reviewId } = req.params;

    try {
        const review = await Review.findById(reviewId);

        if (!review) {
            return res.status(404).json({ code: 1, message: 'Review not found' });
        }

        if (review.customerId.toString() !== customerId) {
            return res.status(403).json({ code: 1, message: 'Customer not authorized to delete this review' });
        }

        await Review.findOneAndDelete({ _id: reviewId });

        res.status(200).json({ code: 0, message: 'Review deleted successfully.' });
    }
    catch (error) {
        res.status(500).json({ code: 2, message: 'Error deleting review.', error: error.message });
    }
}