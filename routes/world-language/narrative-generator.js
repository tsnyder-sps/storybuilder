const express = require("express");
const router = express.Router();
const OpenAI = require("openai");

// Model connection and configuration
const model = process.env.OPENAI_MODEL || "gemma3:12b-it-q8_0";
const openai = new OpenAI({
  apiKey: "unused",
  baseURL: process.env.OPENAI_API_BASE,
  defaultHeaders: {
    "CF-Access-Client-Id": process.env.CF_ACCESS_CLIENT_ID,
    "CF-Access-Client-Secret": process.env.CF_ACCESS_CLIENT_SECRET,
  },
});

// Handle "GET /world-language/narrative-generator"
router.get("/", (req, res) => {
  res.render("world-language/narrative-generator", {
    title: "Narrative Generator",
    page: "world-language",
  });
});

//Matthew's narrative quiz generation endpoints
router.post("/quiz", async (req, res) => {
  const promptReq = req.body.prompt;
  try {
    const { prompt = promptReq, max_tokens = 8192 } = req.body;

    // Validate the prompt
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required." });
    }

    // // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: model,
      max_tokens: max_tokens,
      messages: [{ role: "user", content: prompt }],
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
        // store the AI response
        aiResponse += content;
      }
    }

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

// Matthew's narrative generation endpoint
router.post("/narrative", async (req, res) => {
  console.log("Received narrative generation request:", req.body);
  const vocabReq = req.body.vocab || "";
  const tenseReq = req.body.tense || "present";
  const additionalReq = req.body.additional || "";
  const paragraphCountReq = req.body.paragraphCount || 5;
  const languageReq = req.body.language || "French";
  var fullPrompt = `Write me a creative narrative in ${languageReq} that features the following vocabulary words: ${vocabReq}. The narrative may only use the following verb tenses: ${tenseReq}. The narrative must be only ${paragraphCountReq} paragraphs long. Return only the narrative.`;
  if (additionalReq != "") {
    //user gave extra info
    fullPrompt =
      fullPrompt +
      " Here are some additional instructions for the narrative: " +
      additionalReq;
  }
  try {
    // Validate the prompt
    if (!fullPrompt) {
      return res.status(400).json({ error: "Prompt is required." });
    }

    // // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: model,
      max_tokens: 8192,
      messages: [{ role: "user", content: fullPrompt }],
      stream: true,
      temperature: 2.0,
      min_p: 0.01,
      repeat_penalty: 1.0,
      top_k: 64,
      top_p: 0.95,
    });

    let aiResponse = "";

    for await (const chunk of completion) {
      //read response tokens
      if (chunk.choices[0]?.delta?.content) {
        const content = chunk.choices[0].delta.content;
        // store the AI response
        aiResponse += content;
      }
    }

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

module.exports = router;
