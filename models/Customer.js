const mongoose = require('mongoose');
const Schema = mongoose.Schema

const customerSchema = new Schema({
    name: String,
    email: {
        type: String,
        unique: true
    },
    address: String,
    phone: String,
    url_avatar: {
        type: String,
        default: 'https://res.cloudinary.com/dyacy1md1/image/upload/v1736261578/default-avatar-icon-of-social-media-user-vector_qse49g.jpg'
    },
    password: String,
    status: {
        type: String,
        default: 'active'
    }
})

module.exports = mongoose.model('Customer', customerSchema)