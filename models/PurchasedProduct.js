const mongoose = require('mongoose')
const Schema = mongoose.Schema

const purchasedProductSchema = new Schema({
    customerId: {
        type: Schema.Types.ObjectId,
        ref: 'Customer'
    },
    productId: {
        type: Schema.Types.ObjectId,
        ref: 'Product'
    },
    orderId: {
        type: Schema.Types.ObjectId,
        ref: 'Order'
    },
    productName: {
        type: String,
        require: true
    },
    quantity: {
        type: Number,
        require: true
    },
    totalPrice: {
        type: Number,
        require: true
    },
    date_purchased: {
        type: Date,
        default: Date.now
    }
})

module.exports = mongoose.model('PurchasedProduct', purchasedProductSchema)