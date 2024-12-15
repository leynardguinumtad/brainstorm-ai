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

// router.get("/home", async (req, res) =>
// {
//     const today = new Date();
//     const yyyy = today.getFullYear();
//     const mm = String(today.getMonth() + 1).padStart(2, "0");
//     const dd = String(today.getDate()).padStart(2, "0");

//     try
//     {
//         // Fetch featured articles
//         const apiUrl = `https://en.wikipedia.org/api/rest_v1/feed/featured/${yyyy}/${mm}/${dd}`;
//         const response = await axios.get(apiUrl);

//         // The most-read articles (featured in Wikipedia)
//         const mostRead = response.data.mostread.articles.slice(0, 10);

//         // Use map to extract necessary information from most-read articles
//         const featuredArticles = mostRead.map((article) => ({
//             title: article.titles.normalized,
//             description: article.extract,
//             image: article.thumbnail ? article.thumbnail.source : null,
//             pageId: article.pageid,
//         }));

//         // Shuffle function to randomize the array
//         const shuffleArray = (array) =>
//         {
//             for (let i = array.length - 1; i > 0; i--)
//             {
//                 const j = Math.floor(Math.random() * (i + 1));
//                 [array[i], array[j]] = [array[j], array[i]]; // Swap elements
//             }
//             return array;
//         };

//         // Fetch articles for each category
//         const fetchCategoryArticles = async (category) =>
//         {
//             const categoryUrl = `https://en.wikipedia.org/w/api.php?action=query&format=json&list=categorymembers&cmtitle=Category:${category}&cmlimit=30`; // Fetch more articles to shuffle
//             const categoryResponse = await axios.get(categoryUrl);
//             // return categoryResponse.data.query.categorymembers.map((article) => ({
//             //     title: article.title,
//             //     description: article.description,  // Placeholder description
//             //     image: null,  // Placeholder for image
//             //     pageId: article.pageid,
//             // }));
//             return categoryResponse.data.query.categorymembers;
//         };

//         // Fetch articles for each category in parallel
//         const educationArticles = await fetchCategoryArticles('medicine');
//         const businessArticles = await fetchCategoryArticles('business');

//         // Shuffle the articles for randomness
//         const randomEducationArticles = shuffleArray(educationArticles).slice(0, 5);  // Select 5 random articles
//         const randomBusinessArticles = shuffleArray(businessArticles).slice(0, 5);    // Select 5 random articles

//         // Render the articles, keeping them in separate groups
//         res.send({
//             most_read_articles: featuredArticles,
//             education: randomEducationArticles,
//             business: randomBusinessArticles,
//         });

//         // res.render("home", {
//         //     most_read_articles: featuredArticles,
//         //     education: randomEducationArticles,
//         //     business: randomBusinessArticles,
//         // });

//     } catch (error)
//     {
//         console.log(error);
//         res.status(400).send(`${error}`);
//     }
// });
router.get("/home", async (req, res) =>
{
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");

    try
    {
        // Fetch featured articles
        const apiUrl = `https://en.wikipedia.org/api/rest_v1/feed/featured/${yyyy}/${mm}/${dd}`;
        const response = await axios.get(apiUrl);
        const mostRead = response.data.mostread.articles.slice(0, 10);

        // Map featured articles to required fields
        const featuredArticles = mostRead.map((article) => ({
            title: article.titles.normalized,
            description: article.extract,
            image: article.thumbnail ? article.thumbnail.source : null,
            pageId: article.pageid,
        }));

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



        res.render("home", {
            most_read_articles: featuredArticles,
            education: medicineArticles,
            business: businessArticles,
        });

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