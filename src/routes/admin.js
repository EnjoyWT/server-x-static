const express = require("express");
const fs = require("fs").promises;
const path = require("path");

const projectStatus = require("../services/projectStatus");
const {
  clearAuthCookie,
  isAuthenticated,
  requireAdminAuth,
  setAuthCookie,
  validateCredentials,
} = require("../middleware/adminAuth");

const router = express.Router();

async function sendView(res, filename) {
  const templatePath = path.join(__dirname, "../views", filename);
  const template = await fs.readFile(templatePath, "utf-8");
  res.send(template);
}

router.get("/login", async (req, res, next) => {
  try {
    if (isAuthenticated(req)) {
      return res.redirect("/admin/");
    }

    await sendView(res, "login.html");
  } catch (error) {
    next(error);
  }
});

router.post("/login", (req, res) => {
  const username = String(req.body.username || "").trim();
  const password = String(req.body.password || "");

  if (!validateCredentials(username, password)) {
    return res.redirect("/admin/login?error=1");
  }

  setAuthCookie(res, username);
  return res.redirect("/admin/");
});

router.post("/logout", (req, res) => {
  clearAuthCookie(res);
  return res.redirect("/admin/login");
});

router.use(requireAdminAuth);

router.get("/", async (req, res, next) => {
  try {
    await sendView(res, "admin.html");
  } catch (error) {
    next(error);
  }
});

router.get("/projects", async (req, res, next) => {
  try {
    const projects = await projectStatus.listProjects();
    res.json({ success: true, data: { projects } });
  } catch (error) {
    next(error);
  }
});

router.patch("/projects/:name", async (req, res, next) => {
  try {
    const { enabled } = req.body;

    if (typeof enabled !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "Request body must include boolean field `enabled`.",
      });
    }

    const project = await projectStatus.setProjectEnabled(
      req.params.name,
      enabled
    );
    res.json({ success: true, data: { project } });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    next(error);
  }
});

module.exports = router;
