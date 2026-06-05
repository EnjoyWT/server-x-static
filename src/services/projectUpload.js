const fs = require("fs").promises;
const path = require("path");
const os = require("os");
const crypto = require("crypto");
const AdmZip = require("adm-zip");

const config = require("../config");
const projectStatus = require("./projectStatus");

const ROOT_DIR = path.join(__dirname, "../../");
const DYNAMICS_DIR = path.join(ROOT_DIR, config.DYNAMICS_DIR);

function createHttpError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function validateProjectName(projectName) {
  const name = String(projectName || "").trim();

  if (!name) {
    throw createHttpError("Project name is required.", 400);
  }

  if (!config.PROJECT_NAME_PATTERN.test(name)) {
    throw createHttpError(
      "Invalid project name. Use letters, numbers, hyphen, or underscore, and start with a letter or number.",
      400
    );
  }

  if (!projectStatus.isSafeProjectName(name)) {
    throw createHttpError("Project name is reserved or invalid.", 400);
  }

  return name;
}

function isSafeZipEntryName(entryName) {
  const normalized = path.posix.normalize(String(entryName || "").replace(/\\/g, "/"));

  if (!normalized || normalized === "." || normalized.startsWith("../")) {
    return false;
  }

  if (path.posix.isAbsolute(normalized)) {
    return false;
  }

  return !normalized.split("/").some((segment) => segment === "..");
}

function inspectZipEntries(entries) {
  let fileCount = 0;
  let totalUncompressedBytes = 0;

  for (const entry of entries) {
    if (entry.isDirectory) {
      continue;
    }

    if (!isSafeZipEntryName(entry.entryName)) {
      throw createHttpError("Unsafe file path detected in ZIP archive.", 400);
    }

    fileCount += 1;
    totalUncompressedBytes += Number(entry.header?.size || 0);

    if (fileCount > config.UPLOAD_MAX_FILES) {
      throw createHttpError(
        `ZIP contains too many files (max ${config.UPLOAD_MAX_FILES}).`,
        400
      );
    }

    if (totalUncompressedBytes > config.UPLOAD_MAX_UNCOMPRESSED_BYTES) {
      throw createHttpError(
        `Uncompressed ZIP size exceeds ${Math.floor(
          config.UPLOAD_MAX_UNCOMPRESSED_BYTES / (1024 * 1024)
        )}MB.`,
        400
      );
    }
  }

  if (fileCount === 0) {
    throw createHttpError("ZIP archive is empty.", 400);
  }
}

async function pathExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function resolveProjectRoot(extractedDir) {
  const rootIndexPath = path.join(extractedDir, "index.html");
  if (await pathExists(rootIndexPath)) {
    return extractedDir;
  }

  const entries = await fs.readdir(extractedDir, { withFileTypes: true });
  const directories = entries.filter((entry) => entry.isDirectory());
  const files = entries.filter((entry) => entry.isFile());

  if (directories.length === 1 && files.length === 0) {
    const nestedDir = path.join(extractedDir, directories[0].name);
    if (await pathExists(path.join(nestedDir, "index.html"))) {
      return nestedDir;
    }
  }

  throw createHttpError("ZIP must contain index.html at the root or inside a single folder.", 400);
}

async function removeDirectory(targetPath) {
  await fs.rm(targetPath, { recursive: true, force: true });
}

async function copyDirectoryContents(sourceDir, targetDir) {
  await fs.mkdir(targetDir, { recursive: true });
  await fs.cp(sourceDir, targetDir, { recursive: true, force: true });
}

async function publishProject(projectName, zipBuffer, options = {}) {
  const name = validateProjectName(projectName);
  const mode = options.mode === "replace" ? "replace" : "create";

  if (!Buffer.isBuffer(zipBuffer) || zipBuffer.length === 0) {
    throw createHttpError("ZIP file is required.", 400);
  }

  if (zipBuffer.length > config.UPLOAD_MAX_ZIP_BYTES) {
    throw createHttpError(
      `ZIP file exceeds ${Math.floor(config.UPLOAD_MAX_ZIP_BYTES / (1024 * 1024))}MB.`,
      400
    );
  }

  const exists = await projectStatus.projectExists(name);

  if (mode === "create" && exists) {
    throw createHttpError(
      "Project already exists. Use redeploy to update an existing project.",
      409
    );
  }

  if (mode === "replace" && !exists) {
    throw createHttpError("Project not found.", 404);
  }

  let enabledOnPublish;
  if (mode === "replace" && options.enabled === undefined) {
    enabledOnPublish = await projectStatus.isProjectEnabled(name);
  } else {
    enabledOnPublish = options.enabled !== false;
  }

  const overwritten = mode === "replace";
  const tempRoot = path.join(
    os.tmpdir(),
    `server-x-static-upload-${crypto.randomBytes(8).toString("hex")}`
  );
  const extractedDir = path.join(tempRoot, "extracted");
  const targetDir = path.join(DYNAMICS_DIR, name);

  try {
    const zip = new AdmZip(zipBuffer);
    const entries = zip.getEntries();
    inspectZipEntries(entries);
    zip.extractAllTo(extractedDir, true);

    const projectRoot = await resolveProjectRoot(extractedDir);

    if (overwritten) {
      await removeDirectory(targetDir);
    }

    await copyDirectoryContents(projectRoot, targetDir);

    const project = await projectStatus.setProjectEnabled(name, enabledOnPublish);

    return {
      project,
      overwritten,
    };
  } finally {
    await removeDirectory(tempRoot).catch(() => {});
  }
}

module.exports = {
  publishProject,
  validateProjectName,
};
