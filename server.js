import OpenAI from 'openai';
//needed for webserver component
import express from 'express';
//filesystem access to static frontend
import path from 'path';

const app = express();
//server listen port (under 1024 needs root access w/ sudo)
const port = 3000;
app.use(express.json());

// serve static html frontend index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'index.html'));
});  

// Setup OpenAI client with API key
const openaiT = new OpenAI({
  apiKey: 'unused',
  baseURL: 'https://api-tensor.scarboroughschools.org/v1',
  defaultHeaders: {
    'CF-Access-Client-Id': process.env.CF_ACCESS_CLIENT_ID,
    'CF-Access-Client-Secret': process.env.CF_ACCESS_CLIENT_SECRET
  }
});

//generates a quiz for the given narrative
app.post('/writing/analzye', async (req, res) => {
  const promptReq = req.body.prompt;
  try {
    const { prompt = promptReq, max_tokens = 8192, model = "llama3.2" } = req.body;

    // Validate the prompt
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required." });
    };

    // // Call OpenAI API
    const completion = await openaiT.chat.completions.create({
      model: model,
      max_tokens: max_tokens,
      messages: [{ role: "user", content: prompt }],
      stream: true,
    });
   
    let aiResponse = '';

    for await (const chunk of completion) {
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

// run application
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});