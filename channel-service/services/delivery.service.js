/**
 * Delivery Service — Simulates realistic message delivery lifecycle
 *
 * Simulation probabilities (per the spec):
 *   80% DELIVERED  (after 1–3s)
 *   20% FAILED     (after 1–3s)
 *
 *   Of DELIVERED:
 *     60% OPENED   (after 2–5s additional)
 *
 *     Of OPENED:
 *       20% CLICKED (after 3–7s additional)
 */

const axios = require('axios');

const CRM_BACKEND_URL = process.env.CRM_BACKEND_URL || 'http://localhost:4000';

/**
 * Sends a delivery event back to the CRM receipt endpoint.
 */
async function sendCallback({ communicationId, campaignId, customerId, eventType }) {
  try {
    await axios.post(`${CRM_BACKEND_URL}/receipts`, {
      communicationId,
      campaignId,
      customerId,
      eventType,
    }, { timeout: 5000 });
    console.log(`📬 Callback sent: comm=${communicationId} event=${eventType}`);
  } catch (err) {
    console.error(`❌ Callback failed for comm=${communicationId} event=${eventType}:`, err.message);
  }
}

/**
 * Delays execution by ms milliseconds.
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Returns a random integer between min and max (inclusive).
 */
function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Main simulation function — called asynchronously for each message.
 */
async function simulateDelivery({ communicationId, campaignId, customerId, channel, message }) {
  // Step 1: Delivery attempt (1–3 seconds)
  const deliveryDelay = randomBetween(1000, 3000);
  await delay(deliveryDelay);

  const isDelivered = Math.random() < 0.80; // 80% delivered

  if (!isDelivered) {
    await sendCallback({ communicationId, campaignId, customerId, eventType: 'FAILED' });
    return; // Stop here for failed messages
  }

  // Message delivered
  await sendCallback({ communicationId, campaignId, customerId, eventType: 'DELIVERED' });

  // Step 2: Open event (2–5 seconds after delivery)
  const openDelay = randomBetween(2000, 5000);
  await delay(openDelay);

  const isOpened = Math.random() < 0.60; // 60% of delivered get opened
  if (!isOpened) return;

  await sendCallback({ communicationId, campaignId, customerId, eventType: 'OPENED' });

  // Step 3: Click event (3–7 seconds after open)
  const clickDelay = randomBetween(3000, 7000);
  await delay(clickDelay);

  const isClicked = Math.random() < 0.20; // 20% of opened get clicked
  if (!isClicked) return;

  await sendCallback({ communicationId, campaignId, customerId, eventType: 'CLICKED' });
}

module.exports = { simulateDelivery };
