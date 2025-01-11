const express = require('express')
const Router = express.Router()

const Controller = require('../controllers/Discount')

Router.get('/', Controller.getAllDiscounts)

Router.post('/', Controller.addNewDiscount)

Router.get('/:id', Controller.getDiscountById)

Router.patch('/:id', Controller.updateDiscountById)

Router.delete('/:id', Controller.deleteDiscountByID)

Router.post('/apply', Controller.applyDiscount)

module.exports = Router