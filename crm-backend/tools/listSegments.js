const pool = require('../db/pool');

/**
 * Tool: listSegments
 * Lets the AI look up existing segments by name/ID before creating duplicates.
 */
const listSegmentsTool = {
  type: 'function',
  function: {
    name: 'listSegments',
    description:
      'Lists all existing customer segments with their IDs, names, rules summary, and audience sizes. Use this BEFORE creating a segment to check if one already exists.',
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
};

async function listSegmentsHandler() {
  const result = await pool.query(
    `SELECT id, name, rules, audience_size, created_at
     FROM segments
     ORDER BY created_at DESC
     LIMIT 30`
  );
  return { segments: result.rows };
}

module.exports = { listSegmentsTool, listSegmentsHandler };
