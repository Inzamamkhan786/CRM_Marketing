const pool = require('../db/pool');
const { buildSegmentQuery } = require('../services/segment.service');

/**
 * Tool definition for OpenAI function calling
 */
const createSegmentTool = {
  type: 'function',
  function: {
    name: 'createSegment',
    description:
      'Creates OR updates a customer segment based on behavior rules (spend, inactivity, city, order count). If a segment with the same name already exists, it will be UPDATED — not duplicated. Returns audience size and segment ID.',
    parameters: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'A descriptive name for this segment, e.g. "Inactive High Spenders"',
        },
        rules: {
          type: 'object',
          description: 'Segmentation rules object',
          properties: {
            operator: {
              type: 'string',
              enum: ['AND', 'OR'],
              description: 'How to combine conditions: AND (all must match) or OR (any must match)',
            },
            conditions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: {
                    type: 'string',
                    enum: ['total_spend', 'days_inactive', 'order_count', 'city', 'days_since_signup'],
                    description: 'The customer attribute to filter on',
                  },
                  op: {
                    type: 'string',
                    enum: ['>', '<', '>=', '<=', '=', '!='],
                    description: 'Comparison operator',
                  },
                  value: {
                    description: 'The value to compare against',
                  },
                },
                required: ['field', 'op', 'value'],
              },
            },
          },
          required: ['operator', 'conditions'],
        },
      },
      required: ['name', 'rules'],
    },
  },
};

/**
 * Tool handler — UPSERT: updates existing segment if name matches, otherwise inserts new.
 * This prevents duplicate segments when the user asks to edit rules.
 */
async function createSegmentHandler({ name, rules }) {
  const { sql, params } = buildSegmentQuery(rules);

  // Count matching customers for the new rule set
  const customers = await pool.query(sql, params);
  const audience_size = customers.rows.length;

  // Check if a segment with this exact name already exists
  const existing = await pool.query(
    'SELECT id FROM segments WHERE name = $1',
    [name]
  );

  let result;
  let wasUpdated = false;

  if (existing.rows.length > 0) {
    // UPDATE existing segment — prevents duplicates when user edits rules
    result = await pool.query(
      `UPDATE segments SET rules = $1, audience_size = $2 WHERE name = $3 RETURNING *`,
      [JSON.stringify(rules), audience_size, name]
    );
    wasUpdated = true;
  } else {
    // INSERT brand-new segment
    result = await pool.query(
      `INSERT INTO segments (name, rules, audience_size) VALUES ($1, $2, $3) RETURNING *`,
      [name, JSON.stringify(rules), audience_size]
    );
  }

  return {
    segment_id: result.rows[0].id,
    name,
    audience_size,
    action: wasUpdated ? 'updated existing segment' : 'created new segment',
    sample_customers: customers.rows.slice(0, 3).map(c => ({ id: c.id, name: c.name, city: c.city })),
  };
}

module.exports = { createSegmentTool, createSegmentHandler };
