const express = require("express");
const router = express.Router();

// This handles "GET /world-language"
router.get("/", (req, res) => {
  // Renders views/world-language.ejs inside views/layout.ejs
  res.render("world-language", {
    title: "World Language",
    page: "world-language",
  });
});

module.exports = router;
