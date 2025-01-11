const express = require('express')
const Router = express.Router()

const Controller = require('../controllers/Report')

Router.get('/orders', Controller.get_report_orders)

Router.get('/orders/:id', Controller.get_report_order)

Router.get('/orders/details/:id', Controller.get_report_details_order)

Router.get('/products', Controller.get_report_products)

module.exports = Router