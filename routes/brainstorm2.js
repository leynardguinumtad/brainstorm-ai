const path = require('path');
const axios = require('axios');
const express = require('express');

const router = express.Router();


router.get('/highlight', (req, res) =>
{
    res.render('highlight');
});

router.get('/load-wiki', async (req, res) =>
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


router.get('/article', (req, res) =>
{
    res.render('brainstorm2/article');
})

router.get('/wiki', (req, res) =>
{
    res.render('brainstorm2/wiki', { articleData: null });
});


router.get('/brainstorm2', (req, res) =>
{
    res.render('brainstorm2/brainstorm-from-text');
});


module.exports = router;
