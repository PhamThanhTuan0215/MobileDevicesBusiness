require('dotenv').config();
const nodemailer = require('nodemailer');
const { EMAIL_USER, EMAIL_PASSWORD } = process.env;

let transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    service: 'gmail',
    auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASSWORD
    }
});

async function sendMail(email, newPassword) {
    // Prepare email content
    let mailOptions = {
        from: EMAIL_USER,
        to: email,
        subject: 'Your New Password',
        text: `Here is your new password: ${newPassword}`,
        html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <h2 style="color: #4CAF50;">New Password Notification</h2>
                <p>Dear User,</p>
                <p>We have generated a new password for your account. Please use the following password to log in:</p>
                <p style="font-weight: bold; font-size: 16px; color: #ff0000;">${newPassword}</p>
                <p>Please make sure to change your password once you log in for security reasons.</p>
                <p>If you did not request this change, please contact our support team immediately.</p>
                <br>
                <p>Best regards,</p>
            </div>
        `
    };

    // Send email with the new password
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return false
        } else {
            return true
        }
    });
}


module.exports = sendMail;