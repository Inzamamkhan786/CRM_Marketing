const pool = require('../db/pool');

// GET /analytics/:campaignId
const getCampaignAnalytics = async (req, res) => {
  try {
    const { campaignId } = req.params;

    // Overall communication status breakdown
    const statusBreakdown = await pool.query(`
      SELECT status, COUNT(*) AS count
      FROM communications
      WHERE campaign_id = $1
      GROUP BY status
    `, [campaignId]);

    // Event type breakdown from receipts
    const eventBreakdown = await pool.query(`
      SELECT r.event_type, COUNT(*) AS count
      FROM receipts r
      JOIN communications comm ON r.communication_id = comm.id
      WHERE comm.campaign_id = $1
      GROUP BY r.event_type
    `, [campaignId]);

    // Campaign meta
    const campaign = await pool.query(`
      SELECT c.*, s.name AS segment_name, s.audience_size
      FROM campaigns c
      LEFT JOIN segments s ON c.segment_id = s.id
      WHERE c.id = $1
    `, [campaignId]);

    if (campaign.rows.length === 0) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Build metrics map
    const statusMap = {};
    statusBreakdown.rows.forEach(r => { statusMap[r.status] = parseInt(r.count); });

    const eventMap = {};
    eventBreakdown.rows.forEach(r => { eventMap[r.event_type] = parseInt(r.count); });

    const total     = Object.values(statusMap).reduce((a, b) => a + b, 0) || 1;
    const sent      = total;
    const delivered = (eventMap['DELIVERED'] || 0);
    const opened    = (eventMap['OPENED']    || 0);
    const clicked   = (eventMap['CLICKED']   || 0);
    const failed    = (eventMap['FAILED']    || 0);

    res.json({
      campaign: campaign.rows[0],
      stats: {
        sent,
        delivered,
        opened,
        clicked,
        failed,
        delivery_rate: sent > 0 ? ((delivered / sent) * 100).toFixed(1) : '0',
        open_rate:     delivered > 0 ? ((opened / delivered) * 100).toFixed(1) : '0',
        click_rate:    opened > 0    ? ((clicked / opened)   * 100).toFixed(1) : '0',
        failure_rate:  sent > 0      ? ((failed / sent)      * 100).toFixed(1) : '0',
      },
      status_breakdown: statusMap,
      event_breakdown:  eventMap,
    });
  } catch (err) {
    console.error('getCampaignAnalytics error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /analytics  — summary across all campaigns
const getOverallAnalytics = async (req, res) => {
  try {
    const totalCustomers = await pool.query('SELECT COUNT(*) FROM customers');
    const totalOrders    = await pool.query('SELECT COUNT(*) FROM orders');
    const totalRevenue   = await pool.query('SELECT COALESCE(SUM(amount), 0) AS total FROM orders');
    const totalCampaigns = await pool.query('SELECT COUNT(*) FROM campaigns');

    const recentCampaigns = await pool.query(`
      SELECT c.id, c.name, c.channel, c.status, c.created_at,
             COUNT(DISTINCT comm.id) AS total_sent,
             COUNT(DISTINCT CASE WHEN r.event_type = 'DELIVERED' THEN r.id END) AS delivered,
             COUNT(DISTINCT CASE WHEN r.event_type = 'OPENED'    THEN r.id END) AS opened,
             COUNT(DISTINCT CASE WHEN r.event_type = 'CLICKED'   THEN r.id END) AS clicked
      FROM campaigns c
      LEFT JOIN communications comm ON comm.campaign_id = c.id
      LEFT JOIN receipts r ON r.communication_id = comm.id
      GROUP BY c.id
      ORDER BY c.created_at DESC
      LIMIT 10
    `);

    res.json({
      summary: {
        total_customers: parseInt(totalCustomers.rows[0].count),
        total_orders:    parseInt(totalOrders.rows[0].count),
        total_revenue:   parseFloat(totalRevenue.rows[0].total),
        total_campaigns: parseInt(totalCampaigns.rows[0].count),
      },
      recent_campaigns: recentCampaigns.rows,
    });
  } catch (err) {
    console.error('getOverallAnalytics error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { getCampaignAnalytics, getOverallAnalytics };
