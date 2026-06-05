const express = require("express");
const fs = require("fs").promises;
const path = require("path");

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const templatePath = path.join(__dirname, "../views/index.html");
    const template = await fs.readFile(templatePath, "utf-8");
    res.send(template);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
