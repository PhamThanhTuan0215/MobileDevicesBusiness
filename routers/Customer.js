const express = require('express')
const Router = express.Router()

const Controller = require('../controllers/Customer')

Router.post('/', Controller.addNewCustomer)

Router.get('/', Controller.getAllCustomer)

Router.get('/:id', Controller.getCustomerById)

Router.patch('/:id', Controller.upload , Controller.updateCustomerById)

Router.delete('/:id', Controller.deleteCustomerByID)

Router.post('/login', Controller.upload , Controller.login)

Router.patch('/changePassword/:id', Controller.upload , Controller.changePassword)

module.exports = Router