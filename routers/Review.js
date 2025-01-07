const express = require('express')
const Router = express.Router()

const Controller = require('../controllers/Review')

Router.get('/:productId', Controller.get_list_review);

Router.post('/add/:customerId/:productId', Controller.write_review);

Router.delete('/delete/:customerId/:reviewId', Controller.delete_review);

module.exports = Router