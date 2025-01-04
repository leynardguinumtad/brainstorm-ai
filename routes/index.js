const path = require("path");
const axios = require("axios");
const express = require('express');
const router = express.Router();
const con = require("../db/connection");


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

    var featuredArticles;
    try
    {
        try
        {
            // Fetch featured articles
            const apiUrl = `https://en.wikipedia.org/api/rest_v1/feed/featured/${yyyy}/${mm}/${dd}`;
            const response = await axios.get(apiUrl);
            const mostRead = response.data.mostread.articles.slice(0, 10);

            // Map featured articles to required fields
            featuredArticles = mostRead.map((article) => ({
                title: article.titles.normalized,
                description: article.extract,
                image: article.thumbnail ? article.thumbnail.source : null,
                pageId: article.pageid,
            }));
            console.log(featuredArticles);
        }
        catch (error)
        {
            console.log(error);
            featuredArticles = [];
        }

        // Fetch additional articles for specific topics
        const fetchArticlesByCategory = async (category) =>
        {
            const apiUrl = `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=pageimages|extracts&exintro&explaintext&generator=categorymembers&gcmtitle=Category:${encodeURIComponent(
                category
            )}&gcmlimit=10&piprop=thumbnail&pithumbsize=300`;
            const response = await axios.get(apiUrl);
            const pages = response.data.query?.pages || {};

            return Object.values(pages).map((page) => ({
                title: page.title,
                description: page.extract || "No description available",
                image: page.thumbnail ? page.thumbnail.source : null,
                pageId: page.pageid,
            }));
        };

        // Fetch articles for medicine and business
        const [medicineArticles, businessArticles] = await Promise.all([
            fetchArticlesByCategory("Medicine"),
            fetchArticlesByCategory("Business"),
        ]);

        const sql = "SELECT * FROM brainstorm1s WHERE user_id = ?";
        con.query(sql, [req.session.user_id], (err, results) =>
        {
            if (err)
            {
                res.send(err);
            } else
            {
                res.render("home", {
                    most_read_articles: featuredArticles,
                    education: medicineArticles,
                    business: businessArticles,
                    history: results,
                    name: req.session.name,
                });
            }

        });


    } catch (error)
    {
        console.log(error);
        res.status(400).send(` error ${error}`);
    }
});


router.get("/manage", (req, res) =>
{
    let history_brainstorm1s;
    let history_brainstorm2s;
    let history_brainstorm3s;

    let sql = "SELECT * FROM brainstorm1s WHERE user_id = ?";
    con.query(sql, [req.session.user_id], (err, results) =>
    {
        if (err)
        {
            res.send(err);
        } else
        {
            history_brainstorm1s = results;
        }

    });

    sql = "SELECT * FROM brainstorm2s WHERE user_id = ?";
    con.query(sql, [req.session.user_id], (err, results) =>
    {
        if (err)
        {
            res.send(err);
        } else
        {
            history_brainstorm2s = results;
        }

    });

    sql = "SELECT * FROM brainstorm3s WHERE user_id = ?";
    con.query(sql, [req.session.user_id], (err, results) =>
    {
        if (err)
        {
            res.send(err);
        } else
        {
            history_brainstorm3s = results;
        }

    });




    res.render("manage", {
        history_brainstorm1s: history_brainstorm1s,
        history_brainstorm2s: history_brainstorm2s,
        history_brainstorm3s: history_brainstorm3s,
        name: req.session.name,
    });
});

module.exports = router;