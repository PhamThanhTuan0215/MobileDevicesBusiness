const multer = require('multer');
const cloudinary = require('../configs/CloudinaryConfig');
const mongoose = require('mongoose');
const Manager = require('../models/Manager');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require("dotenv").config();
const {JWT_SECRET} = process.env

// Cấu hình Multer (lưu trữ ảnh tạm thời trong bộ nhớ)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Export middleware upload để sử dụng trong router (sử dụng đối với các hàm cần upload ảnh)
module.exports.upload = upload.single('image'); // Chỉ định tên của file ảnh là "image"

module.exports.addNewAccount = async (req, res) => {

    const {name, email,address, phone, role} = req.body;

    const errors = [];

    if (!name) {
        errors.push('Name is required');
    }
    if (!email) {
        errors.push('Email is required');
    }
    if (!phone) {
        errors.push('Phone is required');
    }
    if (!address) {
        errors.push('Address is required');
    }

    if (errors.length > 0) {
        return res.status(400).json({ code: 1, message: 'Validation failed', errors });
    }

    try {
        const existingManager = await Manager.findOne({ email });
        if (existingManager) {
            return res.status(400).json({code: 1, message: 'Manager already exists' });
        }

        password = '123456'
        const hashedPassword = await bcrypt.hash(password, 10);

        const manager = new Manager({
            name,
            email,
            address,
            phone,
            password: hashedPassword,
            ...(role && { role })
        });

        await manager.save();
        res.status(201).json({code: 0, message: 'Manager created successfully', data: manager});

    } catch (error) {
        return res.status(500).json({code: 2, message: 'Error checking for existing manager', error: error.message });
    }

};

module.exports.getAllManager = async (req, res) => {

    try {
        const managers = await Manager.find();
        res.status(200).json({code: 0, message: 'Managers retrieved successfully', data: managers});
    } catch (error) {
        res.status(500).json({code: 2, message: 'Error fetching managers', error: error.message});
    }

};

module.exports.getManagerById = async (req, res) => {
    try {
        const manager = await Manager.findById(req.params.id);
        if (!manager) {
            return res.status(404).json({code: 1, message: 'Manager not found'});
        }
        res.status(200).json({code: 0, message: 'Manager retrieved successfully', data: manager});
    } catch (error) {
        res.status(500).json({code: 2, message: 'Error fetching manager', error: error.message});
    }
};

module.exports.updateManagerById = async (req, res) => {
    const id = req.params.id
    const {name, email, address, phone, role} = req.body;
    const file = req.file;

    const errors = [];
    if (!name) {
        errors.push('Name is required');
    }
    if (!email) {
        errors.push('Email is required');
    }
    if (!phone) {
        errors.push('Phone is required');
    }
    if (!address) {
        errors.push('Address is required');
    }
    if (errors.length > 0) {
        return res.status(400).json({ code: 1, message: 'Validation failed', errors });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    let cloudinaryPublicId_new = null

    try {
        const manager = await Manager.findById(id);
        if (!manager) {
            return res.status(404).json({code: 1, message: 'Manager not found'});
        }

        const cloudinaryPublicId_old = 'MobileDevicesBusinessApplication/accounts/' + manager.url_avatar.split('/').pop().split('.')[0]; // Lưu lại public_id cũ
        
        if (file) {

            const result = await new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream({
                    folder: 'MobileDevicesBusinessApplication/accounts',
                    resource_type: 'image'
                }, (error, result) => {
                    if (error) {
                        reject(error);
                    }
                    resolve(result);
                });

                uploadStream.end(file.buffer);
            });

            manager.url_avatar = result.secure_url;
            cloudinaryPublicId_new = result.public_id; // Lưu lại public_id mới
        }

        manager.name = name;
        manager.email = email;
        manager.address = address;
        manager.phone = phone;
        manager.role = role;
        await manager.save({ session });

        await session.commitTransaction();
        session.endSession();

        if (file) {
            cloudinary.uploader.destroy(cloudinaryPublicId_old);
        }

        res.status(200).json({code: 0, message: 'Manager updated successfully', data: manager});
    } catch (error) {

        await session.abortTransaction();
        session.endSession();

        if (cloudinaryPublicId_new) {
            cloudinary.uploader.destroy(cloudinaryPublicId_new);
        }

        res.status(500).json({code: 2, message: 'Error updating manager', error: error.message});
    }
};

module.exports.deleteManagerByID = async (req, res) => {
    try {
        const manager = await Manager.findByIdAndDelete(req.params.id);
        const cloudinaryPublicId_old = 'MobileDevicesBusinessApplication/accounts/' + manager.url_avatar.split('/').pop().split('.')[0];

        if (!manager) {
            return res.status(404).json({code: 1, message: 'Manager not found'});
        }

        cloudinary.uploader.destroy(cloudinaryPublicId_old);
        
        res.status(200).json({code: 0, message: 'Manager deleted successfully', data: manager});
    } catch (error) {
        res.status(500).json({code: 2, message: 'Error deleting manager', error: error.message});
    }
};

module.exports.login = async (req, res) => {
    const { email, password } = req.body;

    const errors = [];
    if (!email) {
        errors.push('Email is required');
    }
    if (!password) {
        errors.push('Password is required');
    }
    if (errors.length > 0) {
        return res.status(400).json({ code: 1, message: 'Validation failed', errors });
    }

    try {
        const manager = await Manager.findOne({ email });
        if (!manager) {
            return res.status(404).json({code: 1, message: 'Manager not found'});
        }

        const isMatch = await bcrypt.compare(password, manager.password);
        if (!isMatch) {
            return res.status(400).json({code: 1, message: 'Invalid credentials'});
        }

        const payload = {
            manager: {
                id: manager.id,
                role: manager.role
            }
        };

        jwt.sign(payload, JWT_SECRET, { expiresIn: 3600 }, (error, token) => {
            if (error) {
                throw error;
            }
            res.status(200).json({code: 0, message: 'Login successful', data: { token }});
        });

    } catch (error) {
        res.status(500).json({code: 2, message: 'Error logging in', error: error.message});
    }
};

module.exports.changePassword = async (req, res) => {

    const { oldPassword, newPassword } = req.body;
    const { id } = req.params;
    const manager = await Manager.findById(id);
    if (!manager) {
        return res.status(404).json({code: 1, message: 'Manager not found'});
    }
    
    try {

        const isMatch = await bcrypt.compare(oldPassword, manager.password);
        if (!isMatch) {
            return res.status(400).json({code: 1, message: 'Invalid credentials'});
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        manager.password = hashedPassword;
        await manager.save();
        res.status(200).json({code: 0, message: 'Password changed successfully'});

    } catch (error) {
        res.status(500).json({code: 2, message: 'Error changing password', error: error.message});
    }
}