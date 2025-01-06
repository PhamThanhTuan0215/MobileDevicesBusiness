const mongoose = require('mongoose');
const Schema = mongoose.Schema

const cartSchema = new Schema({
    customerId: {
        type: Schema.Types.ObjectId,
        ref: 'Customer'
    },
})

module.exports = mongoose.model('Cart', cartSchema)