const mongoose = require('mongoose')
const Schema = mongoose.Schema

const reviewSchema = new Schema({
    customerId: {
        type: Schema.Types.ObjectId,
        ref: 'Customer'
    },
    productId: {
        type: Schema.Types.ObjectId,
        ref: 'Product'
    },
    rating: {
        type: Number,
        require: true
    },
    comment: {
        type: String,
        require: true
    },
})

module.exports = mongoose.model('Review', reviewSchema)