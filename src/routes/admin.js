const express = require("express");
const fs = require("fs").promises;
const path = require("path");

const projectStatus = require("../services/projectStatus");

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const templatePath = path.join(__dirname, "../views/admin.html");
    const template = await fs.readFile(templatePath, "utf-8");
    res.send(template);
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
