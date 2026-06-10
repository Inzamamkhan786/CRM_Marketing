const axios = require('axios');

const CHANNEL_SERVICE_URL = process.env.CHANNEL_SERVICE_URL || 'http://localhost:5000';

/**
 * Dispatches a single communication to the channel service.
 * Fire-and-forget — channel service handles delivery simulation and callbacks.
 */
async function dispatchCampaign({ communicationId, campaignId, customerId, channel, message }) {
  try {
    await axios.post(`${CHANNEL_SERVICE_URL}/send`, {
      communicationId,
      campaignId,
      customerId,
      channel,
      message,
    }, { timeout: 5000 });
  } catch (err) {
    console.error(`Failed to dispatch to channel service for customer ${customerId}:`, err.message);
    // Don't throw — channel service may be temporarily unavailable
  }
}

module.exports = { dispatchCampaign };
