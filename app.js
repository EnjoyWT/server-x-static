// Load environment variables from .env file
require("dotenv").config();

const express = require("express");
const path = require("path");
const helmet = require("helmet");
const fs = require("fs");
const os = require("os");

// --- Import Configuration ---
const config = require("./src/config");

// --- Process Error Handling ---
// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception:", err.message);
  console.error("Stack:", err.stack);
  console.error("Time:", new Date().toISOString());
  // Log error but keep the process running
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection at:", promise);
  console.error("Reason:", reason);
  console.error("Time:", new Date().toISOString());
  // Log error but keep the process running
});

// --- Import Routes and Middleware ---
const apiRoutes = require("./src/routes/api");
const homeRoutes = require("./src/routes/home");
const dynamicProjectMiddleware = require("./src/middleware/dynamicProject");
const { notFound, errorHandler } = require("./src/middleware/error");

// --- App Initialization ---
const app = express();
const PORT = process.env.PORT || config.DEFAULT_PORT;
const { DYN_PREFIX } = config;

// --- Directory Definitions & Creation ---
const DYNAMICS_DIR = path.join(__dirname, config.DYNAMICS_DIR);
const PUBLIC_DIR = path.join(__dirname, config.PUBLIC_DIR);
[DYNAMICS_DIR, PUBLIC_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);
});

// --- Core Middleware ---
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: false,
      directives: {
        defaultSrc: ["*", "'unsafe-inline'", "'unsafe-eval'", "data:", "blob:"],
        connectSrc: ["*", "data:", "blob:", "ws:", "wss:"],
        scriptSrc: ["*", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["*", "'unsafe-inline'"],
        imgSrc: ["*", "data:", "blob:"],
        fontSrc: ["*", "data:"],
        mediaSrc: ["*", "data:"],
        frameSrc: ["*"],
        workerSrc: ["*", "blob:"],
        objectSrc: ["*"],
        manifestSrc: ["*"],
        baseUri: ["*"],
        formAction: ["*"],
        frameAncestors: ["*"],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
); // Apply security headers with custom CSP
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// --- Static & Dynamic Asset Serving ---
// 1. Serve shared static files from /public
app.use(express.static(PUBLIC_DIR));

// 2. Serve project-specific files from /dynamics
app.use(DYN_PREFIX, dynamicProjectMiddleware);

// --- Route Registration ---
// 3. Health check endpoint
app.get(`${DYN_PREFIX}/health`, (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: require("./package.json").version,
    environment: process.env.NODE_ENV || "development",
    path: req.path,
  });
});

// 4. API routes
app.use(`/api`, apiRoutes);

// 5. Home page route
app.use(`/help`, homeRoutes);

// --- Error Handling ---
// Placed after all routes to catch unhandled requests
app.use(notFound);
app.use(errorHandler);

// --- Server Activation ---
// Get local IPv4 address
function getLocalIPv4() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }
  return "localhost";
}

app.listen(PORT, "0.0.0.0", () => {
  const localIP = getLocalIPv4();
  console.log(
    `✅ Server is running in ${
      process.env.NODE_ENV || "development"
    } mode on port ${PORT}`
  );
  console.log(`   Local:    http://localhost:${PORT}`);
  console.log(`   Network:  http://${localIP}:${PORT}`);
  console.log(`   External: http://0.0.0.0:${PORT}`);
  console.log(`   Press CTRL-C to stop\n`);
});
