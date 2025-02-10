const multer = require('multer');
const cloudinary = require('../configs/CloudinaryConfig');
const mongoose = require('mongoose');
const Product = require('../models/Product')
const DetailsProduct = require('../models/DetailsProduct');
const DetailsOrder = require('../models/DetailsOrder');

// Cấu hình Multer (lưu trữ ảnh tạm thời trong bộ nhớ)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Export middleware upload để sử dụng trong router (sử dụng đối với các hàm cần upload ảnh)
module.exports.upload = upload.single('image'); // Chỉ định tên của file ảnh là "image"

module.exports.get_all_products = async (req, res) => {
    const { productNameSearch, brand, sortPrice, page } = req.query

    let filter = {};
    let sort = {};
    let limit = null;
    let skip = 0;
    let isFiltered = false;

    if (productNameSearch !== undefined) {
        if (productNameSearch !== "") {
            filter.name = { $regex: productNameSearch, $options: 'i' }
            isFiltered = true;
        }
    }
    if (brand !== undefined) {
        if (brand !== "All") {
            filter.brand = brand;
            isFiltered = true;
        }
    }
    if (sortPrice !== undefined) {
        if (sortPrice === "asc") {
            sort.retail_price = 1;
        }
        else if (sortPrice === "desc") {
            sort.retail_price = -1;
        }
    }
    if (page !== undefined && page > 0) {
        limit = 5;
        skip = (page - 1) * limit;
    }

    try {
        const totalLength = isFiltered ? await Product.countDocuments(filter) : await Product.countDocuments();

        let query = Product.find(filter).sort(sort);
        if (limit !== null) {
            query = query.skip(skip).limit(limit);
        }

        const products = await query;

        if (!products) {
            return res.status(404).json({ code: 1, message: 'Products not found' });
        }
        res.status(200).json({ code: 0, message: 'Products found', totalLength, data: products });
    } catch (error) {
        res.status(500).json({ code: 2, message: 'Error fetching all products', error: error.message });
    }
};

module.exports.get_products_for_customer = async (req, res) => {

    const { productNameSearch, brand, sortPrice, page } = req.query

    let filter = {};
    let sort = {};
    let limit = null;
    let skip = 0;
    let isFiltered = false;

    if (productNameSearch !== undefined) {
        if (productNameSearch !== "") {
            filter.name = { $regex: productNameSearch, $options: 'i' }
            isFiltered = true;
        }
    }
    if (brand !== undefined) {
        if (brand !== "All") {
            filter.brand = brand;
            isFiltered = true;
        }
    }
    if (sortPrice !== undefined) {
        if (sortPrice === "asc") {
            sort.retail_price = 1;
        }
        else if (sortPrice === "desc") {
            sort.retail_price = -1;
        }
    }
    if (page !== undefined && page > 0) {
        limit = 10;
        skip = (page - 1) * limit;
    }

    try {
        const totalLength = isFiltered ? await Product.countDocuments(filter) : await Product.countDocuments();

        let query = Product.find(filter).select('-import_price').sort(sort);
        if (limit !== null) {
            query = query.skip(skip).limit(limit);
        }

        const products = await query;

        if (!products) {
            return res.status(404).json({ code: 1, message: 'Products not found' });
        }
        res.status(200).json({ code: 0, message: 'Products found', totalLength, data: products });
    } catch (error) {
        res.status(500).json({ code: 2, message: 'Error fetching all products', error: error.message });
    }
};

module.exports.get_all_brands = async (req, res) => {
    try {
        const brands = await Product.distinct("brand");
        res.status(200).json({ code: 0, message: "Brands fetched", data: ["All", ...brands] });
    } catch (error) {
        res.status(500).json({ code: 2, message: "Error fetching brands", error: error.message });
    }
};


module.exports.get_product = async (req, res) => {
    const { id } = req.params;

    try {
        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({ code: 1, message: 'Product not found' });
        }
        res.status(200).json({ code: 0, message: 'Product found', data: product });
    } catch (error) {
        res.status(500).json({ code: 2, message: 'Error fetching product', error: error.message });
    }
};

module.exports.get_details_product = async (req, res) => {
    const { id } = req.params;

    try {
        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({ code: 1, message: 'Product not found' });
        }

        const detailsProduct = await DetailsProduct.findOne({ productId: id });

        if (!detailsProduct) {
            return res.status(404).json({ code: 1, message: 'DetailsProduct not found' });
        }

        const result = {
            ...product.toObject(),
            detailsProduct: detailsProduct
        };

        res.status(200).json({ code: 0, message: 'Details Product found', data: result });
    } catch (error) {
        res.status(500).json({ code: 2, message: 'Error fetching details product', error: error.message });
    }
};

