const mongoose = require('mongoose');
const Schema = mongoose.Schema

const productSchema = new Schema({
    name: {
        type: String,
        unique: true,
        required: true
    },
    import_price: {
        type: Number,
        required: true
    },
    retail_price: {
        type: Number,
        required: true
    },
    brand: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    creation_date: {
        type: Date,
        default: Date.now
    },
    url_image: {
        type: String,
        required: true
    }
})

module.exports = mongoose.model('Product', productSchema)