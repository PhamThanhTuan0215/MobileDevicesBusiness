const multer = require('multer');
const cloudinary = require('../configs/CloudinaryConfig');
const mongoose = require('mongoose');
const Customer = require('../models/Customer');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require("dotenv").config();
const {JWT_SECRET} = process.env

// Cấu hình Multer (lưu trữ ảnh tạm thời trong bộ nhớ)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Export middleware upload để sử dụng trong router (sử dụng đối với các hàm cần upload ảnh)
module.exports.upload = upload.single('image'); // Chỉ định tên của file ảnh là "image"

module.exports.addNewCustomer = async (req, res) => {

    const {name, email,address, phone, password} = req.body;

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
    if (!password) {
        errors.push('Password is required');
    }
    if (!address) {
        errors.push('Address is required');
    }

    if (errors.length > 0) {
        return res.status(400).json({ code: 1, message: 'Validation failed', errors });
    }

    try {
        const existingCustomer = await Customer.findOne({ email });
        if (existingCustomer) {
            return res.status(400).json({code: 1, message: 'Customer already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const customer = new Customer({
            name,
            email,
            address,
            phone,
            password: hashedPassword
        });
        await customer.save();
        res.status(201).json({code: 0, message: 'Customer created successfully', data: customer});

    } catch (error) {
        return res.status(500).json({code: 2, message: 'Error checking for existing customer', error: error.message });
    }

};

module.exports.getAllCustomer = async (req, res) => {

    try {
        const customers = await Customer.find();
        res.status(200).json({code: 0, message: 'Customers retrieved successfully', data: customers});
    } catch (error) {
        res.status(500).json({code: 2, message: 'Error fetching customers', error: error.message});
    }

};

module.exports.getCustomerById = async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.id);
        if (!customer) {
            return res.status(404).json({code: 1, message: 'Customer not found'});
        }
        res.status(200).json({code: 0, message: 'Customer retrieved successfully', data: customer});
    } catch (error) {
        res.status(500).json({code: 2, message: 'Error fetching customer', error: error.message});
    }
};

module.exports.updateCustomerById = async (req, res) => {
    const id = req.params.id
    const {name, email, address, phone} = req.body;
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
        const customer = await Customer.findById(id);
        if (!customer) {
            return res.status(404).json({code: 1, message: 'Customer not found'});
        }

        const cloudinaryPublicId_old = 'MobileDevicesBusinessApplication/accounts/' + customer.url_avatar.split('accounts/')[1].split('.')[0] // Lưu lại public_id cũ
        
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

            customer.url_avatar = result.secure_url;
            cloudinaryPublicId_new = result.public_id; // Lưu lại public_id mới
        }

        customer.name = name;
        customer.email = email;
        customer.address = address;
        customer.phone = phone;
        await customer.save({ session });

        await session.commitTransaction();
        session.endSession();

        if (file) {
            await cloudinary.uploader.destroy(cloudinaryPublicId_old);
        }

        res.status(200).json({code: 0, message: 'Customer updated successfully', data: customer});
    } catch (error) {

        await session.abortTransaction();
        session.endSession();

        if (cloudinaryPublicId_new) {
            await cloudinary.uploader.destroy(cloudinaryPublicId_new);
        }

        res.status(500).json({code: 2, message: 'Error updating customer', error: error.message});
    }
};

module.exports.deleteCustomerByID = async (req, res) => {
    try {
        const customer = await Customer.findByIdAndDelete(req.params.id);
        if (!customer) {
            return res.status(404).json({code: 1, message: 'Customer not found'});
        }
        res.status(200).json({code: 0, message: 'Customer deleted successfully', data: customer});
    } catch (error) {
        res.status(500).json({code: 2, message: 'Error deleting customer', error: error.message});
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
        const customer = await Customer.findOne({ email });
        if (!customer) {
            return res.status(404).json({code: 1, message: 'Customer not found'});
        }

        const isMatch = await bcrypt.compare(password, customer.password);
        if (!isMatch) {
            return res.status(400).json({code: 1, message: 'Invalid credentials'});
        }

        const payload = {
            customer: {
                id: customer.id
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
    const customer = await Customer.findById(id);
    if (!customer) {
        return res.status(404).json({code: 1, message: 'Customer not found'});
    }
    
    try {

        const isMatch = await bcrypt.compare(oldPassword, customer.password);
        if (!isMatch) {
            return res.status(400).json({code: 1, message: 'Invalid credentials'});
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        customer.password = hashedPassword;
        await customer.save();
        res.status(200).json({code: 0, message: 'Password changed successfully'});

    } catch (error) {
        res.status(500).json({code: 2, message: 'Error changing password', error: error.message});
    }
}
