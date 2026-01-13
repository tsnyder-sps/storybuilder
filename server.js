import express from 'express';
import OpenAI from 'openai';
import path from 'path';
import dotenv from 'dotenv';
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
// console.log(process.env.CF_ACCESS_CLIENT_ID); 
// console.log(process.env.CF_ACCESS_CLIENT_SECRET);

// Statistically set model
const model = 'gemma3:12b-it-q8_0'

// Conversation/context storage
const conversations = new Map();
// Map is an array with an ID instead of index numbers.

// Serve static files from 'Calc' folder.
app.use(express.static('Calc'));

// Default route 
// req is what is being sent in. res is the response sent to the html file.
app.get('/', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'index.html')); // Sends the file
});

// Get conversation history
// : means expecting input. conversationId is a query, AKA a value passed after question mark in url.
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

app.get('/chat/stream', async (req, res) => {
    // Async so I can wait for the AI to think and respond.
    try { // Catching errors like the AI being offline so the server doesn't crash.
        const message = req.query.message; // Gets user text from the URL.
        const conversationId = req.query.conversationId; // Gets ID to know which chat history to use.

        // Get conversation history, if empty create a new one.
        let conversation = conversations.get(conversationId) || [];
        // Then, the user's new message is added to the history.
        // This allows the AI to have the full context.
        conversation.push({ role: 'user', content: message });

        // Telling the browser...
        res.writeHead(200,{ // The request was successful.
            'Content-Type': 'text/event-stream',
            // Don't download this as a file because it's a stream of data.
            'Cache-Control': 'no-cache',
            // Don't save a copy of this.
            'Connection': 'keep-alive'
            // Keep the connection going so data can keep flowing.
        });

        // Now the AI is called.
        const stream = await openai.chat.completions.create({ //******* Syntax error here. You had "open.ai.chat.completions.create({" */
            // Request sent to local AI. Everything below is passed.
            model: model,
            messages: conversation, // Full chat history
            max_tokens: 8192, // Word limit
            stream: true // Sends every word continously.
        });

        let aiResponse = '';

        for await (const chunk of stream)
        { // Runs every time a piece of a word is received from the AI.
            if (chunk.choices[0]?.delta?.content)
            { // Does the chunk actually contain text?
                const content = chunk.choices[0].delta.content;
                // Extracts the chunk content as a string...
                aiResponse += content; //...then adds it to the full response.
                res.write(`data: ${content}\n\n`); //*******Found a syntax issue here. There was an extra space after the : so the SSE message to the client was malformed */
                // Sends each chunk to the website.
            }
        }

        conversation.push({ role: 'assistant', content: aiResponse });
        // Once the loop is done, the full answer is added to the history.
        conversations.set(conversationId, conversation); //*******Found a syntax issue here. We need to set the conversation in the Map object itself. */
        // Saves the history back into the Map for next time.

        // Signals end of AI response
        res.write('data: [DONE]\n\n');
    } catch (error) {
        // If anything breaks, log the error and send it.
        res.write('data: Error processing request\n\n');
    } finally {
        res.end(); // Connection terminated.
    }
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
}); 