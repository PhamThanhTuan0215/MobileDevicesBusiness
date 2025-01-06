const mongoose = require('mongoose');
const Schema = mongoose.Schema

const detailsProductSchema = new Schema({
    productId: {
        type: Schema.Types.ObjectId,
        ref: 'Product'
    },
    os: {
        type: String,
        required: true
    },
    ram: {
        type: String,
        required: true
    },
    storage: {
        type: String,
        required: true
    },
    battery: {
        type: String,
        required: true
    },
    screen_size: {
        type: String,
        required: true
    },
    color: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
})

module.exports = mongoose.model('DetailsProduct', detailsProductSchema)