// Load environment variables from .env file
require("dotenv").config();

const express = require("express");
const path = require("path");
const helmet = require("helmet");
const fs = require("fs");

// --- Import Routes and Middleware ---
const apiRoutes = require("./src/api");
const homeRoutes = require("./src/routes/home.routes");
const dynamicProjectMiddleware = require("./src/middleware/dynamicProject.middleware");
const { notFound, errorHandler } = require("./src/middleware/error.middleware");

// --- App Initialization ---
const app = express();
const PORT = process.env.PORT || 8080;

// --- Directory Definitions & Creation ---
const DYNAMICS_DIR = path.join(__dirname, "dynamics");
const PUBLIC_DIR = path.join(__dirname, "public");
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
app.use(dynamicProjectMiddleware);

// --- Route Registration ---
// 3. API routes
app.use("/api", apiRoutes);

// 4. Home page route
app.use("/help", homeRoutes);

// --- Error Handling ---
// Placed after all routes to catch unhandled requests
app.use(notFound);
app.use(errorHandler);

// --- Server Activation ---
app.listen(PORT, () => {
  console.log(
    `✅ Server is running in ${
      process.env.NODE_ENV || "development"
    } mode on port ${PORT}`
  );
  console.log(`   Press CTRL-C to stop\n`);
});
