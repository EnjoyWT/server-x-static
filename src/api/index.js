const express = require('express');
const apiController = require('../controllers/api.controller');

const router = express.Router();

router.get('/info', apiController.getInfo);
router.get('/user/:name', apiController.getUser);

module.exports = router;
