const express = require("express");
const router = express.Router();

// This handles "GET /"
router.get("/", (req, res) => {
  // Renders views/science/dashboard.ejs inside views/layout.ejs
  res.render("science/dashboard", { title: "Science", page: "science" });
});

module.exports = router;
