const express = require("express");
const router = express.Router();

// This handles "GET /"
router.get("/", (req, res) => {
  // Renders views/it-utilities/dashboard.ejs inside views/layout.ejs
  res.render("it-utilities/dashboard", {
    title: "IT Utilities",
    page: "it-utilities",
  });
});

module.exports = router;
