const express = require("express");
const path = require("path");
const axios = require("axios");
const app = express();

const { GoogleGenerativeAI } = require("@google/generative-ai");
const { render } = require("ejs");

const genAI = new GoogleGenerativeAI("AIzaSyAd78ny7jD23ZLIXbuPH41TRRiscLFItOU");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
// Set up middleware and configurations

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));

app.get("/", async (req, res) =>
{
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    try
    {
        const apiUrl = `https://en.wikipedia.org/api/rest_v1/feed/featured/${yyyy}/${mm}/${dd}`;
        const response = await axios.get(apiUrl);
        //the most read articles are featured in the wikipedia
        const mostRead = response.data.mostread.articles.slice(0, 10);
        console.log(mostRead);

        // use map to extract necessary information
        var articles = mostRead.map((article) => ({
            title: article.titles.normalized,
            description: article.extract,
            image: article.thumbnail ? article.thumbnail.source : null,
            pageId: article.pageid,
        }));

        res.render("dashboard", { articles });

    } catch (error)
    {
        console.log(error);
        res.status(400).send(`${error}`);

    }
});

app.get('/highlight', (req, res) =>
{
    res.render('highlight');
});

app.get('/load-wiki', async (req, res) =>
{
    const article = req.query.article || 'Node.js';
    const wikipediaUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(article)}`;

    try
    {
        const response = await axios.get(wikipediaUrl);
        const data = response.data;
        res.render('wiki', { articleData: data });
    } catch (error)
    {
        res.render('wiki', { articleData: null });
    }
});


app.get('/article', (req, res) =>
{
    res.render('article');
})

app.get('/wiki', (req, res) =>
{
    res.render('wiki', { articleData: null });
});

app.get("/brainstorm", (req, res) =>
{
    res.render("brainstorm");
});

app.get('/brainstorm2', (req, res) =>
{
    res.render('brainstorm-from-text');
});

app.get("/search", (req, res) =>
{
    res.render("search");
});


let list_selected_texts = []; // To store the questions temporarily

app.post('/start-stream', express.json(), (req, res) =>
{
    list_selected_texts = req.body.list_selected_texts || [];
    console.log(list_selected_texts);

    if (!list_selected_texts.length)
    {
        return res.status(400).send('No list_selected_texts provided.');
    }
    res.status(200).send('Stream initialized.');
});

app.get('/llm-stream', async (req, res) =>
{
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try
    {
        const prompt = `relate the following texts: ${list_selected_texts}`;
        console.log(prompt);

        const result = await model.generateContentStream(prompt);

        for await (const chunk of result.stream)
        {
            const chunkText = chunk.text();
            res.write(`data: ${chunkText}\n\n`);
        }


        res.end(); // Close the connection
    } catch (error)
    {
        console.error("Error during streaming:", error);
        res.write(`data: Error: ${error.message}\n\n`);
        res.end();
    }
});



app.get('/ask', (req, res) =>
{
    res.render('test/ask');
});


app.get("/about", (req, res) =>
{
    res.render("about");
});

app.get('/try', (req, res) =>
{
    res.render('test/try');
});

app.get('/llm', async (req, res) =>
{
    const prompt = "Write a story about a magic backpack.";

    const result = await model.generateContentStream(prompt);

    // Print text as it comes in.
    for await (const chunk of result.stream)
    {
        const chunkText = chunk.text();
        process.stdout.write(chunkText);
    }
});

// Step 5: Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
{
    console.log(`Server is running on http://localhost:${PORT}`);
});
