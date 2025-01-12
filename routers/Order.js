const express = require('express')
const Router = express.Router()

const Controller = require('../controllers/Order')
const authenticateToken = require('../middlewares/authenticateToken');

Router.get('/', authenticateToken(['admin', 'manager']), Controller.get_all_order);

Router.get('/my-orders/:customerId', authenticateToken(['customer']), Controller.get_my_orders);

Router.get('/:id', authenticateToken(['customer']), Controller.get_order);

Router.get('/details/:id', authenticateToken(['customer']), Controller.get_details_order);

Router.post('/add/:customerId', authenticateToken(['customer']), Controller.add_order);

Router.put('/change-status-order/:id', authenticateToken(['admin', 'manager']), Controller.change_status_order);

Router.delete('/cancel/:id', authenticateToken(['customer']), Controller.cancel_order);

module.exports = Router