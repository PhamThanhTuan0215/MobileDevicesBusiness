const mongoose = require('mongoose');
const Schema = mongoose.Schema

const orderSchema = new Schema({
    customerId: {
        type: Schema.Types.ObjectId,
        ref: 'Customer'
    },
    customerName: {
        type: String,
        required: true
    },
    customerAddress: {
        type: String,
        required: true
    },
    totalQuantity: {
        type: Number,
        required: true
    },
    totalPrice: {
        type: Number,
        required: true
    },
    method: {
        type: String,
        required: true,
        enum: ['cash', 'vnpay', 'momo']
    },
    creation_date: {
        type: Date,
        default: Date.now
    },
    discountCode: {
        type: String,
        default: ''
    },
    discountPrice: {
        type: Number,
        default: 0
    },
    paymentPrice: {
        type: Number
    },
    status: {
        type: String,
        default: 'processing',
        enum: ['processing', 'delivering', 'delivered', 'canceled']
    },
    isPaid: {
        type: Boolean,
        default: false
    },
    isCompleted: {
        type: Boolean
    }
})

orderSchema.pre('save', function (next) {
    this.paymentPrice = this.totalPrice - this.discountPrice;

    this.isCompleted = this.status === 'delivered' && this.isPaid;

    next();
});

module.exports = mongoose.model('Order', orderSchema)