const express = require('express')
const Router = express.Router()
const authenticateToken = require('../middlewares/authenticateToken');

const Controller = require('../controllers/Cart')

Router.get('/:customerId', authenticateToken(['customer']) ,Controller.get_cart);

Router.post('/add/:customerId/:productId', authenticateToken(['customer']), Controller.add_product_to_cart);

Router.delete('/remove/:id', authenticateToken(['customer']), Controller.remove_product_from_cart);

module.exports = Router