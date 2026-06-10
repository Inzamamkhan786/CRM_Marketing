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
      'Creates a customer segment by finding matching customers based on behavior rules like spending, inactivity days, city, or order count. Returns the audience size and saves the segment.',
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
 * Tool handler — executes the tool and returns a result object
 */
async function createSegmentHandler({ name, rules }) {
  const { sql, params } = buildSegmentQuery(rules);

  // Get matching customers
  const customers = await pool.query(sql, params);
  const audience_size = customers.rows.length;

  // Save segment to DB
  const result = await pool.query(
    `INSERT INTO segments (name, rules, audience_size) VALUES ($1, $2, $3) RETURNING *`,
    [name, JSON.stringify(rules), audience_size]
  );

  return {
    segment_id: result.rows[0].id,
    name,
    audience_size,
    sample_customers: customers.rows.slice(0, 3).map(c => ({ id: c.id, name: c.name, city: c.city })),
  };
}

module.exports = { createSegmentTool, createSegmentHandler };
