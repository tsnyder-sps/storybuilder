// Import libraries and define variables
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const app = express();
const fs = require('fs');
const port = 3000;
const OpenAI = require('openai');

// Setup express
app.use(cors());
app.use(express.static('public'));
app.use(express.json());

// Setup multer
const storage = multer.diskStorage({
  destination: './uploads/', 
  filename: (req, file, callback) => {
    const assetTag = req.body.asset_tag;
    callback(null, assetTag + '-' + file.fieldname + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Setup OpenAI client with API key
const openaiT = new OpenAI({
  apiKey: 'unused',
  baseURL: 'https://api-tensor.scarboroughschools.org/v1',
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
    const { prompt = promptReq, max_tokens = 8192, model = "llama3.2" } = req.body;

    // Validate the prompt
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required." });
    };

    console.log('before completion');
    // // Call OpenAI API
    const completion = await openaiT.chat.completions.create({
      model: model,
      max_tokens: max_tokens,
      messages: [{ role: "user", content: prompt }],
      stream: true,
    });

    // for await (const chunk of completion) {
    //   console.log(chunk.choices[0].delta.content);
    // };
    
    let aiResponse = '';

    for await (const chunk of completion) {
      if (chunk.choices[0]?.delta?.content) {
        const content = chunk.choices[0].delta.content;
        // store the AI response
        aiResponse += content;
        // Send each chunk to frontend
        // res.write(`data: ${content}\n\n`);
        console.log(aiResponse);
        
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

// Narrative generation endpoints
app.post('/narrative/generate', async (req, res) => {
  const systemPrompt = "You are a highschool language teacher, and you want your students to read an interesting story to help learn the language. You want the stories to contain vocabulary words and verb tenses that match their high school expirience level";
  const userPrompt = req.body.prompt; // Get the prompt from the request body
  console.log("User prompt:", userPrompt); // Log the received prompt
  try {
    console.log("Sending request using local openAI API...");
    const { prompt = "json.stringify(bodyPrompt)", model = "llama3.2" } = req.body;
    
    // Validate the prompt
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required." });
    };
    // const fetch = (await import('node-fetch')).default;

    // Call OpenAI API
    const completion = await openaiT.chat.completions.create({
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: userPrompt
        }
      ],
      model: model,
      stream: false,
      max_tokens: 8192
    });

    const responseData = await completion.choices[0].message.content;

    console.log(responseData);

    res.json({
      completion: responseData,
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



// Chromebook Doctor endpoints

//store base64 images
var frontBase64String = '';
var backBase64String = '';

app.post('/chromebook-doctor', upload.any(), function (req, res, next) {
  const assetTag = req.body.asset_tag
  console.log(req.files, req.body); // Upload information is stored in req.file and text field in req.body
  res.json({ message: `File uploaded sucessfully for asset tag ${assetTag}` });
  //get base64 strings
  fs.readFile(`uploads/${assetTag}-image_front.jpg`, (err, data) => {
    if (err) {
      console.log(err);
    } else {
      frontBase64String = data.toString('base64');
      //move on to read the next file
      fs.readFile(`uploads/${assetTag}-image_back.jpg`, (err, data) => {
        if (err) {
          console.log(err);
        } else {
          backBase64String = data.toString('base64');
          //now have both images, can send off to ollama here
          const fullPrompt = `Analyze these images and determine if they are damaged in any way. Provide a detailed summary of the damage, and provide a rating for the condition of the device on a scale of 1 to 100`;
       
          try {
           const response = fetch('http://localhost:3000/api/generate', {
             method: 'POST',
             headers: {
               'Content-Type': 'application/json',
             },
             body: JSON.stringify({ prompt: fullPrompt }),
           });
           setTimeout(() => {
            if (!response.ok) {
              throw new Error(`Server error: ${response.statusText}`);
            }
    
            const data = response.json();
            responseDiv.innerHTML = data.response; // Directly set the innerHTML
           }, 120 * 1000);
         } catch (error) {
           console.error(error);
           responseDiv.textContent = 'Error generating text.';
         }
        }
      });
    }
    
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});