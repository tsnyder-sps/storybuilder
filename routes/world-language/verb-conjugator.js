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

// Handle "GET /world-language/verb-conjugator"
router.get("/", (req, res) => {
  res.render("world-language/verb-conjugator", {
    title: "Verb Conjugator",
    page: "world-language",
  });
});

const conversations = new Map();

// Get conversation history (Keep this as is - client uses it)
router.get(
  "/world-language/verb-conjugator/conversation/:conversationId",
  (req, res) => {
    const { conversationId } = req.params;
    const conversation = conversations.get(conversationId) || [];
    res.json(conversation);
  }
);

// Clear conversation (Keep this as is - client uses it)
router.delete(
  "/world-language/verb-conjugator/conversation/:conversationId",
  (req, res) => {
    const { conversationId } = req.params;
    conversations.delete(conversationId);
    res.sendStatus(200);
  }
);

// NEW: Standard POST Chat Endpoint (Replaces /chat/stream)
router.post(
  "/world-language/verb-conjugator/chat/message",
  async (req, res) => {
    try {
      // 1. Get inputs from the JSON body
      const { prompt, conversationId } = req.body;

      if (!prompt || !conversationId) {
        return res
          .status(400)
          .json({ error: "Missing prompt or conversationId" });
      }

      // 2. Get or create conversation history
      let conversation = conversations.get(conversationId) || [];

      // 3. Add user message to history
      conversation.push({ role: "user", content: prompt });

      // 4. Call Ollama (Non-streaming)
      // We set stream: false to get the whole text at once
      const response = await openai.chat.completions.create({
        model: model,
        max_tokens: 8192,
        messages: conversation,
        stream: false,
      });

      const aiText = response.choices[0].message.content;

      // 5. Update history
      conversation.push({ role: "assistant", content: aiText });
      conversations.set(conversationId, conversation);

      // 6. Send JSON response to client
      res.json({
        completion: aiText,
      });
    } catch (error) {
      console.error("Chat Error:", error);
      res.status(500).json({ error: "Error processing request" });
    }
  }
);

module.exports = router;
