const express = require("express");
const router = express.Router();

// This handles "GET /"
router.get("/", (req, res) => {
  res.render("index", {
    title: "Home",
    page: "dashboard",
  });
});

module.exports = router;
