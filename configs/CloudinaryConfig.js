const cloudinary = require('cloudinary').v2;

// Cấu hình bằng CLOUDINARY_URL
cloudinary.config({
    cloudinary_url: process.env.CLOUDINARY_URL
});

module.exports = cloudinary;