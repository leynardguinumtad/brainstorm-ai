const path = require("path");
const axios = require("axios");
const crypto = require('crypto');
const express = require('express');
const PDFDocument = require('pdfkit');
const router = express.Router();
const con = require("../db/connection");

const { GoogleGenerativeAI } = require("@google/generative-ai");
const { render } = require("ejs");
const { log } = require("console");

const genAI = new GoogleGenerativeAI("AIzaSyAd78ny7jD23ZLIXbuPH41TRRiscLFItOU");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
// Set up middleware and configurations

// Route for generating and downloading the PDF
router.get('/download-pdf/:lab_id', (req, res) =>
{
    const lab_id = req.params.lab_id;
    // Here you would fetch the project data based on `id` from the database or pass mock data
    const project = {
        lab_name: 'Lab Project 1',
        transformedText: 'Detailed content of the project that will be included in the PDF.',
        created_at: '2024-12-01'
    };

    // Create a new PDF document
    const doc = new PDFDocument();

    // Set the response headers to force download of the PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=project-${lab_id}.pdf`);

    // Pipe the PDF document to the response
    doc.pipe(res);

    // Add content to the PDF document
    doc.fontSize(18).text(`Project: ${project.lab_name}`, { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Description: ${project.transformedText}`);
    doc.moveDown();
    doc.fontSize(10).text(`Created on: ${project.created_at}`);

    // Finalize the PDF and send it to the client
    doc.end();
});


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
});

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


router.get("/create-lab/:pageId/:title", (req, res) =>
{
    const pageId = req.params.pageId;
    const title = req.params.title;
    const user_id = req.session.user_id;
    const lab_name = `${title}-${crypto.randomInt(100, 1000)}`;

    const sql = "INSERT INTO brainstorm1s (user_id, pageids, lab_name) VALUES (?, ?, ?)";
    con.query(sql, [user_id, pageId, lab_name], (err, result) =>
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

    const sql = "SELECT * FROM brainstorm1s WHERE id = ?";
    con.query(sql, [lab_id], (err, result) =>
    {
        if (err)
        {
            res.send(err);
        }
        else
        {
            // const history_data = {
            //     note: result[0].note,
            //     extractedTexts: result[0].extractedTexts ? JSON.parse(result[0].extractedTexts) : [],
            //     transformedText: result[0].transformedText,
            // }
            const history_data = {
                note: result[0].note,
                extractedTexts: result[0].extractedTexts,
                transformedText: result[0].transformedText,
            }


            console.log


            res.render("brainstorm1/lab", { lab_id: lab_id, history_data: history_data });
        }
    });
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
