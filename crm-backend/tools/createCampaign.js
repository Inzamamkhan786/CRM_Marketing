const pool = require('../db/pool');

const createCampaignTool = {
  type: 'function',
  function: {
    name: 'createCampaign',
    description:
      'Creates a new campaign in the database with a name, segment, channel, and message. Returns the campaign ID.',
    parameters: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Campaign name, e.g. "Win-Back June 2025"',
        },
        segment_id: {
          type: 'number',
          description: 'ID of the segment to target (from createSegment)',
        },
        channel: {
          type: 'string',
          enum: ['WhatsApp', 'SMS', 'Email', 'RCS'],
          description: 'Delivery channel',
        },
        message: {
          type: 'string',
          description: 'The marketing message to send',
        },
      },
      required: ['name', 'segment_id', 'channel', 'message'],
    },
  },
};

async function createCampaignHandler({ name, segment_id, channel, message }) {
  const result = await pool.query(
    `INSERT INTO campaigns (name, segment_id, channel, message, status)
     VALUES ($1, $2, $3, $4, 'DRAFT') RETURNING *`,
    [name, segment_id, channel, message]
  );

  // Fetch segment info for context
  const seg = await pool.query('SELECT name, audience_size FROM segments WHERE id=$1', [segment_id]);

  return {
    campaign_id: result.rows[0].id,
    name: result.rows[0].name,
    status: result.rows[0].status,
    channel,
    segment_name: seg.rows[0]?.name,
    audience_size: seg.rows[0]?.audience_size,
    message: result.rows[0].message,
  };
}

module.exports = { createCampaignTool, createCampaignHandler };
