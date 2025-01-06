const express = require('express')
const Router = express.Router()

const Controller = require('../controllers/Product')

Router.get('/', Controller.get_all_products);

Router.get('/:id', Controller.get_product);

Router.get('/details/:id', Controller.get_details_product);

Router.post('/add', Controller.upload, Controller.add_product)

Router.put('/edit/:id', Controller.upload, Controller.edit_product)

Router.delete('/delete/:id', Controller.delete_product)

module.exports = Router