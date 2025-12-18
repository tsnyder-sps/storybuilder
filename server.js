const express = require("express");
const expressLayouts = require("express-ejs-layouts");
const path = require("path");
const { config } = require("dotenv");
const OpenAI = require("openai");

config();

const app = express();
const PORT = process.env.PORT || 3005;
console.log(`Starting server on port ${PORT}`);

// Model configuration
const model = process.env.OPENAI_MODEL || "gemma3:12b-it-q8_0";

// Setup OpenAI clients with API key
const openai = new OpenAI({
  apiKey: "unused",
  baseURL: process.env.OPENAI_API_BASE,
  defaultHeaders: {
    "CF-Access-Client-Id": process.env.CF_ACCESS_CLIENT_ID,
    "CF-Access-Client-Secret": process.env.CF_ACCESS_CLIENT_SECRET,
  },
});

// 1. App Configuration
//// Set EJS as the templating engine
app.set("view engine", "ejs");
//// Body parser middleware
app.use(express.json());
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
const worldLanguageRouter = require("./routes/world-language/index");
//// Science Section
const scienceRouter = require("./routes/science/index");
//// IT Utilities Section
const itUtilitiesRouter = require("./routes/it-utilities/index");

// 3. Mount Routers
app.use("/", indexRouter);
app.use("/world-language", worldLanguageRouter);
app.use("/science", scienceRouter);
app.use("/it-utilities", itUtilitiesRouter);

// Test auth
app.post("/auth/test", async (req, res) => {
  console.log("Auth test endpoint hit", req.body);
  const promptReq = req.body.prompt;
  try {
    const { prompt = promptReq, max_tokens = 8192 } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required." });
    }

    const completion = await openai.chat.completions.create({
      model: model,
      max_tokens: max_tokens,
      messages: [{ role: "user", content: prompt }],
      stream: false,
    });

    res.json({
      completion: completion.choices[0].message.content,
    });
  } catch (error) {
    console.error("Error calling OpenAI API:", error);

    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ error: "Internal server error" });
    }
  }
});

// Sub-Application 1
app.get("/inventory", (req, res) => {
  // Renders views/inventory.ejs inside views/layout.ejs
  res.render("inventory", { title: "Inventory App", page: "inventory" });
});

// debug app
app.get("/debug", async (req, res) => {
  console.log("Debug endpoint hit");
  try {
    // // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: model,
      max_tokens: 8192,
      messages: [{ role: "user", content: "Why is the sky blue?" }],
      stream: true,
      temperature: 1.0,
      min_p: 0.01,
      top_k: 64,
      top_p: 0.95,
    });

    let aiResponse = "";

    for await (const chunk of completion) {
      //read response tokens

      if (chunk.choices[0]?.delta?.content) {
        const content = chunk.choices[0].delta.content;
        console.log("Received chunk:", content);
        // store the AI response
        aiResponse += content;
      }
    }

    console.log("Completion:", completion);

    res.json({
      completion: aiResponse,
    });
  } catch (error) {
    console.error("Error calling OpenAI API:", error);

    // You can check for specific error types (e.g., from OpenAI)
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ error: "Internal server error" });
    }
  }
});

// 5. Start Server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
