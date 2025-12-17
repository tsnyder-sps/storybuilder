const express = require("express");
const router = express.Router();

// Import and connect sub-application routers
const narrariveGeneratorRouter = require("./narrative-generator");
router.use("/narrative-generator", narrariveGeneratorRouter);

// This handles "GET /world-language"
router.get("/", (req, res) => {
  // Renders views/world-language/dashboard.ejs inside views/layout.ejs
  res.render("world-language/dashboard", {
    title: "World Language",
    page: "world-language",
  });
});

module.exports = router;
