/**
 * Application Configuration
 * Centralized configuration for the entire application
 */

module.exports = {
  // Dynamic project route prefix
  DYN_PREFIX: "/dyn",

  // Server configuration
  DEFAULT_PORT: 8080,

  // Directory paths (relative to project root)
  DYNAMICS_DIR: "dynamics",
  PUBLIC_DIR: "public",

  // Reserved route names (these will be ignored by dynamic project middleware)
  RESERVED_ROUTES: ["api", "public", "help", "health"],
};
