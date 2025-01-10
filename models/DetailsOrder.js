const mongoose = require('mongoose');
const Schema = mongoose.Schema

const detailsOrderSchema = new Schema({
    orderId: {
        type: Schema.Types.ObjectId,
        ref: 'Order'
    },
    productId: {
        type: Schema.Types.ObjectId,
        ref: 'Product'
    },
    productName: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    quantity: {
        type: Number,
        required: true
    },
    totalPrice: {
        type: Number
    }
})

detailsOrderSchema.pre('save', function (next) {
    this.totalPrice = this.price * this.quantity;

    next();
});

module.exports = mongoose.model('detailsOrder', detailsOrderSchema)