module.exports.add_product = async (req, res) => {
    const { name, import_price, retail_price, brand, amount } = req.body;
    const { os, ram, storage, battery, screen_size, color, description } = req.body;
    const file = req.file;

    const errors = [];

    if (!name) errors.push('Name is required');
    if (!import_price || isNaN(import_price)) errors.push('Import price must be a number');
    if (!retail_price || isNaN(retail_price)) errors.push('Retail price must be a number');
    if (!brand) errors.push('Brand is required');
    if (!amount || isNaN(amount)) errors.push('Amount must be a number');

    if (!os) errors.push('OS is required');
    if (!ram) errors.push('RAM is required');
    if (!storage) errors.push('Storage is required');
    if (!battery) errors.push('Battery is required');
    if (!screen_size) errors.push('Screen size is required');
    if (!color) errors.push('Color is required');
    if (!description) errors.push('Description is required');

    if (!file) errors.push('No file uploaded');

    if (errors.length > 0) {
        return res.status(400).json({ code: 1, message: 'Validation failed', errors });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    let cloudinaryPublicId = null

    try {
        // Upload file lên Cloudinary
        const result = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream({
                folder: 'MobileDevicesBusinessApplication/products', // Thư mục trên Cloudinary (Home/MobileDevicesBusinessApplication/products)
                resource_type: 'image'
            }, (error, result) => {
                if (error) {
                    reject(error);  // Reject nếu có lỗi
                }
                resolve(result);  // Resolve khi upload thành công
            });

            uploadStream.end(file.buffer);  // Kết thúc quá trình upload
        });

        // Lưu lại public_id của ảnh
        cloudinaryPublicId = result.public_id;

        const newProduct = new Product({
            name, import_price, retail_price, brand, amount,
            url_image: result.secure_url
        });

        const savedProduct = await newProduct.save({ session });

        const newDetailsProduct = new DetailsProduct({
            productId: savedProduct._id,
            os, ram, storage, battery, screen_size, color, description
        });

        await newDetailsProduct.save({ session });

        // Commit transaction
        await session.commitTransaction();
        session.endSession();

        res.status(201).json({
            code: 0,
            message: 'Product and details added successfully',
            data: { product: savedProduct, details: newDetailsProduct }
        });
    }
    catch (error) {
        await session.abortTransaction(); // Hủy giao dịch nếu lỗi
        session.endSession();

        if (cloudinaryPublicId) {
            cloudinary.uploader.destroy(cloudinaryPublicId);
        }

        if (error.code === 11000) {
            const duplicateField = Object.keys(error.keyValue)[0]; // Lấy tên thuộc tính bị trùng
            return res.status(400).json({
                code: 1,
                message: `${duplicateField} must be unique`,
                error: error.message
            });
        }

        res.status(500).json({ code: 2, message: 'Error adding product and details', error: error.message });
    }
};

module.exports.edit_product = async (req, res) => {
    const { id } = req.params;
    const { name, import_price, retail_price, brand, amount } = req.body;
    const { os, ram, storage, battery, screen_size, color, description } = req.body;
    const file = req.file;

    const errors = [];

    if (!name) errors.push('Name is required');
    if (!import_price || isNaN(import_price)) errors.push('Import price must be a number');
    if (!retail_price || isNaN(retail_price)) errors.push('Retail price must be a number');
    if (!brand) errors.push('Brand is required');
    if (!amount || isNaN(amount)) errors.push('Amount must be a number');

    if (!os) errors.push('OS is required');
    if (!ram) errors.push('RAM is required');
    if (!storage) errors.push('Storage is required');
    if (!battery) errors.push('Battery is required');
    if (!screen_size) errors.push('Screen size is required');
    if (!color) errors.push('Color is required');
    if (!description) errors.push('Description is required');

    if (errors.length > 0) {
        return res.status(400).json({ code: 1, message: 'Validation failed', errors });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    let cloudinaryPublicId_new = null

    try {
        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({ code: 1, message: 'Product not found' });
        }

        const cloudinaryPublicId_old = extractFolderFromURL(product.url_image) + product.url_image.split('/').pop().split('.')[0]; // Lưu lại public_id cũ

        if (file) {

            const result = await new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream({
                    folder: 'MobileDevicesBusinessApplication/products',
                    resource_type: 'image'
                }, (error, result) => {
                    if (error) {
                        reject(error);
                    }
                    resolve(result);
                });

                uploadStream.end(file.buffer);
            });

            product.url_image = result.secure_url;
            cloudinaryPublicId_new = result.public_id; // Lưu lại public_id mới
        }

        product.name = name;
        product.import_price = import_price;
        product.retail_price = retail_price;
        product.brand = brand;
        product.amount = amount;
        product.creation_date = Date.now()

        const updatedProduct = await product.save({ session });

        const detailsProduct = await DetailsProduct.findOne({ productId: id });
        if (detailsProduct) {
            detailsProduct.os = os;
            detailsProduct.ram = ram;
            detailsProduct.storage = storage;
            detailsProduct.battery = battery;
            detailsProduct.screen_size = screen_size;
            detailsProduct.color = color;
            detailsProduct.description = description;

            await detailsProduct.save({ session });
        } else {
            // Nếu không tìm thấy chi tiết sản phẩm, tạo mới
            const newDetailsProduct = new DetailsProduct({
                productId: updatedProduct._id,
                os, ram, storage, battery, screen_size, color, description
            });
            await newDetailsProduct.save({ session });
        }

        await session.commitTransaction();
        session.endSession();

        if (file) {
            cloudinary.uploader.destroy(cloudinaryPublicId_old);
        }

        res.status(200).json({ code: 0, message: 'Product and details updated successfully', data: { product: updatedProduct, details: detailsProduct } });
    }
    catch (error) {
        await session.abortTransaction();
        session.endSession();

        if (cloudinaryPublicId_new) {
            cloudinary.uploader.destroy(cloudinaryPublicId_new);
        }

        if (error.code === 11000) {
            const duplicateField = Object.keys(error.keyValue)[0];
            return res.status(400).json({
                code: 1,
                message: `${duplicateField} must be unique`,
                error: error.message
            });
        }

        res.status(500).json({ code: 2, message: 'Error updating product and details', error: error.message });
    }
};

