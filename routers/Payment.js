const express = require('express')
const Router = express.Router()
const authenticateToken = require('../middlewares/authenticateToken');

const Controller = require('../controllers/Payment')

Router.post('/create_payment_url', Controller.VNPay);

Router.get("/vnpay_return", Controller.VNPayReturn)

module.exports = Router