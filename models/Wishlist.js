const mongoose = require('mongoose');
const Schema = mongoose.Schema

const wishlistSchema = new Schema({
    customerId: {
        type: Schema.Types.ObjectId,
        ref: 'Customer'
    },
    productId: {
        type: Schema.Types.ObjectId,
        ref: 'Product'
    }
})

module.exports = mongoose.model('Wishlist', wishlistSchema)