const pool = require('../db/pool');

const getAnalyticsTool = {
  type: 'function',
  function: {
    name: 'getAnalytics',
    description:
      'Fetches campaign performance analytics: delivery rate, open rate, click rate, failure rate.',
    parameters: {
      type: 'object',
      properties: {
        campaign_id: {
          type: 'number',
          description: 'ID of the campaign to fetch analytics for',
        },
      },
      required: ['campaign_id'],
    },
  },
};

async function getAnalyticsHandler({ campaign_id }) {
  const campaign = await pool.query(
    'SELECT id, name, channel, status FROM campaigns WHERE id=$1',
    [campaign_id]
  );
  if (campaign.rows.length === 0) throw new Error(`Campaign ${campaign_id} not found`);

  const eventBreakdown = await pool.query(`
    SELECT r.event_type, COUNT(*) AS count
    FROM receipts r
    JOIN communications comm ON r.communication_id = comm.id
    WHERE comm.campaign_id = $1
    GROUP BY r.event_type
  `, [campaign_id]);

  const total = await pool.query(
    'SELECT COUNT(*) FROM communications WHERE campaign_id=$1',
    [campaign_id]
  );

  const eventMap = {};
  eventBreakdown.rows.forEach(r => { eventMap[r.event_type] = parseInt(r.count); });

  const sent      = parseInt(total.rows[0].count) || 0;
  const delivered = eventMap['DELIVERED'] || 0;
  const opened    = eventMap['OPENED']    || 0;
  const clicked   = eventMap['CLICKED']   || 0;
  const failed    = eventMap['FAILED']    || 0;

  return {
    campaign: campaign.rows[0],
    stats: {
      sent,
      delivered,
      opened,
      clicked,
      failed,
      delivery_rate: sent > 0 ? `${((delivered / sent) * 100).toFixed(1)}%` : '0%',
      open_rate:     delivered > 0 ? `${((opened / delivered) * 100).toFixed(1)}%` : '0%',
      click_rate:    opened > 0    ? `${((clicked / opened)   * 100).toFixed(1)}%` : '0%',
      failure_rate:  sent > 0      ? `${((failed / sent)      * 100).toFixed(1)}%` : '0%',
    },
  };
}

module.exports = { getAnalyticsTool, getAnalyticsHandler };
