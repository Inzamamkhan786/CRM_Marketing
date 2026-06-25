const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'novacrm_super_secret_key_change_in_prod';

module.exports = function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer '))
    return res.status(401).json({ error: 'No token provided. Please login.' });

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.companyId = decoded.companyId;
    req.companyEmail = decoded.email;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token is invalid or expired. Please login again.' });
  }
};
