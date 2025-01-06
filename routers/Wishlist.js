const express = require('express')
const Router = express.Router()

const Controller = require('../controllers/Wishlist')

Router.get('/:customerId', Controller.get_wishlist);

Router.post('/add/:customerId/:productId', Controller.add_product_to_wishlist);

Router.delete('/remove/:customerId/:productId', Controller.remove_product_from_wishlist);

module.exports = Router