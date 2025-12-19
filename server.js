import express from 'express';

const app = express();
const port = 4000;

// Serve static files from 'Testing' folder.
app.use(express.static('Testing'));

app.get('/frontend', (req, res) => {
    res.json({ text: "You just lost the game!"});
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
}); 