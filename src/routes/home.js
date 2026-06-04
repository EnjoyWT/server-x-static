const express = require("express");
const fs = require("fs").promises;
const path = require("path");

// --- Import Configuration ---
const config = require("../config");
const projectStatus = require("../services/projectStatus");

const router = express.Router();

const { DYN_PREFIX } = config;

/**
 * @desc Renders the home page
 * @route GET /
 */
router.get("/", async (req, res, next) => {
  try {
    // 1. Read the HTML template
    const templatePath = path.join(__dirname, "../views/home.html");
    let template = await fs.readFile(templatePath, "utf-8");

    // 2. Generate the enabled dynamic project list
    const projects = await projectStatus.listProjects();
    const enabledProjects = projects.filter((project) => project.enabled);

    let projectListHtml =
      "<li>No enabled projects found. Open <a href=\"/admin/\">/admin/</a> to enable projects, or add project folders to the `dynamics` directory.</li>";
    if (enabledProjects.length > 0) {
      projectListHtml = enabledProjects
        .map(
          (project) =>
            `<li><a href="${project.path}">${project.path}</a></li>`
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
});

module.exports = router;
