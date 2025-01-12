const express = require('express')
const Router = express.Router()
const authenticateToken = require('../middlewares/authenticateToken');

const Controller = require('../controllers/Review')

Router.get('/:productId', Controller.get_list_review);

Router.post('/add/:customerId/:productId', authenticateToken(['customer']), Controller.write_review);

Router.delete('/delete/:customerId/:reviewId', authenticateToken(['customer', 'admin', 'manager']), Controller.delete_review);

module.exports = Router