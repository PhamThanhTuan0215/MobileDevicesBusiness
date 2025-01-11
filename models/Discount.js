const mongoose = require('mongoose');
const Schema = mongoose.Schema

const discountSchema = new Schema({
    code: {
        type: String,
        unique: true
    },
    type: String,
    value: Number,
    start_date: {
        type: Date,
        default: Date.now
    },
    end_date: Date,
})

module.exports = mongoose.model('Discount', discountSchema)