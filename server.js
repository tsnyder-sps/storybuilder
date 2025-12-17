const express = require("express");
const expressLayouts = require("express-ejs-layouts");
const path = require("path");
const { config } = require("dotenv");

config();

const app = express();
const PORT = process.env.PORT || 3005;

// 1. App Configuration
//// Set EJS as the templating engine
app.set("view engine", "ejs");
//// Point Express to the 'views' folder
app.set("views", path.join(__dirname, "views"));
//// Layout configuration
app.use(expressLayouts);
//// Set the default layout file (looks for views/layout.ejs)
app.set("layout", "layout");
//// Layout extraction settings
app.set("layout extractScripts", true);
app.set("layout extractStyles", true);
//// Serve global CSS/JS/Images from the 'public' folder
app.use(express.static(path.join(__dirname, "public")));

// 2. Import Routers
//// Main Dashboard
const indexRouter = require("./routes/index");
//// World Language Section
const worldLanguageRouter = require("./routes/world-language");
//// Science Section
const scienceRouter = require("./routes/science");
//// IT Utilities Section
const itUtilitiesRouter = require("./routes/it-utilities");

// 3. Mount Routers
app.use("/", indexRouter);
app.use("/world-language", worldLanguageRouter);
app.use("/science", scienceRouter);
app.use("/it-utilities", itUtilitiesRouter);

// Sub-Application 1
app.get("/inventory", (req, res) => {
  // Renders views/inventory.ejs inside views/layout.ejs
  res.render("inventory", { title: "Inventory App", page: "inventory" });
});

// 5. Start Server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
