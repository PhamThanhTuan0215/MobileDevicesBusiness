const express = require('express')
const Router = express.Router()

const Controller = require('../controllers/Order')

Router.get('/', Controller.get_all_order);

Router.get('/my-orders/:customerId', Controller.get_my_orders);

Router.get('/:id', Controller.get_order);

Router.get('/details/:id', Controller.get_details_order);

Router.post('/add/:customerId', Controller.add_order);

Router.put('/change-status-order/:id', Controller.change_status_order);

Router.delete('/cancel/:id', Controller.delete_order);

module.exports = Router