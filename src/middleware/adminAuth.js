const crypto = require("crypto");

const config = require("../config");

const AUTH_COOKIE = "admin_session";
const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function getSessionSecret() {
  return process.env.ADMIN_SESSION_SECRET || "server-x-static-admin-secret";
}

function createSessionToken(username) {
  const payload = `${username}:${Date.now()}`;
  const signature = crypto
    .createHmac("sha256", getSessionSecret())
    .update(payload)
    .digest("hex");

  return `${Buffer.from(payload).toString("base64url")}.${signature}`;
}

function verifySessionToken(token) {
  if (!token || typeof token !== "string") return false;

  const [payloadPart, signature] = token.split(".");
  if (!payloadPart || !signature) return false;

  let payload;
  try {
    payload = Buffer.from(payloadPart, "base64url").toString("utf8");
  } catch (error) {
    return false;
  }

  const expectedSignature = crypto
    .createHmac("sha256", getSessionSecret())
    .update(payload)
    .digest("hex");

  if (signature !== expectedSignature) return false;

  const [username, issuedAtRaw] = payload.split(":");
  const issuedAt = Number(issuedAtRaw);

  if (username !== config.ADMIN_USER || !Number.isFinite(issuedAt)) {
    return false;
  }

  return Date.now() - issuedAt <= SESSION_MAX_AGE_MS;
}

function parseCookies(cookieHeader = "") {
  return cookieHeader.split(";").reduce((cookies, part) => {
    const [name, ...valueParts] = part.trim().split("=");
    if (!name) return cookies;
    cookies[name] = decodeURIComponent(valueParts.join("="));
    return cookies;
  }, {});
}

function isAuthenticated(req) {
  const cookies = parseCookies(req.headers.cookie);
  return verifySessionToken(cookies[AUTH_COOKIE]);
}

function setAuthCookie(res, username) {
  const token = createSessionToken(username);
  const maxAgeSeconds = Math.floor(SESSION_MAX_AGE_MS / 1000);

  res.setHeader(
    "Set-Cookie",
    `${AUTH_COOKIE}=${encodeURIComponent(token)}; Path=/admin; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}`
  );
}

function clearAuthCookie(res) {
  res.setHeader(
    "Set-Cookie",
    `${AUTH_COOKIE}=; Path=/admin; HttpOnly; SameSite=Lax; Max-Age=0`
  );
}

function requireAdminAuth(req, res, next) {
  if (isAuthenticated(req)) {
    return next();
  }

  if (req.path === "/login") {
    return next();
  }

  if (req.method === "GET" && (req.path === "/" || req.path === "")) {
    return res.redirect("/admin/login");
  }

  return res.status(401).json({
    success: false,
    message: "Unauthorized. Please log in at /admin/login.",
  });
}

function validateCredentials(username, password) {
  return (
    username === config.ADMIN_USER && password === config.ADMIN_PASSWORD
  );
}

module.exports = {
  AUTH_COOKIE,
  clearAuthCookie,
  isAuthenticated,
  requireAdminAuth,
  setAuthCookie,
  validateCredentials,
};
