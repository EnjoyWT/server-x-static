/**
 * Application Configuration
 * Centralized configuration for the entire application
 */

module.exports = {
  // Dynamic project route prefix
  DYN_PREFIX: "/dyn",

  // Server configuration
  DEFAULT_PORT: 6002,

  // Directory paths (relative to project root)
  DYNAMICS_DIR: "dynamics",
  PUBLIC_DIR: "public",
  PROJECT_STATUS_FILE: "data/project-status.json",

  // Reserved route names (these will be ignored by dynamic project middleware)
  RESERVED_ROUTES: ["api", "public", "help", "admin", "health"],

  // Admin credentials
  ADMIN_USER: "tim",
  ADMIN_PASSWORD: "tim123",

  // Project upload limits
  UPLOAD_MAX_ZIP_BYTES: 50 * 1024 * 1024,
  UPLOAD_MAX_UNCOMPRESSED_BYTES: 200 * 1024 * 1024,
  UPLOAD_MAX_FILES: 5000,
  PROJECT_NAME_PATTERN: /^[a-zA-Z0-9][a-zA-Z0-9_-]*$/,
};
