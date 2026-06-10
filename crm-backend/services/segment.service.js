/**
 * Segment Service — Dynamic SQL builder
 *
 * Rules format (JSONB):
 * {
 *   "operator": "AND" | "OR",
 *   "conditions": [
 *     { "field": "total_spend",    "op": ">" | "<" | ">=" | "<=" | "=" | "!=", "value": 5000 },
 *     { "field": "days_inactive",  "op": ">", "value": 30 },
 *     { "field": "city",           "op": "=", "value": "Mumbai" },
 *     { "field": "order_count",    "op": ">=", "value": 2 }
 *   ]
 * }
 */

const VALID_OPS = ['>', '<', '>=', '<=', '=', '!='];

/**
 * Builds a parameterized SQL query that returns matching customers.
 * @param {object} rules
 * @returns {{ sql: string, params: any[] }}
 */
function buildSegmentQuery(rules) {
  if (!rules || !rules.conditions || rules.conditions.length === 0) {
    // No rules → return all customers
    return { sql: 'SELECT c.* FROM customers c', params: [] };
  }

  const operator = (rules.operator || 'AND').toUpperCase();
  if (!['AND', 'OR'].includes(operator)) {
    throw new Error('operator must be AND or OR');
  }

  const params = [];
  const havingClauses = [];
  const whereClauses  = [];

  for (const cond of rules.conditions) {
    const { field, op, value } = cond;

    if (!VALID_OPS.includes(op)) {
      throw new Error(`Invalid operator: ${op}. Must be one of ${VALID_OPS.join(', ')}`);
    }

    params.push(value);
    const placeholder = `$${params.length}`;

    switch (field) {
      case 'total_spend':
        havingClauses.push(`COALESCE(SUM(o.amount), 0) ${op} ${placeholder}`);
        break;

      case 'days_inactive':
        // Days since last order
        havingClauses.push(
          `EXTRACT(DAY FROM NOW() - COALESCE(MAX(o.order_date), c.created_at)) ${op} ${placeholder}`
        );
        break;

      case 'order_count':
        havingClauses.push(`COUNT(DISTINCT o.id) ${op} ${placeholder}`);
        break;

      case 'city':
        whereClauses.push(`c.city ${op} ${placeholder}`);
        break;

      case 'days_since_signup':
        whereClauses.push(`EXTRACT(DAY FROM NOW() - c.created_at) ${op} ${placeholder}`);
        break;

      default:
        // Try matching a customer column directly
        whereClauses.push(`c.${field} ${op} ${placeholder}`);
    }
  }

  let sql = `
    SELECT c.*
    FROM customers c
    LEFT JOIN orders o ON c.id = o.customer_id
  `;

  if (whereClauses.length > 0) {
    sql += ` WHERE ${whereClauses.join(` ${operator} `)}`;
  }

  sql += ` GROUP BY c.id`;

  if (havingClauses.length > 0) {
    sql += ` HAVING ${havingClauses.join(` ${operator} `)}`;
  }

  return { sql: sql.trim(), params };
}

module.exports = { buildSegmentQuery };
