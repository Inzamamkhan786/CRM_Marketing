const axios = require('axios');
const pool  = require('../db/pool');

const CHANNEL_SERVICE_URL = process.env.CHANNEL_SERVICE_URL || 'http://localhost:5000';

/**
 * Dispatches a single communication to the channel service (fire-and-forget).
 * Used for audit/logging purposes; actual delivery simulation runs locally.
 */
async function dispatchCampaign({ communicationId, campaignId, customerId, channel, message }) {
  try {
    await axios.post(`${CHANNEL_SERVICE_URL}/send`, {
      communicationId, campaignId, customerId, channel, message,
    }, { timeout: 5000 });
  } catch (err) {
    // Non-critical — local simulation below handles analytics regardless
    console.warn(`Channel service unreachable for customer ${customerId}: ${err.message}`);
  }
}

/**
 * Simulates the full delivery lifecycle directly in the CRM backend.
 * Writes receipts to the DB without relying on cross-service callbacks.
 *
 * Probabilities (per spec):
 *   80% DELIVERED → 60% of those OPENED → 20% of those CLICKED
 *   20% FAILED
 */
async function simulateDeliveryLocal(communicationId) {
  const delay = (ms) => new Promise((r) => setTimeout(r, ms));
  const rand  = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

  try {
    // Step 1: Delivery attempt (1–3 seconds)
    await delay(rand(1000, 3000));

    const isDelivered = Math.random() < 0.80;

    if (!isDelivered) {
      await pool.query(
        `INSERT INTO receipts (communication_id, event_type) VALUES ($1, 'FAILED')`,
        [communicationId]
      );
      await pool.query(
        `UPDATE communications SET status = 'FAILED' WHERE id = $1`,
        [communicationId]
      );
      return;
    }

    // Delivered
    await pool.query(
      `INSERT INTO receipts (communication_id, event_type) VALUES ($1, 'DELIVERED')`,
      [communicationId]
    );
    await pool.query(
      `UPDATE communications SET status = 'DELIVERED' WHERE id = $1`,
      [communicationId]
    );

    // Step 2: Open event (2–5 seconds after delivery)
    await delay(rand(2000, 5000));
    if (Math.random() >= 0.60) return; // 60% open rate

    await pool.query(
      `INSERT INTO receipts (communication_id, event_type) VALUES ($1, 'OPENED')`,
      [communicationId]
    );
    await pool.query(
      `UPDATE communications SET status = 'OPENED' WHERE id = $1`,
      [communicationId]
    );

    // Step 3: Click event (3–7 seconds after open)
    await delay(rand(3000, 7000));
    if (Math.random() >= 0.20) return; // 20% click rate

    await pool.query(
      `INSERT INTO receipts (communication_id, event_type) VALUES ($1, 'CLICKED')`,
      [communicationId]
    );
    await pool.query(
      `UPDATE communications SET status = 'CLICKED' WHERE id = $1`,
      [communicationId]
    );
  } catch (err) {
    console.error(`simulateDeliveryLocal error for comm=${communicationId}:`, err.message);
  }
}

module.exports = { dispatchCampaign, simulateDeliveryLocal };
