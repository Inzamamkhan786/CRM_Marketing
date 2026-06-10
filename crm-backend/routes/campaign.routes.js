const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/campaign.controller');

router.post('/',           ctrl.createCampaign);
router.get('/',            ctrl.getCampaigns);
router.get('/:id',         ctrl.getCampaignById);
router.post('/:id/send',   ctrl.sendCampaign);

module.exports = router;
