require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/send', require('./routes/send.routes'));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'channel-service', timestamp: new Date() });
});

app.get('/', (req, res) => {
  res.send('Channel Service Running');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`📡 Channel Service running on port ${PORT}`);
});
