const express = require('express')
const Router = express.Router()

const Controller = require('../controllers/Discount')
const authenticateToken = require('../middlewares/authenticateToken');

Router.get('/', authenticateToken(['admin']), Controller.getAllDiscounts)

Router.post('/', authenticateToken(['admin']), Controller.addNewDiscount)

Router.get('/:id', authenticateToken(['admin']), Controller.getDiscountById)

Router.patch('/:id', authenticateToken(['admin']), Controller.updateDiscountById)

Router.delete('/:id', authenticateToken(['admin']), Controller.deleteDiscountByID)

Router.post('/apply', Controller.applyDiscount)

module.exports = Router