//needed for webserver component
import express from 'express';
//needed for interface to ollama host
import { Ollama } from 'ollama';
//filesystem access to static frontend
import path from 'path';

const app = express();
//server listen port (under 1024 needs root access w/ sudo)
const port = 8080;

// ollama server connection with nodejs library
const ollama = new Ollama({
  host: 'http://localhost:11434'
});

// statically set model type for ollama responses
const model = 'llama3.1:8b-instruct-q6_K'

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

// run application
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});


