const express = require('express');
const path = require('path');
const fs = require('fs');

const DYNAMICS_DIR = path.join(__dirname, '../../dynamics');

module.exports = (req, res, next) => {
  const projectName = req.path.split('/')[1];

  // Ignore requests that are not for a project
  if (!projectName || projectName.startsWith('.') || ['api', 'public'].includes(projectName)) {
    return next();
  }

  const projectPath = path.join(DYNAMICS_DIR, projectName);

  fs.stat(projectPath, (err, stats) => {
    if (err || !stats.isDirectory()) {
      // If path is not a valid project directory, pass to the next middleware (404 handler)
      return next();
    }

    // Modify req.url to be relative to the project directory
    req.url = req.url.substring(projectName.length + 1);

    // Serve static files from the project directory
    express.static(projectPath)(req, res, next);
  });
};
