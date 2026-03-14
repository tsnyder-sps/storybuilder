import express from 'express'; // Defines a routing system between server and client.
import OpenAI from 'openai'; // Calling the AI.
import path from 'path'; // Handling file and directory paths, works for ANY platform.
import dotenv from 'dotenv'; // Storing keys separately from the project and loading them at runtime.
console.log(dotenv.config());

const app = express();
const port = 4000; // THE DOOR

// Initializing OpenAI client with API key
const openai = new OpenAI({
  apiKey: 'unused',
  baseURL: process.env.OPENAI_API_BASE,
  defaultHeaders: {
    'CF-Access-Client-Id': process.env.CF_ACCESS_CLIENT_ID,
    'CF-Access-Client-Secret': process.env.CF_ACCESS_CLIENT_SECRET
  }
});

// Statistically set model
const model = 'gemma3:12b-it-q8_0'

// Conversation/context storage
const conversations = new Map();
// Map is an array with an ID instead of index numbers.

// Translates JSON into readable JS objects. 
// Must come before routes so the JSON in the routes exist.
app.use(express.json());
// Serve static files from 'Calc' folder.
app.use(express.static('Calc'));

// Default route, for requests that do not match any defined routes.
// req is what is being sent in. res is the response sent to the html file.
app.get('/', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'index.html')); // Sends the file
});

// Get conversation history
// No return because this will keep running even when the conversation ID changes.
app.get('/conversation/:conversationId', (req, res) => {
  const { conversationId } = req.params; // Stores the ID passed in.
  const conversation = conversations.get(conversationId) || []; // Gets the old messages using the ID...
  // (if none exist an empty list is created)
  res.json(conversation); // ...then sends it.
});

// Clear conversation using ID passed in.
app.delete('/conversation/:conversationId', (req, res) => {
    const { conversationId } = req.params; // Stores ID that was passed in.
    conversations.delete(conversationId); // Deletes corresponding conversation.
    res.sendStatus(200);
    // HTTP status code 200 tells the browser this was successful.
});

app.post('/chat', async (req, res) => {
    // Async so I can wait for the AI to think and respond.
    try {
        // Access data sent by the client.
        const aiPrompt = req.body.prompt;
        const conversationId = req.body.conversation;
        // Get conversation history, if empty create a new one.
        let conversation = conversations.get(conversationId) || [];
        // Then, the request is added to the conversation.
        // This allows the AI to have the full context.
        conversation.push({ role: 'user', content: aiPrompt });
        // Save back to the conversations Map object.
        conversations.set(conversationId, conversation);
        // Call the AI.
        const aiCall = await openai.chat.completions.create({
            model: model,
            messages: conversation, // Full chat history
            max_tokens: 8192 // Word limit
        });
        // Extract content from the array sent back by the AI.
        const aiResponse = aiCall.choices[0].message.content;
        // Add AI response to the conversation.
        conversation.push({role: 'ai', content: aiResponse});
        // Send response back to the client.
        res.json({
            response: aiResponse
        });

    } catch (error) {
        console.error("OpenAI Error:", error);
        res.json({response: "Something went wrong with the request."});
    }
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
}); 

// TODO: look at docker stuff for app. MCP, giving docs to a server to monitor and make changes to lots of apps.