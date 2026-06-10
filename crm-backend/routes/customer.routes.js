const express = require('express');
const multer  = require('multer');
const router  = express.Router();
const ctrl    = require('../controllers/customer.controller');

const upload = multer({ storage: multer.memoryStorage() });

router.post('/import', upload.single('file'), ctrl.importCSV);
router.post('/',       ctrl.addCustomer);
router.get('/',        ctrl.getCustomers);
router.get('/:id',     ctrl.getCustomerById);
router.put('/:id',     ctrl.updateCustomer);
router.delete('/:id',  ctrl.deleteCustomer);

module.exports = router;
