const express = require('express')
const Router = express.Router()

const Controller = require('../controllers/Cart')

Router.get('/:customerId', Controller.get_cart);

Router.post('/add/:customerId/:productId', Controller.add_product_to_cart);

Router.delete('/remove/:customerId/:productId', Controller.remove_product_from_cart);

module.exports = Router