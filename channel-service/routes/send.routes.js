const express = require('express');
const router  = express.Router();
const { simulateDelivery } = require('../services/delivery.service');

// POST /send
// Called by CRM backend when a campaign is dispatched
router.post('/', (req, res) => {
  const { communicationId, campaignId, customerId, channel, message } = req.body;

  if (!communicationId || !customerId) {
    return res.status(400).json({ error: 'communicationId and customerId are required' });
  }

  // Acknowledge immediately (fire-and-forget pattern)
  res.status(202).json({
    accepted: true,
    communicationId,
    customerId,
    channel,
    note: 'Delivery simulation started. Callbacks will be sent to CRM.',
  });

  // Simulate delivery asynchronously
  simulateDelivery({ communicationId, campaignId, customerId, channel, message });
});

module.exports = router;
