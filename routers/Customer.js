const express = require('express')
const Router = express.Router()
const authenticateToken = require('../middlewares/authenticateToken');

const Controller = require('../controllers/Customer')

Router.post('/', Controller.addNewCustomer)

Router.get('/', authenticateToken(['manager', 'admin']), Controller.getAllCustomer)

Router.get('/:id', Controller.getCustomerById)

Router.patch('/:id', authenticateToken(['customer', 'admin', 'manager']), Controller.upload , Controller.updateCustomerById)

Router.delete('/:id', authenticateToken(['manager', 'admin']), Controller.deleteCustomerByID)

Router.post('/login', Controller.upload , Controller.login)

Router.patch('/changePassword/:id', Controller.upload , Controller.changePassword)

Router.post('/forgotPassword', Controller.forgotPassword)

module.exports = Router