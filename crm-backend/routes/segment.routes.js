const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/segment.controller');

router.post('/preview', ctrl.previewRules);
router.post('/',        ctrl.createSegment);
router.get('/',         ctrl.getSegments);
router.get('/:id/preview', ctrl.previewSegment);
router.delete('/:id',   ctrl.deleteSegment);

module.exports = router;
