const path = require("path");
const axios = require("axios");
const express = require('express');
const router = express.Router();
const con = require("../db/connection");



const { GoogleGenerativeAI } = require("@google/generative-ai");
const { render } = require("ejs");
const { log } = require("console");

const genAI = new GoogleGenerativeAI("AIzaSyAd78ny7jD23ZLIXbuPH41TRRiscLFItOU");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
// Set up middleware and configurations


router.post("/save-pageids-rtext-ttext", (req, res) =>
{
    const { lab_id, pageids, texts_list, transformedText } = req.body;

    const textjson = JSON.stringify(texts_list);
    const sql = "UPDATE brainstorm1s SET pageids = ?, extractedTexts = ?, transformedText = ? WHERE id = ?";
    con.query(sql, [pageids, textjson, transformedText, lab_id], (err, result) =>
    {
        if (err)
            res.send(err);
        else
        {
            res.send("successfully saved");
        }
    });

})

router.post("/save-note", (req, res) =>
{
    const { lab_id, htmlContent } = req.body;

    console.log("lab id is", lab_id);
    console.log("htmlcontent ", htmlContent);

    const sql = "UPDATE brainstorm1s SET note = ? WHERE id = ?";
    con.query(sql, [htmlContent, lab_id], (err, result) =>
    {
        if (err)
        {
            console.error(err);
            res.status(500).send("error");
        }
        else
        {
            res.send("saved successfully");
        }
    });
});


router.get("/create-lab/:pageId", (req, res) =>
{
    const pageId = req.params.pageId;
    const user_id = req.session.user_id;

    const sql = "INSERT INTO brainstorm1s (user_id, pageids) VALUES (?, ?)";
    con.query(sql, [user_id, pageId], (err, result) =>
    {
        if (err)
        {
            res.send(err);
        }
        else
        {
            const lab_id = result.insertId;
            res.redirect(`/brainstorm1/lab/${lab_id}?pageids=${pageId}`);
        }
    });
});

router.get("/lab/:lab_id", (req, res) =>
{
    const lab_id = req.params.lab_id;
    res.render("brainstorm1/lab", { lab_id: lab_id });
});

router.get("/search", (req, res) =>
{
    res.render("brainstorm1/search");
});


let list_selected_texts = [];
router.post('/start-stream', express.json(), (req, res) =>
{
    list_selected_texts = req.body.list_selected_texts || [];
    console.log(list_selected_texts);

    if (!list_selected_texts.length)
    {
        return res.status(400).send('No list_selected_texts provided.');
    }
    res.status(200).send('Stream initialized.');
});

router.get('/llm-stream', async (req, res) =>
{
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try
    {
        const prompt = `relate the following texts: ${list_selected_texts}.`;
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


module.exports = router;
