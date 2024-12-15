const path = require("path");
const axios = require("axios");
const express = require('express');
const router = express.Router();


router.get("/", (req, res) =>
{
    res.render("landing");
});

router.get("/logout", (req, res) =>
{
    req.session.destroy((err) =>
    {
        if (err)
        {
            console.error(err);
            res.redirect("/auth/login");

        }
        else
        {
            console.log("session destroyed");
            res.redirect("/auth/login");

        }
    })
});

router.get("/home", async (req, res) =>
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

        res.render("home", { articles });

    } catch (error)
    {
        console.log(error);
        res.status(400).send(`${error}`);

    }
});

router.post("/try-axios", (req, res) =>
{
    const { var1, var2 } = req.body;
    console.log("axios is working");
    console.log(var1);
    console.log(var2);



});

module.exports = router;