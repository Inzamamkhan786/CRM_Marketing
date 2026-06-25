// Load environment variables from the .env file (e.g., database passwords, API keys)
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const authMiddleware = require('./middleware/auth.middleware');

// Initialize the Express application
const app = express();

// Middleware:
// cors() allows our React frontend (running on a different port) to communicate with this backend
app.use(cors());
// express.json() automatically parses incoming JSON data in the request body
app.use(express.json());

// ── Public routes (no auth required) ─────────────────────────────────────────
app.use('/auth', require('./routes/auth.routes'));

// Simple health check endpoint to verify the server is running
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'novacrm-backend', timestamp: new Date() });
});

app.get('/', (req, res) => {
  res.send('NovaCRM Backend Running');
});

// ── Protected routes (JWT required) ──────────────────────────────────────────
app.use(authMiddleware);

app.use('/customers', require('./routes/customer.routes'));
app.use('/orders',    require('./routes/order.routes'));
app.use('/segments',  require('./routes/segment.routes'));
app.use('/campaigns', require('./routes/campaign.routes'));
app.use('/analytics', require('./routes/analytics.routes'));
app.use('/receipts',  require('./routes/receipt.routes')); // Receives delivery updates from the Channel Service
app.use('/ai',        require('./routes/ai.routes'));

// Start the server and listen for incoming requests
const PORT = process.env.PORT || 4000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 NovaCRM Backend running on port ${PORT}`);
});
