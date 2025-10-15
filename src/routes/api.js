const express = require('express');

const router = express.Router();

/**
 * @desc Get basic API info
 * @route GET /api/info
 */
router.get('/info', (req, res) => {
  res.json({
    success: true,
    message: 'API is working.',
    timestamp: new Date().toISOString(),
  });
});

/**
 * @desc Get user greeting
 * @route GET /api/user/:name
 */
router.get('/user/:name', (req, res) => {
  const { name } = req.params;
  if (!name) {
    return res.status(400).json({ success: false, message: 'Name parameter is required.' });
  }
  res.json({ success: true, data: { greeting: `Hello, ${name}!` } });
});

module.exports = router;
