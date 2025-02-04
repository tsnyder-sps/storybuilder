import express from 'express';
import OpenAI from 'openai';
import path from 'path';

const app = express();
const port = 8080;

// Initialize OpenAI client with API key
const openai = new OpenAI({
  apiKey: 'unused',
  baseURL: process.env.OPENAI_API_BASE,
  defaultHeaders: {
    'CF-Access-Client-Id': process.env.CF_ACCESS_CLIENT_ID,
    'CF-Access-Client-Secret': process.env.CF_ACCESS_CLIENT_SECRET
  }
});

// statically set model (this works for both tensorrt as well as ollama)
const model = 'llama3.2-vision:latest'

// Conversation/context storage
const conversations = new Map();

app.use(express.json());

// serve static html frontend index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'index.html'));
});

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
