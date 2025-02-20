// Import libraries and define variables
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const app = express();
const port = 3000;
const OpenAI = require('openai');
require('dotenv').config({ path: './.cf_access.env'});

// DEBUG ENV
// console.log('Process environment variables:');
// console.log(process.env);

// console.log('\nLoading.env file:');
// require('dotenv').config();
// console.log('After loading.env file:');
// console.log(process.env);

// console.log('\nContents of.env file:');
// console.log(require('fs').readFileSync('.env', 'utf8'));

// Setup express
app.use(cors());
app.use(express.static('public'));
app.use(express.json());

// Setup multer
const upload = multer({ storage: multer.memoryStorage() });

// Start the server
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);


  // Setup OpenAI clients with API key
  const openaiT = new OpenAI({
    apiKey: 'unused',
    baseURL: 'https://api-tensor.scarboroughschools.org/v1',
    defaultHeaders: {
      'CF-Access-Client-Id': process.env.CF_ACCESS_CLIENT_ID,
      'CF-Access-Client-Secret': process.env.CF_ACCESS_CLIENT_SECRET
    }
  });

  const openaiV = new OpenAI({
    apiKey: 'unused',
    baseURL: 'https://api-vlm.scarboroughschools.org/v1',
    defaultHeaders: {
      'CF-Access-Client-Id': process.env.CF_ACCESS_CLIENT_ID,
      'CF-Access-Client-Secret': process.env.CF_ACCESS_CLIENT_SECRET
    }
  });

  // Express endpoints

  // Test auth
  app.post('/complete', async (req, res) => {
    const promptReq = req.body.prompt;
    try {
      const { prompt = promptReq, max_tokens = 8192, model = "llama3.2-vision"} = req.body;

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

  // Narrative generation endpoints
  app.post('/narrative/generate', async (req, res) => {
    const systemPrompt = "You are a highschool language teacher, and you want your students to read an interesting story to help learn the language. You want the stories to contain vocabulary words and verb tenses that match their high school expirience level";
    const userPrompt = req.body.prompt;
    console.log("User prompt:", userPrompt);
    try {
      console.log("Sending request using local openAI API...");
      const { prompt = userPrompt, max_tokens = 8192, model = "llama3.1" } = req.body;

      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required." });
      }

      const completion = await openaiT.chat.completions.create({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt }
        ],
        model: model,
        stream: false,
        max_tokens: max_tokens
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
  app.post('/chromebook-doctor', upload.fields([
    { name: 'image_front', maxCount: 1 },
    { name: 'image_back', maxCount: 1 }
  ]), async function (req, res) {
    if (!req.body.asset_tag) {
        return res.status(400).json({ error: "Missing asset_tag property" });
    }

    const assetTag = req.body.asset_tag;
    const systemPrompt = "You are an IT field technician, and you maintain a fleet of laptop devices for students in a high school. \
      You can identify damage to a device by looking at an images. Students are sending you 2 images, one of the front of the laptop \
      containing the screen and keyboard, and one of the back of the device containing the bottom of the case and back of the screen. \
      You rate the overall damage to the device on a scale from 1 - 100 with lower numbers indicating more damage.";
    const userPrompt = `Analyze these images and determine if the computer is damaged in any way. Provide a detailed summary of the damage, \
      and provide your overall rating. If your overall damage rating is 60 or below, or any of the components appear to be broken, begin your response \
      with the statement PLEASE VISIT THE IT OFFICE FOR ADDITIONAL INSPECTION in all bold`;

    try {
        if (!req.files || !req.files.image_front || !req.files.image_back) {
            return res.status(400).json({ error: "Both image_front and image_back are required." });
        }

        const frontImage = req.files.image_front[0];
        const backImage = req.files.image_back[0];


        const base64FrontImage = `data:${frontImage.mimetype};base64,${frontImage.buffer.toString('base64')}`;
        const base64BackImage = `data:${backImage.mimetype};base64,${backImage.buffer.toString('base64')}`;

        const completion = await openaiV.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                {
                    role: "user",
                    content: [
                        { type: "text", text: userPrompt },
                        { type: "image_url", image_url: { url: base64FrontImage } },
                        { type: "image_url", image_url: { url: base64BackImage } }
                    ]
                }
            ],
            model: "llama3.2-vision",
            stream: false,
            max_tokens: 8192,
            temperature: 0.2
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
  });
});