const express = require('express')
const Router = express.Router()
const authenticateToken = require('../middlewares/authenticateToken');


const Controller = require('../controllers/Report')

Router.get('/orders', authenticateToken(['admin, manager']), Controller.get_report_orders)

Router.get('/orders/:id', authenticateToken(['admin, manager']), Controller.get_report_order)

Router.get('/orders/details/:id', authenticateToken(['admin, manager']), Controller.get_report_details_order)

Router.get('/products', authenticateToken(['admin, manager']), Controller.get_report_products)

module.exports = Router