const express = require('express')
const Router = express.Router()

const Controller = require('../controllers/Manager')

Router.post('/', Controller.upload, function (req, res) {
    Controller.addNewManager
})

Router.get('/', Controller.getAllManager)

Router.get('/:id', Controller.getManagerById)

Router.patch('/:id', Controller.upload , Controller.updateManagerById)

Router.delete('/:id', Controller.deleteManagerByID)

Router.post('/login', Controller.upload , function (req, res){
    Controller.login
})

Router.patch('/changePassword/:id', Controller.upload , Controller.changePassword)

module.exports = Router