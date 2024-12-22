const path = require('path');
const axios = require('axios');
const express = require('express');

const { GoogleGenerativeAI } = require("@google/generative-ai");
const { render } = require("ejs");
const { log } = require("console");
const genAI = new GoogleGenerativeAI("AIzaSyAd78ny7jD23ZLIXbuPH41TRRiscLFItOU");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
// Set up middleware and configurations


const router = express.Router();


router.get('/lab', (req, res) =>
{
    res.render('brainstorm2/lab');
});


// router.post("/generate-fdr-data", async (req, res) =>
// {
//     const ideas_list = req.body.ideas;
//     console.log(ideas_list);

//     const prompt = `given an array of ideas, generate a data for the force-directed graph (i.e., nodes and links) that relate these ideas. Ideas: [${ideas_list}]. Sample output:  
//        const nodes = [
//         { id: 1, label: "idea 1", info: "This is idea 1's info." },
//         { id: 2, label: "idea 2", info: "This is idea 2's info." },
//         { id: 3, label: "idea 3", info: "This is idea 3's info." },
//     ];

//     const links = [
//         { source: 1, target: 2 },
//         { source: 1, target: 3 },
//         { source: 2, target: 4 },
//     ];`;

//     console.log(prompt);
//     const result = await model.generateContent(prompt);
//     const resultText = await result.response.text();

//     // Call the function to extract the ideas and links from the response text
//     const extractedData = extractNodesAndLinks(resultText);

//     if (extractedData)
//     {
//         console.log('Extracted Data:', extractedData);
//         res.json(extractedData);  // Sending the extracted data back in the response
//     } else
//     {
//         console.error('No valid format found in the response.');
//         res.status(400).send('No valid format found.');
//     }
// });

// // Function to extract ideas and links data using regular expressions
// function extractNodesAndLinks(responseText)
// {
//     // Regular expression to match the ideas and links data
//     const nodesPattern = /const nodes = \[([\s\S]+?)\];/;
//     const linksPattern = /const links = \[([\s\S]+?)\];/;

//     // Extract ideas and links from the response
//     const nodesMatch = responseText.match(nodesPattern);
//     const linksMatch = responseText.match(linksPattern);

//     if (nodesMatch && linksMatch)
//     {
//         // Parse the JSON-like structure found in the response
//         const nodes = eval('[' + nodesMatch[1] + ']');
//         const links = eval('[' + linksMatch[1] + ']');

//         return { nodes, links };
//     }

//     // If we couldn't find a match, return null
//     return null;
// }

router.post("/generate-fdr-data", async (req, res) =>
{
    const ideas_list = req.body.ideas;
    console.log(ideas_list);

    const prompt = `given an array of ideas, generate a data for the force-directed graph that relate these ideas.   Ideas: [${ideas_list}]. Sample output:  
       const nodes = [
        { id: 1, label: "idea 1", info: "This is idea 1's info." },
        { id: 2, label: "idea 2", info: "This is idea 2's info." },
        { id: 3, label: "idea 3", info: "This is idea 3's info." },
    ];

    const links = [
        { source: 1, target: 2 },
        { source: 1, target: 3 },
        { source: 2, target: 4 },
    ];`;

    // console.log(prompt);
    // const result = await model.generateContent(prompt);
    // console.log(result.response.text());


    var nodes = [
        { id: 1, label: "Node 1", info: "This is Node 1's info." },
        { id: 2, label: "Node 2", info: "This is Node 2's info." },
        { id: 3, label: "Node 3", info: "This is Node 3's info." },
        { id: 4, label: "Node 4", info: "This is Node 4's info." },
        { id: 5, label: "Node 5", info: "This is Node 5's info." },
    ];

    var links = [
        { source: 1, target: 2 },
        { source: 1, target: 3 },
        { source: 2, target: 4 },
        { source: 3, target: 5 },
        { source: 4, target: 5 },
    ];

    const data = { nodes: nodes, links: links };
    res.json(data);


});


// router.get('/highlight', (req, res) =>
// {
//     res.render('highlight');
// });

// router.get('/load-wiki', async (req, res) =>
// {
//     const article = req.query.article || 'Node.js';
//     const wikipediaUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(article)}`;

//     try
//     {
//         const response = await axios.get(wikipediaUrl);
//         const data = response.data;
//         res.render('wiki', { articleData: data });
//     } catch (error)
//     {
//         res.render('wiki', { articleData: null });
//     }
// });


// router.get('/article', (req, res) =>
// {
//     res.render('brainstorm2/article');
// })

// router.get('/wiki', (req, res) =>
// {
//     res.render('brainstorm2/wiki', { articleData: null });
// });


// router.get('/brainstorm2', (req, res) =>
// {
//     res.render('brainstorm2/brainstorm-from-text');
// });


module.exports = router;
