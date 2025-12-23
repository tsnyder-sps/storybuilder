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

//Matthew's narrative generation endpoint
router.post("/narrative", async (req, res) => {
  console.log("Received narrative generation request:", req.body);
  const vocabReq = req.body.vocab || "";
  const tenseReq = req.body.tense || "present";
  const additionalReq = req.body.additional || "";
  const paragraphCountReq = req.body.paragraphCount || 5;
  const languageReq = req.body.language || "French";
  var fullPrompt = `
    Write a creative narrative in ${languageReq} that features the following vocabulary: ${vocabReq}. 
    Verb tenses: ${tenseReq}. 
    Length: ${paragraphCountReq} paragraphs.
    
    IMPORTANT: Return your response as a valid JSON object with exactly two keys:
    1. "title": A creative title for the narrative.
    2. "story": The narrative text itself (you may use Markdown formatting).
  `;

  if (additionalReq !== "") {
    fullPrompt += " Additional instructions: " + additionalReq;
  }
  try {
    // Validate the prompt
    if (!fullPrompt) {
      return res.status(400).json({ error: "Prompt is required." });
    }

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: model,
      max_tokens: 8192,
      messages: [{ role: "user", content: fullPrompt }],
      stream: false,
      response_format: { type: "json_object" },
      temperature: 2.0,
      min_p: 0.01,
      repeat_penalty: 1.0,
      top_k: 64,
      top_p: 0.95,
    });

    let aiRaw = completion.choices[0].message.content;
    if (aiRaw.startsWith("```json")) {
      aiRaw = aiRaw.replace(/^```json\s*/, "").replace(/\s*```$/, "");
    } else if (aiRaw.startsWith("```")) {
      aiRaw = aiRaw.replace(/^```s*/, "").replace(/\s*```$/, "");
    }

    let parsedContent = {};

    try {
      parsedContent = JSON.parse(aiRaw);
    } catch (error) {
      console.warn(
        "JSON parse failed. Attempting regex fallback. Raw:",
        aiRaw,
        "Error:",
        error
      );
      const titleMatch = aiRaw.match(/"title":\s*"((?:[^"\\]|\\.)*)"/);
      const title = titleMatch ? titleMatch[1] : "Generated Narrative";
      const storyMatch = aiRaw.match(/"story":\s*"([\s\S]*?)"\s*}/);
      if (storyMatch) {
        parsedContent = {
          title: title,
          story: storyMatch[1].replace(/\\"/g, '"').replace(/\\n/g, "\n"), // Unescape manually,
        };
      } else {
        parsedContent = {
          title: "Generated Narrative (Raw Output)",
          story: aiRaw,
        };
      }
    }

    res.json({
      title: parsedContent.title,
      story: parsedContent.story,
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
