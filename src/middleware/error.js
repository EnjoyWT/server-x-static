/**
 * 404 Not Found handler
 */
exports.notFound = (req, res, next) => {
  res
    .status(404)
    .json({ success: false, message: `Not Found - ${req.originalUrl}` });
};

/**
 * Central error handler
 */
exports.errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  console.error(err.stack);
  res.status(statusCode).json({
    success: false,
    message: err.message,
    // Show stack trace in development mode only
    stack: process.env.NODE_ENV === "production" ? "🥞" : err.stack,
  });
};
