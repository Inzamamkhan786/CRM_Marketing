const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/receipt.controller');

router.post('/',                      ctrl.handleReceipt);
router.get('/:communicationId',       ctrl.getReceipts);

module.exports = router;
