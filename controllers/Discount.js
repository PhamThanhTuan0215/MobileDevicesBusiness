const Discount = require('../models/Discount');

module.exports.getAllDiscounts = async (req, res) => {

    try {
        const discounts = await Discount.find();
        res.status(200).json({code: 0, message: 'Discounts retrieved successfully', data: discounts});
    } catch (error) {
        res.status(500).json({code: 2, message: 'Error fetching discounts', error: error.message});
    }

};

module.exports.addNewDiscount = async (req, res) => {

    const {type, value, start_date, end_date} = req.body;

    const errors = [];

    if (!type) {
        errors.push('Type is required');
    }
    if (!value) {
        errors.push('Value is required');
    }
    if (!start_date) {
        errors.push('Start date is required');
    }
    if (!end_date) {
        errors.push('End date is required');
    }

    if (errors.length > 0) {
        return res.status(400).json({code: 1, message: 'Validation error', errors: errors});
    }

    let code;
    let isCodeUnique = false;

    try {

        while (!isCodeUnique) {
            code = generateRandomCode();

            const existingDiscount = await Discount.findOne({ code });
            if (!existingDiscount) {
                isCodeUnique = true;
            }
        }

        const discount = new Discount({
            code,
            type,
            value,
            start_date,
            end_date,
        });

        await discount.save();
        res.status(201).json({code: 0, message: 'Discount added successfully', data: discount});
    } catch (error) {
        res.status(500).json({code: 2, message: 'Error adding discount', error: error.message});
    }

}

module.exports.getDiscountById = async (req, res) => {
    
    const { id } = req.params;

    try {
        const discount = await Discount.findById(id);
        if (!discount) {
            return res.status(404).json({code: 1, message: 'Discount not found'});
        }
        res.status(200).json({code: 0, message: 'Discount retrieved successfully', data: discount});
    } catch (error) {
        res.status(500).json({code: 2, message: 'Error fetching discount', error: error.message});
    }

}

module.exports.updateDiscountById = async (req, res) => {
    
    const { id } = req.params;
    const { type, value, start_date, end_date } = req.body;

    const errors = [];

    if (!type) {
        errors.push('Type is required');
    }
    if (!value) {
        errors.push('Value is required');
    }
    if (!start_date) {
        errors.push('Start date is required');
    }
    if (!end_date) {
        errors.push('End date is required');
    }

    if (errors.length > 0) {
        return res.status(400).json({code: 1, message: 'Validation error', errors: errors});
    }

    try {
        const discount = await Discount.findById(id);
        if (!discount) {
            return res.status(404).json({code: 1, message: 'Discount not found'});
        }

        discount.type = type;
        discount.value = value;
        discount.start_date = start_date;
        discount.end_date = end_date;

        await discount.save();
        res.status(200).json({code: 0, message: 'Discount updated successfully', data: discount});

    } catch (error) {
        res.status(500).json({code: 2, message: 'Error updating discount', error: error.message});
    }

}

module.exports.deleteDiscountByID = async (req, res) => {
    const { id } = req.params;
    try {
        const discount = await Discount.findByIdAndDelete(id);
        if (!discount) {
            return res.status(404).json({code: 1, message: 'Discount not found'});
        }

        res.status(200).json({code: 0, message: 'Discount deleted successfully', data: discount});
    }
    catch (error) {
        res.status(500).json({code: 2, message: 'Error deleting discount', error: error.message});
    }
}

module.exports.applyDiscount = async (req, res) => {
    const { code, price } = req.body;

    // Kiểm tra giá trị đầu vào
    if (!code) {
        return res.status(400).json({ code: 1, message: 'Code is required' });
    }
    if (!price || price <= 0) {
        return res.status(400).json({ code: 2, message: 'Valid price is required' });
    }

    try {
        const discount = await Discount.findOne({ code });

        if (!discount) {
            return res.status(404).json({ code: 3, message: 'Discount code not found' });
        }

        const currentDate = new Date();

        // Kiểm tra ngày bắt đầu và kết thúc của mã giảm giá
        if (currentDate < new Date(discount.start_date) || currentDate > new Date(discount.end_date)) {
            return res.status(400).json({ code: 4, message: 'Discount code is not valid at this time' });
        }

        let paymentPrice = price;
        let discountPrice = 0;

        if (discount.type === 'percentage') {
            // Giảm giá theo phần trăm
            discountPrice = (price * discount.value / 100);
        } else if (discount.type === 'fixed') {
            // Giảm giá theo số tiền cố định
            discountPrice = discount.value;
        }

        paymentPrice = price - discountPrice;

        // Đảm bảo giá không âm
        paymentPrice = Math.max(0, paymentPrice);

        res.status(200).json({
            code: 0,
            message: 'Discount applied successfully',
            originalPrice: price,
            discountPrice,
            paymentPrice,
        });
    } catch (error) {
        res.status(500).json({ code: 5, message: 'Error calculating discount', error: error.message });
    }
};

function generateRandomCode(length = 6) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let randomCode = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        randomCode += characters[randomIndex];
    }
    return randomCode;
}