// Import libraries and define variables
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const app = express();
const port = 3000;
const OpenAI = require("openai");
require("dotenv").config({ path: "./.cf_access.env" });
const Ollama = require('ollama').Ollama;

// Setup express
app.use(cors());
app.use(express.static("public"));
app.use(express.json());

// Setup multer
const upload = multer({ storage: multer.memoryStorage() });

// Start the server
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);

  // ollama server connection with nodejs library
  const ollama = new Ollama({
    host: 'http://localhost:11434'
    });

  // statically set model type for ollama responses
  const model = 'gemma3:12b';

  // Setup OpenAI clients with API key
  const openaiT = new OpenAI({
    apiKey: "unused",
    baseURL: "https://api-tensor.scarboroughschools.org/v1",
    defaultHeaders: {
      "CF-Access-Client-Id": process.env.CF_ACCESS_CLIENT_ID,
      "CF-Access-Client-Secret": process.env.CF_ACCESS_CLIENT_SECRET,
    },
  });

  const openaiV = new OpenAI({
    apiKey: "unused",
    baseURL: "https://api-vlm.scarboroughschools.org/v1",
    defaultHeaders: {
      "CF-Access-Client-Id": process.env.CF_ACCESS_CLIENT_ID,
      "CF-Access-Client-Secret": process.env.CF_ACCESS_CLIENT_SECRET,
    },
  });

  // Express endpoints

  // Test auth
  app.post("/complete", async (req, res) => {
    const promptReq = req.body.prompt;
    try {
      const {
        prompt = promptReq,
        max_tokens = 8192,
        model = "gemma3:12b",
      } = req.body;

      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required." });
      }

      const completion = await openaiV.chat.completions.create({
        model: model,
        max_tokens: max_tokens,
        messages: [{ role: "user", content: prompt }],
        stream: false,
      });

      res.json({
        completion: completion.choices[0].message.content, // Direct access to content
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

  // Old Narrative generation endpoints
  app.post("/narrative_old/generate", async (req, res) => {
    const systemPrompt =
      "You are a highschool language teacher, and you want your students to read an interesting story to help learn the language. You want the stories to contain vocabulary words and verb tenses that match their high school expirience level";
    const userPrompt = req.body.prompt;
    console.log("User prompt:", userPrompt);
    try {
      console.log("Sending request using local openAI API...");
      const {
        prompt = userPrompt,
        max_tokens = 8192,
        model = "gemma3:12b",
      } = req.body;

      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required." });
      }

      const completion = await openaiT.chat.completions.create({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
        model: model,
        stream: false,
        max_tokens: max_tokens,
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

  // Chromebook Doctor endpoint (handling two images)
  app.post(
    "/chromebook-doctor",
    upload.fields([
      { name: "image_front", maxCount: 1 },
      { name: "image_back", maxCount: 1 },
    ]),
    async function (req, res) {
      if (!req.body.asset_tag) {
        return res.status(400).json({ error: "Missing asset_tag property" });
      }

      const assetTag = req.body.asset_tag;
      const systemPrompt =
        "You are an IT field technician, and you maintain a fleet of laptop devices for students in a high school. \
      You can identify damage to a device by looking at an images. Students are sending you 2 images, one of the front of the laptop \
      containing the screen and keyboard, and one of the back of the device containing the bottom of the case and back of the screen. \
      You rate the overall damage to the device on a scale from 1 - 100 with lower numbers indicating more damage.";
      const userPrompt = `Analyze these images and determine if the computer is damaged in any way. Provide a detailed summary of the damage, \
      and provide your overall rating. If your overall damage rating is 60 or below, or any of the components appear to be broken, begin your response \
      with the statement PLEASE VISIT THE IT OFFICE FOR ADDITIONAL INSPECTION in all bold`;

      try {
        if (!req.files || !req.files.image_front || !req.files.image_back) {
          return res
            .status(400)
            .json({ error: "Both image_front and image_back are required." });
        }

        const frontImage = req.files.image_front[0];
        const backImage = req.files.image_back[0];

        const base64FrontImage = `data:${
          frontImage.mimetype
        };base64,${frontImage.buffer.toString("base64")}`;
        const base64BackImage = `data:${
          backImage.mimetype
        };base64,${backImage.buffer.toString("base64")}`;

        const completion = await openaiV.chat.completions.create({
          messages: [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: [
                { type: "text", text: userPrompt },
                { type: "image_url", image_url: { url: base64FrontImage } },
                { type: "image_url", image_url: { url: base64BackImage } },
              ],
            },
          ],
          model: "gemma3:12b",
          stream: false,
          max_tokens: 8192,
          temperature: 0.2,
        });

        res.json({
          completion: completion.choices[0].message.content,
        });
      } catch (error) {
        console.error("Error calling OpenAI API: ", error);
        if (error.response) {
          res.status(error.response.status).json(error.response.data);
        } else if (error.request) {
          console.error("No response received:", error.request);
          res.status(500).json({ error: "No response from server" });
        } else {
          res.status(500).json({ error: "Internal server error" });
        }
      }
    }
  );

  //Matthew's narrative quiz generation endpoint
  app.post("/narrative/quiz", async (req, res) => {
    const promptReq = req.body.prompt;
    try {
      const {
        prompt = promptReq,
        max_tokens = 8192,
        model = "gemma3:12b",
      } = req.body;

      // Validate the prompt
      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required." });
      }

      // // Call OpenAI API
      const completion = await openaiT.chat.completions.create({
        model: model,
        max_tokens: max_tokens,
        messages: [{ role: "user", content: prompt }],
        stream: true,
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
  app.post("/narrative/generate", async (req, res) => {
    const promptReq = req.body.prompt;
    try {
      const {
        prompt = promptReq,
        max_tokens = 8192,
        model = "gemma3:12b",
      } = req.body;

      // Validate the prompt
      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required." });
      }

      // // Call OpenAI API
      const completion = await openaiT.chat.completions.create({
        model: model,
        max_tokens: max_tokens,
        messages: [{ role: "user", content: prompt }],
        stream: true,
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

  // Matthew's writing analysis endpoint
  app.post("/writing/analzye", async (req, res) => {
    const promptReq = req.body.prompt;
    try {
      const {
        prompt = promptReq,
        max_tokens = 8192,
        model = "gemma3:12b",
      } = req.body;

      // Validate the prompt
      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required." });
      }

      // // Call OpenAI API
      const completion = await openaiT.chat.completions.create({
        model: model,
        max_tokens: max_tokens,
        messages: [{ role: "user", content: prompt }],
        stream: true,
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

  ////////////////////////////////////// Begin Aditya's Verb conjugation endpoint
  // Conversation/context storage
  const conversations = new Map();
  
  // Get conversation history
  app.get('/conversation/:conversationId', (req, res) => {
    const { conversationId } = req.params;
    const conversation = conversations.get(conversationId) || [];
    res.json(conversation);
  });

  // Clear conversation
  app.delete('/conversation/:conversationId', (req, res) => {
    const { conversationId } = req.params;
    conversations.delete(conversationId);
    res.sendStatus(200);
  });
  
  // Streaming chat endpoint using server sent events
  app.get('verb/chat/stream', async (req, res) => {
  try {
    const message = req.query.message;
    //Maybe this
    //const message = req.body.prompt;
    const conversationId = req.query.conversationId;

    // Get or create conversation history
    let conversation = conversations.get(conversationId) || [];

    // Add user message to history
    conversation.push({ role: 'user', content: message });

    // Set headers for streamed messages to web browser
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });

    // Stream the response from Ollama
    const stream = await ollama.chat({
      model: model,
      messages: conversation,
      stream: true
    });

    let aiResponse = '';

    for await (const chunk of stream) {
      if (chunk.message?.content) {
        // store the AI response
        aiResponse += chunk.message.content;
        // Send each chunk to frontend
        res.write(`data: ${chunk.message.content}\n\n`);
      }
    }

    // Add complete AI response to conversation context
    conversation.push({ role: 'assistant', content: aiResponse });
    conversations.set(conversationId, conversation);

    // mark end of streaming response
    res.write('data: [DONE]\n\n');
  } catch (error) {
    console.error('Streaming Error:', error);
    res.write('data: Error processing request\n\n');
  } finally {
    res.end();
  }
  });
  ////////////////////////////////////// End Aditya's Verb conjugation endpoint
});
