import express from 'express';
import OpenAI from 'openai';
import path from 'path';
import dotenv from 'dotenv'; // Comment to explain this later
const result = dotenv.config();

console.log(result);

const app = express();
const port = 8081; // which door for the application?

// Initialize OpenAI client with API key
const openai = new OpenAI({
  apiKey: 'unused',
  baseURL: process.env.OPENAI_API_BASE,
  defaultHeaders: {
    'CF-Access-Client-Id': process.env.CF_ACCESS_CLIENT_ID,
    'CF-Access-Client-Secret': process.env.CF_ACCESS_CLIENT_SECRET
  }
});
console.log(process.env.CF_ACCESS_CLIENT_ID);
console.log(process.env.CF_ACCESS_CLIENT_SECRET);

// statically set model (this works for both tensorrt as well as ollama)
const model = 'gemma3:12b-it-q8_0'

// Conversation/context storage
const conversations = new Map();
// Map is an array with an ID instead of index numbers.

app.use(express.json());

// serve static html frontend index.html
// get is method, app initializes express.
// ´/'is where the url for the client will go.
app.get('/', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'index.html')); // Sends individual file
});

// Get conversation history
// : means expecting input. conversationId is a query, AKA a value passed after question mark in url.
// req is what is being sent in. res is the response sent to the html file.
// no return because this function will keep running even when conversation id changes.
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
app.get('/chat/stream', async (req, res) => {
  try {
    const message = req.query.message;
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

    // Stream the response from the api
    const stream = await openai.chat.completions.create({
      model: model,
      messages: conversation,
      max_tokens: 8192,
      stream: true
    });

    let aiResponse = '';

    for await (const chunk of stream) {
      if (chunk.choices[0]?.delta?.content) {
        const content = chunk.choices[0].delta.content;
        // store the AI response
        aiResponse += content;
        // Send each chunk to frontend
        res.write(`data: ${content}\n\n`);
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


// run application
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

//hksjvfkodbkgewoiuhgeiuohgfujhrfhrkdu
