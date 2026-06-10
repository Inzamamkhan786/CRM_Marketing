const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/analytics.controller');

router.get('/summary',        ctrl.getOverallAnalytics);
router.get('/:campaignId',    ctrl.getCampaignAnalytics);

module.exports = router;
