const express = require("express");
const router = express.Router();

// This handles "GET /"
router.get("/", (req, res) => {
  // Renders views/science.ejs inside views/layout.ejs
  res.render("science", { title: "Science", page: "science" });
});

module.exports = router;
