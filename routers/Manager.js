const express = require('express')
const Router = express.Router()
const authenticateToken = require('../middlewares/authenticateToken');

const Controller = require('../controllers/Manager')

Router.post('/', authenticateToken(['manager', 'admin']), Controller.upload, Controller.addNewManager
)

Router.get('/', authenticateToken(['admin']), Controller.getAllManager)

Router.get('/:id', Controller.getManagerById)

Router.patch('/:id', Controller.upload , Controller.updateManagerById)

Router.delete('/:id', authenticateToken(['admin']), Controller.deleteManagerByID)

Router.post('/login', Controller.upload , Controller.login)

Router.patch('/changePassword/:id', Controller.upload , Controller.changePassword)

module.exports = Router