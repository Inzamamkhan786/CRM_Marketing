const pool = require('../db/pool');

/**
 * Tool definition for OpenAI function calling.
 * Used by the AI agent to create a new customer record in the database.
 */
const createCustomerTool = {
  type: 'function',
  function: {
    name: 'createCustomer',
    description:
      'Creates a new customer in the CRM with their name (required), email (required), city (optional), and phone number (optional). If a customer with the same email already exists, it will NOT create a duplicate and will return an error message instead.',
    parameters: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Full name of the customer, e.g. "Manoj Kumar"',
        },
        email: {
          type: 'string',  // ✅ Fixed: "email" is not a valid JSON Schema type, must be "string"
          description: 'Email address of the customer, e.g. "manoj516@gmail.com"',
        },
        phone: {
          type: 'string',  // ✅ Fixed: "phone" is not a valid JSON Schema type, must be "string"
          description: 'Phone number of the customer, e.g. "+91-9876543210"',
        },
        city: {
          type: 'string',
          description: 'City where the customer lives, e.g. "Mumbai"',
        },
      },
      required: ['name', 'email'],  // ✅ Fixed: was ['name', 'rules'] — "rules" does not exist here
    },
  },
};

/**
 * Tool handler — called by the AI agent when it invokes the createCustomer tool.
 * Returns a plain object (NOT an Express response) — this is NOT a route handler.
 */
async function createCustomerHandler({ name, email, phone, city }) {
  // ✅ Fixed: validate inputs and return plain objects, not res.json()
  if (!name || !email) {
    return { error: 'name and email are required fields.' };
  }

  try {
    const result = await pool.query(
      `INSERT INTO customers (name, email, phone, city)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [name, email, phone || null, city || null]
    );

    const customer = result.rows[0];
    return {
      success: true,
      message: `Customer "${customer.name}" created successfully.`,
      customer_id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      city: customer.city,
    };
  } catch (err) {
    // Postgres unique-constraint violation — duplicate email
    if (err.code === '23505') {
      return { error: `A customer with email "${email}" already exists. No duplicate was created.` };
    }
    console.error('createCustomerHandler error:', err);
    return { error: 'Internal server error while creating customer.' };
  }
}

// ✅ Fixed: was missing entirely — ai.service.js imports both of these
module.exports = { createCustomerTool, createCustomerHandler };
