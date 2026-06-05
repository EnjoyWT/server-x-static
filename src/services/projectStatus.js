const fs = require("fs").promises;
const path = require("path");

const config = require("../config");

const ROOT_DIR = path.join(__dirname, "../../");
const DYNAMICS_DIR = path.join(ROOT_DIR, config.DYNAMICS_DIR);
const STATUS_FILE = path.join(ROOT_DIR, config.PROJECT_STATUS_FILE);

function isSafeProjectName(projectName) {
  return (
    typeof projectName === "string" &&
    projectName.length > 0 &&
    !projectName.includes("/") &&
    !projectName.includes("\\") &&
    projectName !== "." &&
    projectName !== ".." &&
    !projectName.startsWith(".") &&
    !config.RESERVED_ROUTES.includes(projectName)
  );
}

async function readStatusMap() {
  try {
    const raw = await fs.readFile(STATUS_FILE, "utf-8");
    const parsed = JSON.parse(raw);

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      console.warn(`⚠️ Invalid project status file format: ${STATUS_FILE}`);
      return {};
    }

    return parsed;
  } catch (error) {
    if (error.code !== "ENOENT") {
      console.error(`❌ Failed to read project status file '${STATUS_FILE}':`, error.message);
    }

    // Fail-open: status file problems should not take down hosted projects.
    return {};
  }
}

async function writeStatusMap(statusMap) {
  await fs.mkdir(path.dirname(STATUS_FILE), { recursive: true });
  await fs.writeFile(STATUS_FILE, `${JSON.stringify(statusMap, null, 2)}\n`, "utf-8");
}

async function listProjectNames() {
  const dirents = await fs.readdir(DYNAMICS_DIR, { withFileTypes: true });

  return dirents
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name)
    .filter(isSafeProjectName)
    .sort((a, b) => a.localeCompare(b));
}

async function listProjects() {
  const [projectNames, statusMap] = await Promise.all([
    listProjectNames(),
    readStatusMap(),
  ]);

  return projectNames.map((name) => ({
    name,
    path: `${config.DYN_PREFIX}/${encodeURIComponent(name)}/`,
    enabled: statusMap[name] !== false,
  }));
}

async function isProjectEnabled(projectName) {
  if (!isSafeProjectName(projectName)) {
    return false;
  }

  const statusMap = await readStatusMap();
  return statusMap[projectName] !== false;
}

async function projectExists(projectName) {
  if (!isSafeProjectName(projectName)) {
    return false;
  }

  const projectPath = path.join(DYNAMICS_DIR, projectName);
  const stats = await fs.stat(projectPath).catch(() => null);
  return Boolean(stats && stats.isDirectory());
}

async function setProjectEnabled(projectName, enabled) {
  if (!isSafeProjectName(projectName)) {
    const error = new Error("Invalid project name.");
    error.statusCode = 400;
    throw error;
  }

  const projectPath = path.join(DYNAMICS_DIR, projectName);
  const stats = await fs.stat(projectPath).catch(() => null);

  if (!stats || !stats.isDirectory()) {
    const error = new Error("Project not found.");
    error.statusCode = 404;
    throw error;
  }

  const statusMap = await readStatusMap();
  statusMap[projectName] = Boolean(enabled);
  await writeStatusMap(statusMap);

  return {
    name: projectName,
    path: `${config.DYN_PREFIX}/${encodeURIComponent(projectName)}/`,
    enabled: statusMap[projectName],
  };
}

module.exports = {
  isProjectEnabled,
  isSafeProjectName,
  listProjects,
  projectExists,
  setProjectEnabled,
};
