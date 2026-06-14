const pool = require('../db/pool');

const deleteCustomerTool = {
    type:'function',
    function: {
        name:'deleteCustomer',
        description:'Delete the customer with their email(required) and name(optional)',
        parameters: {
            type: 'object',
            properties:{
                email: {
                    type:'string',
                    description:'Email of the customer , example. manoj@gmail.com',
                },
            },
            required: ['email']
        }
    }
}



async function deleteCustomerHandler({email}) {
  if (!email) {
    return { error: 'email are required fields.' };
  }

  try {
    const result = await pool.query(
      `DELETE FROM customers
      WHERE email = $1
      RETURNING *`,
      [email]
    );

    if (result.rowCount === 0) {
      return { error: `No customer found with email "${email}".` };
    }

    const customer = result.rows[0];
    return {
      success: true,
      message: `Customer "${customer.name}" deleted successfully.`,
      customer_id: customer.id,
      name: customer.name,
      email: customer.email,
    };
  } catch (err) {
    console.error('deleteCustomerHandler error:', err);
    return { error: 'Internal server error while deleting customer.' };
  }
}

// ✅ Fixed: was missing entirely — ai.service.js imports both of these
module.exports = { deleteCustomerTool, deleteCustomerHandler };
