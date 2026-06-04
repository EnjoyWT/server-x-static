const fs = require("fs").promises;
const path = require("path");

function acceptsHtml(req) {
  return req.accepts(["html", "json"]) === "html" && !req.originalUrl.startsWith("/api/");
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  }[char]));
}

/**
 * 404 Not Found handler
 */
exports.notFound = async (req, res, next) => {
  if (!acceptsHtml(req)) {
    return res
      .status(404)
      .json({ success: false, message: `Not Found - ${req.originalUrl}` });
  }

  try {
    const templatePath = path.join(__dirname, "../views/404.html");
    const template = await fs.readFile(templatePath, "utf-8");
    res
      .status(404)
      .type("html")
      .send(template.replaceAll("{{REQUEST_PATH}}", escapeHtml(req.originalUrl)));
  } catch (error) {
    next(error);
  }
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
