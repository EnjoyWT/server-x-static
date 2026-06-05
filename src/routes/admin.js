const express = require("express");
const fs = require("fs").promises;
const path = require("path");
const multer = require("multer");

const config = require("../config");
const projectStatus = require("../services/projectStatus");
const projectUpload = require("../services/projectUpload");
const {
  clearAuthCookie,
  isAuthenticated,
  requireAdminAuth,
  setAuthCookie,
  validateCredentials,
} = require("../middleware/adminAuth");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: config.UPLOAD_MAX_ZIP_BYTES,
    files: 1,
  },
  fileFilter(req, file, cb) {
    const filename = String(file.originalname || "").toLowerCase();
    const mimeType = String(file.mimetype || "").toLowerCase();

    if (
      filename.endsWith(".zip") ||
      mimeType === "application/zip" ||
      mimeType === "application/x-zip-compressed"
    ) {
      cb(null, true);
      return;
    }

    cb(createHttpError("Only .zip files are allowed.", 400));
  },
});

function createHttpError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function handleUploadError(error, req, res, next) {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: `ZIP file exceeds ${Math.floor(
          config.UPLOAD_MAX_ZIP_BYTES / (1024 * 1024)
        )}MB.`,
      });
    }

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  if (error.statusCode) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
    });
  }

  return next(error);
}

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

router.post(
  "/projects/upload",
  (req, res, next) => {
    upload.single("file")(req, res, (error) => {
      if (error) {
        return handleUploadError(error, req, res, next);
      }
      return next();
    });
  },
  async (req, res, next) => {
    try {
      const projectName = String(req.body.name || "").trim();
      const enabledRaw = req.body.enabled;
      const enabled =
        enabledRaw === undefined ||
        enabledRaw === "true" ||
        enabledRaw === true;

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "ZIP file is required.",
        });
      }

      const result = await projectUpload.publishProject(
        projectName,
        req.file.buffer,
        { enabled }
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
      }

      next(error);
    }
  }
);

module.exports = router;
