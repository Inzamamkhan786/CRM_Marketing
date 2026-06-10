const pool = require('../db/pool');

// POST /receipts  — called by channel service when a delivery event occurs
const handleReceipt = async (req, res) => {
  try {
    const { communicationId, campaignId, customerId, eventType } = req.body;

    if (!eventType) {
      return res.status(400).json({ error: 'eventType is required' });
    }

    // Find communication record
    let commId = communicationId;
    if (!commId && campaignId && customerId) {
      const comm = await pool.query(
        `SELECT id FROM communications
         WHERE campaign_id = $1 AND customer_id = $2
         ORDER BY sent_at DESC LIMIT 1`,
        [campaignId, customerId]
      );
      if (comm.rows.length > 0) commId = comm.rows[0].id;
    }

    if (!commId) {
      return res.status(404).json({ error: 'Communication record not found' });
    }

    // Insert receipt event
    await pool.query(
      `INSERT INTO receipts (communication_id, event_type) VALUES ($1, $2)`,
      [commId, eventType.toUpperCase()]
    );

    // Update communication status to latest event
    const statusPriority = { FAILED: 1, PENDING: 2, DELIVERED: 3, OPENED: 4, CLICKED: 5 };
    const currentStatus = await pool.query(
      'SELECT status FROM communications WHERE id = $1',
      [commId]
    );

    const current  = currentStatus.rows[0]?.status || 'PENDING';
    const incoming = eventType.toUpperCase();

    if ((statusPriority[incoming] || 0) > (statusPriority[current] || 0)) {
      await pool.query(
        'UPDATE communications SET status = $1 WHERE id = $2',
        [incoming, commId]
      );
    }

    res.json({ message: 'Receipt recorded', communication_id: commId, event_type: incoming });
  } catch (err) {
    console.error('handleReceipt error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /receipts/:communicationId
const getReceipts = async (req, res) => {
  try {
    const { communicationId } = req.params;
    const result = await pool.query(
      'SELECT * FROM receipts WHERE communication_id = $1 ORDER BY event_time ASC',
      [communicationId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('getReceipts error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { handleReceipt, getReceipts };
