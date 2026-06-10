const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/order.controller');

router.post('/', ctrl.addOrder);
router.get('/',  ctrl.getOrders);

module.exports = router;
