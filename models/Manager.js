const mongoose = require('mongoose');
const Schema = mongoose.Schema

const managerSchema = new Schema({
    name: String,
    email: {
        type: String,
        unique: true
    },
    address: String,
    phone: String,
    url_avatar: String,
    password: String,
    status: {
        type: String,
        default: 'active'
    },
    role: {
        type: String,
        default: 'manager'
    }
})

module.exports = mongoose.model('Manager', managerSchema)