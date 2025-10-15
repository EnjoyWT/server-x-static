const fs = require("fs").promises; // Using promise-based fs
const path = require("path");

// --- Import Configuration ---
const config = require("../config");

const DYNAMICS_DIR = path.join(__dirname, "../../", config.DYNAMICS_DIR);
const { DYN_PREFIX } = config;

/**
 * @desc Renders the home page
 * @route GET /
 */
exports.getHomePage = async (req, res, next) => {
  try {
    // 1. Read the HTML template
    const templatePath = path.join(__dirname, "../views/home.template.html");
    let template = await fs.readFile(templatePath, "utf-8");

    // 2. Generate the dynamic project list
    const dirents = await fs.readdir(DYNAMICS_DIR, { withFileTypes: true });
    const projectDirs = dirents
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name);

    let projectListHtml =
      "<li>No projects found. Please add project folders to the `dynamics` directory.</li>";
    if (projectDirs.length > 0) {
      projectListHtml = projectDirs
        .map(
          (dir) =>
            `<li><a href="${DYN_PREFIX}/${dir}/">${DYN_PREFIX}/${dir}/</a></li>`
        )
        .join("\n    ");
    }

    // 3. Inject the dynamic list into the template
    const finalHtml = template.replace("{{projectList}}", projectListHtml);

    // 4. Send the final HTML
    res.send(finalHtml);
  } catch (error) {
    // If dynamics or views directory doesn't exist, show a graceful message
    if (error.code === "ENOENT") {
      console.error(
        `Error: A required directory or file was not found. Details: ${error.path}`
      );
      res
        .status(500)
        .send(
          "Server Configuration Error: A required directory or file was not found."
        );
    } else {
      next(error); // Pass other errors to the central error handler
    }
  }
};