module.exports.delete_product = async (req, res) => {
    const { id } = req.params;

    try {
        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({ code: 1, message: 'Product not found' });
        }

        const orderDetails = await DetailsOrder.findOne({ productId: id });
        if (orderDetails) {
            return res.status(400).json({ code: 1, message: 'Product is in an order and cannot be deleted' });
        }

        const cloudinaryPublicId_old = extractFolderFromURL(product.url_image) + product.url_image.split('/').pop().split('.')[0]; // Lưu lại public_id cũ

        await Product.findByIdAndDelete(id);
        await DetailsProduct.findOneAndDelete({ productId: id })
        cloudinary.uploader.destroy(cloudinaryPublicId_old);

        res.status(200).json({ code: 0, message: 'Product deleted successfully' });
    } catch (error) {
        res.status(500).json({ code: 2, message: 'Error deleting product', error: error.message });
    }
};

module.exports.search_by_name = async (req, res) => {

    const { name } = req.query;

    if (!name) {
        return res.status(400).json({ code: 1, message: 'Name query parameter is required' });
    }

    try {
        const products = await Product.find({
            name: { $regex: name, $options: 'i' } //không phân biệt hoa thường
        });

        if (!products) {
            return res.status(404).json({ code: 1, message: 'Products not found' });
        }
        res.status(200).json({ code: 0, message: 'Products found', data: products });
    } catch (error) {
        res.status(500).json({ code: 2, message: 'Error fetching products by name', error: error.message });
    }
}

module.exports.filter_products = async (req, res) => {

    const { brand } = req.query;

    if (!brand) {
        return res.status(400).json({ code: 1, message: 'Brand query parameter is required' });
    }

    try {
        const products = await Product.find({
            brand: { $regex: `^${brand}$`, $options: 'i' }
        });

        if (!products) {
            return res.status(404).json({ code: 1, message: 'Products not found' });
        }
        res.status(200).json({ code: 0, message: 'Products found', data: products });
    } catch (error) {
        res.status(500).json({ code: 2, message: 'Error fetching products by filter', error: error.message });
    }
}

function extractFolderFromURL(url) {
    // Tách phần sau "upload/" (nếu có)
    const uploadIndex = url.indexOf('/upload/');
    if (uploadIndex === -1) return ''; // Không tìm thấy "/upload/", trả về chuỗi rỗng

    // Lấy phần sau "/upload/"
    const path = url.substring(uploadIndex + 8);

    // Loại bỏ tiền tố "v[digits]/" nếu có
    const cleanedPath = path.replace(/^v\d+\//, '');

    // Tìm vị trí của dấu "/" cuối cùng
    const lastSlashIndex = cleanedPath.lastIndexOf('/');

    // Trích xuất toàn bộ path (không có tiền tố "v[digits]/")
    if (lastSlashIndex !== -1) {
        return cleanedPath.substring(0, lastSlashIndex + 1);
    }

    // Nếu không có thư mục
    return ''; // Trả về chuỗi rỗng
}