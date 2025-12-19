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
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Transfer-Encoding", "chunked");
    res.setHeader("Cache-Control", "no-cache, no-transform"); // Stop caching
    res.setHeader("X-Accel-Buffering", "no");

    // Call OpenAI API
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

    for await (const chunk of completion) {
      if (chunk.choices[0]?.delta?.content) {
        const content = chunk.choices[0].delta.content;
        // Send the content to the client
        res.write(`data: ${content}\n\n`);
      }
    }
    res.write(`data: [DONE]\n\n`);
  } catch (error) {
    console.error("Streaming Error:", error);
    res.write("data: Error processing request. \n\n");
  } finally {
    res.end();
  }
});

// Matthew's quiz generation endpoint
router.post("/quiz", async (req, res) => {
  const questionsReq = req.body.questions || 10;
  const optionsReq = req.body.options || 4;
  const narrativeReq = req.body.narrative;
  const languageSelect = req.body.language;

  var fullPrompt = `Generate a multiple choice quiz in ${languageSelect} with ${questionsReq} questions that each have ${optionsReq} answer choices that is about the following narrative: ${narrativeReq}. Use sequential letters of the roman alphabet to denote answer options. Place the HTML tag <br> before the letter denoting each answer option. Use sequential numbers to denote the questions. Place an answer key after the quiz. Return only the quiz, including the answer key.`;

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
      temperature: 0.7,
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
