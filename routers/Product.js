const express = require('express')
const Router = express.Router()
const authenticateToken = require('../middlewares/authenticateToken');

const Controller = require('../controllers/Product')

Router.get('/', Controller.get_all_products);

Router.get('/search', Controller.search_by_name);

Router.get('/filter', Controller.filter_products);

Router.get('/:id', Controller.get_product);

Router.get('/details/:id', Controller.get_details_product);

Router.post('/add', authenticateToken(['admin', 'manager']), Controller.upload, Controller.add_product)

Router.put('/edit/:id', authenticateToken(['admin', 'manager']), Controller.upload, Controller.edit_product)

Router.delete('/delete/:id', authenticateToken(['admin', 'manager']), Controller.delete_product)

module.exports = Router