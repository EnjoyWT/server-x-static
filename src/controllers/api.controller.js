/**
 * @desc Get basic API info
 * @route GET /api/info
 */
exports.getInfo = (req, res) => {
  res.json({
    success: true,
    message: 'API is working.',
    timestamp: new Date().toISOString(),
  });
};

/**
 * @desc Get user greeting
 * @route GET /api/user/:name
 */
exports.getUser = (req, res) => {
  const { name } = req.params;
  if (!name) {
    return res.status(400).json({ success: false, message: 'Name parameter is required.' });
  }
  res.json({ success: true, data: { greeting: `Hello, ${name}!` } });
};
