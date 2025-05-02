import express from 'express';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import strip from 'strip-markdown';

const processor = unified()
  .use(remarkParse)
  .use(strip);

async function stripMarkdown(text) {
  const file = await processor.process(text);
  return String(file);
}

dotenv.config({
  path: "./.stuff.env"
});

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
const model = 'gemma3:12b-it-q8_0';

// Conversation/context storage
const conversations = new Map();

app.use(express.json());

// serve static html frontend index.html
app.use(express.static("public"));

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
      stream: true,
      temperature: 1.0,
      min_p: 0.01,
      repeat_penalty: 1.0,
      top_k: 64,
      top_p: 0.95,
    });

    let aiResponse = '';

    for await (const chunk of stream) {
      if (chunk.choices[0]?.delta?.content) {
        const content = chunk.choices[0].delta.content;
        const cleanedContent = await stripMarkdown(content);
        aiResponse += cleanedContent;
        res.write(`data: ${cleanedContent}\n\n`);
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