const pool = require('../db/pool');
const { buildSegmentQuery } = require('../services/segment.service');
const { dispatchCampaign } = require('../services/campaign.service');

// POST /campaigns
const createCampaign = async (req, res) => {
  try {
    const { name, segment_id, channel, message } = req.body;
    if (!name || !message) return res.status(400).json({ error: 'name and message are required' });

    const result = await pool.query(
      `INSERT INTO campaigns (name, segment_id, channel, message, status)
       VALUES ($1, $2, $3, $4, 'DRAFT') RETURNING *`,
      [name, segment_id || null, channel || 'Email', message]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('createCampaign error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /campaigns
const getCampaigns = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.*, s.name AS segment_name, s.audience_size
      FROM campaigns c
      LEFT JOIN segments s ON c.segment_id = s.id
      ORDER BY c.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('getCampaigns error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /campaigns/:id
const getCampaignById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT c.*, s.name AS segment_name, s.audience_size, s.rules
      FROM campaigns c
      LEFT JOIN segments s ON c.segment_id = s.id
      WHERE c.id = $1
    `, [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Campaign not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('getCampaignById error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /campaigns/:id/send  — trigger sending
const sendCampaign = async (req, res) => {
  try {
    const { id } = req.params;

    const campResult = await pool.query(`
      SELECT c.*, s.rules FROM campaigns c
      LEFT JOIN segments s ON c.segment_id = s.id
      WHERE c.id = $1
    `, [id]);
    if (campResult.rows.length === 0) return res.status(404).json({ error: 'Campaign not found' });

    const campaign = campResult.rows[0];
    if (campaign.status === 'SENT') {
      return res.status(409).json({ error: 'Campaign already sent' });
    }

    // Resolve audience
    let customers = [];
    if (campaign.rules) {
      const { sql, params } = buildSegmentQuery(campaign.rules);
      const result = await pool.query(sql, params);
      customers = result.rows;
    } else {
      // No segment — send to all customers
      const result = await pool.query('SELECT * FROM customers');
      customers = result.rows;
    }

    if (customers.length === 0) {
      return res.status(400).json({ error: 'No customers in audience' });
    }

    // Update campaign status to SENDING
    await pool.query(`UPDATE campaigns SET status='SENDING' WHERE id=$1`, [id]);

    // Create communication records for each customer
    const commInserts = customers.map(c =>
      pool.query(
        `INSERT INTO communications (campaign_id, customer_id, status) VALUES ($1, $2, 'PENDING') RETURNING id`,
        [id, c.id]
      )
    );
    const commResults = await Promise.all(commInserts);

    // Dispatch to channel service asynchronously (fire and forget)
    const dispatches = commResults.map((r, i) =>
      dispatchCampaign({
        communicationId: r.rows[0].id,
        campaignId: id,
        customerId: customers[i].id,
        channel: campaign.channel,
        message: campaign.message,
      })
    );
    Promise.all(dispatches).catch(err => console.error('Dispatch error:', err));

    // Mark as SENT
    await pool.query(`UPDATE campaigns SET status='SENT' WHERE id=$1`, [id]);

    res.json({
      message: `Campaign dispatched to ${customers.length} customers`,
      campaign_id: id,
      audience_size: customers.length,
    });
  } catch (err) {
    console.error('sendCampaign error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { createCampaign, getCampaigns, getCampaignById, sendCampaign };
