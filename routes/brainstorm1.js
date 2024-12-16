const path = require("path");
const axios = require("axios");
const crypto = require('crypto');
const express = require('express');
const PDFDocument = require('pdfkit');
const htmlToText = require('html-to-text');
const router = express.Router();
const con = require("../db/connection");

const { GoogleGenerativeAI } = require("@google/generative-ai");
const { render } = require("ejs");
const { log } = require("console");

const genAI = new GoogleGenerativeAI("AIzaSyAd78ny7jD23ZLIXbuPH41TRRiscLFItOU");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
// Set up middleware and configurations

// Route for generating and downloading the PDF
// router.get('/download-pdf/:lab_id', (req, res) =>
// {
//     const lab_id = req.params.lab_id;

//     // Query the database for the lab project data
//     const sql = "SELECT * FROM brainstorm1s WHERE id = ?";
//     con.query(sql, [lab_id], (err, result) =>
//     {
//         if (err)
//         {
//             res.status(500).send(err);
//         } else
//         {
//             const project = {
//                 lab_name: result[0].lab_name,
//                 created_at: result[0].created_at,
//                 text_array: JSON.parse(result[0].extractedTexts), // Text array from the DB
//                 ai_text: result[0].transformedText, // AI-generated text (HTML)
//             };

//             // Create a new PDF document
//             const doc = new PDFDocument();

//             // Set the response headers to force the download of the PDF
//             res.setHeader('Content-Type', 'application/pdf');
//             res.setHeader('Content-Disposition', `attachment; filename=project-${lab_id}.pdf`);

//             // Pipe the PDF document to the response
//             doc.pipe(res);

//             // Add header for the website
//             doc.fontSize(18).text('Brainstorm AI', { align: 'center' });
//             doc.moveDown(1); // Adding space after the header

//             // Add the lab name and creation date
//             doc.fontSize(16).text(`Lab Name: ${project.lab_name}`, { align: 'center' });
//             doc.fontSize(12).text(`Date Created: ${project.created_at}`, { align: 'center' });
//             doc.moveDown(2); // Adding space before the content


//             doc.fontSize(12).text('AI Generated Text:', { underline: true });
//             doc.fontSize(10).text(project.ai_text);
//             doc.moveDown(2); // Adding space before the next section

//             // Add extracted texts from text_array as a list
//             doc.fontSize(12).text('Extracted Texts:', { underline: true });
//             project.text_array.forEach((text, index) =>
//             {
//                 doc.fontSize(10).text(`${index + 1}. ${text}`);
//             });

//             // Finalize the PDF and send it to the client
//             doc.end();
//         }
//     });
// });

// Route for generating and downloading the PDF
router.get('/download-pdf/:lab_id', (req, res) =>
{
    const lab_id = req.params.lab_id;

    // Query the database for the lab project data
    const sql = "SELECT * FROM brainstorm1s WHERE id = ?";
    con.query(sql, [lab_id], (err, result) =>
    {
        if (err)
        {
            res.status(500).send(err);
        } else
        {
            const project = {
                lab_name: result[0].lab_name,
                created_at: result[0].created_at,
                text_array: JSON.parse(result[0].extractedTexts), // Text array from the DB
                ai_text: result[0].transformedText, // AI-generated text (HTML)
            };

            // Create a new PDF document
            const doc = new PDFDocument();

            // Set the response headers to force the download of the PDF
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=project-${lab_id}.pdf`);

            // Pipe the PDF document to the response
            doc.pipe(res);

            // Add blue background to the entire page
            doc.rect(0, 0, 612, 200).fill('#1E40AF'); // Filling the page with a blue color

            // Add the logo image
            const logoPath = path.join(__dirname, '..', 'public', 'img', 'logo-bsai-final.png'); // Assuming logo is stored in the 'public' directory
            doc.image(logoPath, { width: 75, align: 'center' }); // Add logo with a fixed width of 100px
            doc.moveDown(2); // Move down a bit after the logo

            // Add header for the website
            doc.fontSize(18).fillColor('white').text('Brainstorm AI', { align: 'center' });
            doc.moveDown(1); // Adding space after the header

            // Add the lab name and creation date in white color
            doc.fontSize(16).fillColor('white').text(`Lab Name: ${project.lab_name}`, { align: 'center' });
            doc.fontSize(12).fillColor('white').text(`Date Created: ${project.created_at}`, { align: 'center' });
            doc.moveDown(2); // Adding space before the content


            doc.fontSize(12).fillColor('black').text('AI Generated Text:', { underline: true });
            doc.fontSize(10).fillColor('black').text(project.ai_text);
            doc.moveDown(2); // Adding space before the next section

            // Add extracted texts from text_array as a list
            doc.fontSize(12).fillColor('black').text('Extracted Texts:', { underline: true });
            project.text_array.forEach((text, index) =>
            {
                doc.fontSize(10).fillColor('black').text(`${index + 1}. ${text}`);
            });

            // Finalize the PDF and send it to the client
            doc.end();
        }
    });
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


            res.render("brainstorm1/lab", { lab_id: lab_id, history_data: history_data, name: req.session.name });
        }
    });
});

router.get("/search", (req, res) =>
{
    res.render("brainstorm1/search", { name: req.session.name });
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


router.get("/delete/:lab_id", (req, res) =>
{
    const lab_id = req.params.lab_id;
    const sql = "DELETE FROM brainstorm1s WHERE id = ?";
    con.query(sql, [lab_id], (err, results) =>
    {
        if (err)
        {
            res.status(500).send(err);
        }
        else
        {
            res.redirect("/manage");
        }
    });
});


module.exports = router;
