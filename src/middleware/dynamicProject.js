const express = require("express");
const path = require("path");
const fs = require("fs");

// --- Import Configuration ---
const config = require("../config");

const DYNAMICS_DIR = path.join(__dirname, "../../", config.DYNAMICS_DIR);

module.exports = (req, res, next) => {
  const pathSegments = req.path.split("/").filter((segment) => segment !== "");
  const projectName = pathSegments[0];

  // Ignore requests that are not for a project
  if (
    !projectName ||
    projectName.startsWith(".") ||
    config.RESERVED_ROUTES.includes(projectName)
  ) {
    return next();
  }

  const projectPath = path.join(DYNAMICS_DIR, projectName);

  fs.stat(projectPath, (err, stats) => {
    if (err) {
      // Log specific errors for debugging but don't crash
      console.error(`❌ Error accessing project path '${projectPath}':`, err.message);
      // Pass to next middleware (404 handler) instead of crashing
      return next();
    }
    
    if (!stats.isDirectory()) {
      // Log when path exists but is not a directory
      console.warn(`⚠️ Path '${projectPath}' exists but is not a directory`);
      return next();
    }

    try {
      // Modify req.url to be relative to the project directory
      req.url = req.url.substring(projectName.length + 1);

      // Serve static files from the project directory
      express.static(projectPath)(req, res, (staticErr) => {
        if (staticErr) {
          // Handle static file serving errors gracefully
          console.error(`❌ Error serving static files from '${projectPath}':`, staticErr.message);
          return next(); // Pass to 404 handler instead of crashing
        }
        // If no error, pass to next middleware
        next();
      });
    } catch (error) {
      // Catch any synchronous errors
      console.error(`❌ Error in static file middleware setup for '${projectPath}':`, error.message);
      next(); // Pass to 404 handler instead of crashing
    }
  });
};
