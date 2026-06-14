const pool = require('../db/pool');

/**
 * Tool definition for OpenAI function calling.
 * Used by the AI agent to create a new customer record in the database.
 */
const updateCustomerTool = {
  type: 'function',
  function: {
    name: 'updateCustomer',
    description:
      'Update an existing customer in the CRM. Requires the customer\'s current email (oldEmail) to locate them. Any of name, email, phone, or city can be updated — only pass the fields that need to change.',
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

        oldEmail: {
           type: 'string',
           description: 'Old Email through which tool handler search the customer inside the customer table',
        },
      },
      required: ['oldEmail'],  // Only the lookup email is required; all other fields are optional updates
    },
  },
};

/**
 * Tool handler — called by the AI agent when it invokes the createCustomer tool.
 * Returns a plain object (NOT an Express response) — this is NOT a route handler.
 */
async function updateCustomerHandler({ name, email, phone, city, oldEmail }) {
  // Step 1: fetch the current record so we can fall back to existing values
  let existing;
  try {
    const lookupResult = await pool.query(
      `SELECT * FROM customers WHERE email = $1`,
      [oldEmail]
    );
    existing = lookupResult.rows[0];
  } catch (err) {
    console.error('updateCustomerHandler lookup error:', err);
    return { error: 'Internal server error while looking up customer.' };
  }

  if (!existing) {
    return { error: `No customer found with email "${oldEmail}".` };
  }

  // Step 2: merge — keep existing values for any field the caller did not supply
  const newName  = name  || existing.name;
  const newEmail = email || existing.email;
  const newPhone = phone || existing.phone;
  const newCity  = city  || existing.city;

  try {
    const result = await pool.query(
      `UPDATE customers
       SET name = $1, email = $2, phone = $3, city = $4
       WHERE email = $5
       RETURNING *`,
      [newName, newEmail, newPhone, newCity, oldEmail]
    );

    const customer = result.rows[0];
    return {
      success: true,
      message: `Customer "${customer.name}" updated successfully.`,
      customer_id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      city: customer.city,
    };
  } catch (err) {
    // Postgres unique-constraint violation — duplicate email
    if (err.code === '23505') {
      return { error: `A customer with email "${newEmail}" already exists. Cannot update to a duplicate email.` };
    }
    console.error('updateCustomerHandler error:', err);
    return { error: 'Internal server error while updating customer.' };
  }
}

// ✅ Fixed: was missing entirely — ai.service.js imports both of these
module.exports = { updateCustomerTool, updateCustomerHandler };
