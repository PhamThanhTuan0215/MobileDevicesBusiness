const mongoose = require('mongoose');
const Schema = mongoose.Schema

const productInCartSchema = new Schema({
    cartId: {
        type: Schema.Types.ObjectId,
        ref: 'Cart'
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
        default: 1
    },
    totalPrice: {
        type: Number
    }
})

productInCartSchema.pre('save', function(next) {
    this.totalPrice = this.price * this.quantity;  // Tính lại totalPrice mỗi khi lưu
    next();
});

module.exports = mongoose.model('ProductInCart', productInCartSchema)