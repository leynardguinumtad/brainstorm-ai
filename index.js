const express = require("express");
const path = require("path");
const axios = require("axios");
const app = express();

// Set up middleware and configurations

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));

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

app.get("/brainstorm", (req, res) =>
{
    res.render("brainstorm");
});

app.get("/search", (req, res) =>
{
    res.render("search");
});


app.get("/about", (req, res) =>
{
    res.render("about");
});

app.get('/try', (req, res) =>
{
    res.render('try');
})

// Step 5: Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
{
    console.log(`Server is running on http://localhost:${PORT}`);
});
