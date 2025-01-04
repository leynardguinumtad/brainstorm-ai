const path = require("path");
const axios = require("axios");
const express = require("express");
const crypto = require('crypto');
require("dotenv").config();
const PDFDocument = require('pdfkit');

const { GoogleGenerativeAI, SchemaType } = require("@google/generative-ai");
const { render } = require("ejs");
const { log } = require("console");
const con = require("../db/connection");
const router = express.Router();

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

const schema = {
    description:
        "Nodes and links for a force-directed graph extracted from an array of ideas",
    type: SchemaType.OBJECT,
    properties: {
        nodes: {
            type: SchemaType.ARRAY,
            description: "List of nodes representing ideas from the image",
            items: {
                type: SchemaType.OBJECT,
                properties: {
                    id: { type: SchemaType.INTEGER, description: "Unique node ID" },
                    label: { type: SchemaType.STRING, description: "Label for the node" },
                    info: { type: SchemaType.STRING, description: "Additional information about the node" }
                },
                required: ["id", "label", "info"]
            },
        },
        links: {
            type: SchemaType.ARRAY,
            description: "List of links between nodes",
            items: {
                type: SchemaType.OBJECT,
                properties: {
                    source: { type: SchemaType.INTEGER, description: "Source node ID" },
                    target: { type: SchemaType.INTEGER, description: "Target node ID" }
                },
                required: ["source", "target"]
            },
        }
    },
    required: ["nodes", "links"],
};
const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: {
        responseMimeType: "application/json",
        responseSchema: schema,
    },
});

//this model object is used to generate a text response that relates ideas. 
//This is because the first model generate a response in a json format that is not suitable for the user interface
const model2 = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
});

function processGraphData(responseText)
{
    try
    {
        const responseData = JSON.parse(responseText);
        const nodes = responseData.nodes || [];
        const links = responseData.links || [];

        return { nodes: nodes, links: links };

    }
    catch (error)
    {
        console.error(error);
        return { nodes: [], links: [] };
    }
}

router.get("/lab/:lab_id", (req, res) =>
{
    const lab_id = req.params.lab_id;

    res.render("brainstorm2/lab", { lab_id: lab_id, name: req.session.name });
});

router.post("/generate-fdg-data", async (req, res) =>
{
    try
    {
        const ideas_list = req.body.ideas;
        const brainstormFocus = req.body.brainstormFocus;
        console.log(ideas_list);

        const prompt = `Brainstorm using the given array of ideas. Extract nodes and links for a force-directed graph from the following array of ideas: [${ideas_list.join(", ")}]. add links to relate these ideas. ${brainstormFocus}`;

        // const prompt = `Given the following array of ideas: [${ideas_list.join(", ")}], brainstorm their relationships and interconnectedness. 
        //                 Identify key nodes representing each idea and determine meaningful links between them to illustrate their connections in a force-directed graph. 
        //                 Extract essential information for each node, such as unique IDs, labels, and additional context, and define clear links specifying source and target node IDs to represent their relationships.`;

        const result = await model.generateContent(prompt);
        const { nodes, links } = processGraphData(result.response.text());

        res.json({ nodes, links });
    }
    catch (err)
    {
        console.error(err);
        res.json({ nodes: [], links: [] });

    }
});


router.get("/create-lab", (req, res) =>
{
    const user_id = req.session.user_id;
    const lab_name = `brainstorm_lab_${crypto.randomInt(100, 10000)}`;


    const sql = "INSERT INTO brainstorm2s (user_id, lab_name) VALUES (?, ?)";

    con.query(sql, [user_id, lab_name], (err, result) =>
    {
        if (err)
        {
            res.send(err);
        }
        else
        {
            const lab_id = result.insertId;
            res.redirect(`/brainstorm2/lab/${lab_id}`);

        }
    })
});

router.post("/save-note", (req, res) =>
{
    const { lab_id, htmlContent } = req.body;

    const sql = "UPDATE brainstorm2s SET note = ? WHERE id = ?";
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


const streamData = {};
router.post('/start-stream', express.json(), (req, res) =>
{
    const sessionId = req.body.sessionId || 'default';
    streamData[sessionId] = {
        ideas: req.body.ideas || [],
        brainstormFocus: req.body.brainstormFocus || 'look for relationship',
    };

    res.status(200).send('Stream initialized.');
});

router.get('/llm-stream', async (req, res) =>
{
    const sessionId = req.query.sessionId || 'default';
    const { ideas, brainstormFocus } = streamData[sessionId] || { ideas: [], brainstormFocus: 'look for relationship' };

    console.log("ideas", ideas);
    console.log("focus", brainstormFocus);

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try
    {
        const prompt = `relate the following: ${ideas}. ${brainstormFocus}`;
        console.log(prompt);

        //using the second model to generate a text response
        const result = await model2.generateContentStream(prompt);

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


router.post('/save_nodes_ideas_links_brainstormFocus_ai_text', (req, res) =>
{
    const { lab_id, nodes, links, ideas, brainstormFocus, ai_text } = req.body;

    console.log("lab id is", lab_id);
    console.log("nodes ", nodes);
    console.log("ideas ", ideas);
    console.log("links ", links);
    console.log("ai_text ", ai_text);
    console.log("brainstormFocus ", brainstormFocus);

    const sql = "UPDATE brainstorm2s SET nodes = ?, links = ?, ideas = ?, brainstormFocus = ?,  ai_text = ? WHERE id = ?";
    con.query(sql, [JSON.stringify(nodes), JSON.stringify(links), JSON.stringify(ideas), brainstormFocus, ai_text, lab_id], (err, result) =>
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


router.get("/load-history/:lab_id", (req, res) =>
{
    const lab_id = req.params.lab_id;

    const sql = "SELECT * FROM brainstorm2s WHERE id = ?";
    con.query(sql, [lab_id], (err, result) =>
    {
        if (err)
        {
            res.status(500).send(err);
        }
        else
        {

            const data = {
                note: result[0].note,
                nodes: JSON.parse(result[0].nodes),
                links: JSON.parse(result[0].links),
                ideas: JSON.parse(result[0].ideas),
                ai_text: result[0].ai_text,
                brainstormFocus: result[0].brainstormFocus,
            };

            res.json(data);
        }
    });
});

router.get("/delete/:lab_id", (req, res) =>
{
    const lab_id = req.params.lab_id;
    const sql = "DELETE FROM brainstorm2s WHERE id = ?";
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

router.get('/download-pdf/:lab_id', (req, res) =>
{
    const lab_id = req.params.lab_id;

    // Query the database for the lab project data
    const sql = "SELECT * FROM brainstorm2s WHERE id = ?";
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
                ai_text: result[0].ai_text,
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
            // doc.fontSize(12).fillColor('black').text('Extracted Texts:', { underline: true });
            // project.text_array.forEach((text, index) =>
            // {
            //     doc.fontSize(10).fillColor('black').text(`${index + 1}. ${text}`);
            // });

            // Finalize the PDF and send it to the client
            doc.end();
        }
    });
});

module.exports = router;
