const express = require('express')
const Router = express.Router()
const authenticateToken = require('../middlewares/authenticateToken');

const Controller = require('../controllers/Wishlist')

Router.get('/:customerId', authenticateToken(['customer']), Controller.get_wishlist);

Router.post('/add/:customerId/:productId', authenticateToken(['customer']), Controller.add_product_to_wishlist);

Router.delete('/remove/:customerId/:productId', authenticateToken(['customer']), Controller.remove_product_from_wishlist);

module.exports = Router