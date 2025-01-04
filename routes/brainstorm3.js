const path = require('path');
const fs = require('fs'); // For file operations
const express = require('express');
const multer = require('multer'); // For file uploads
const { GoogleGenerativeAI, SchemaType } = require('@google/generative-ai');
const crypto = require('crypto');
const con = require("../db/connection");
const router = express.Router();

// Initialize Google Generative AI with API key
const genAI = new GoogleGenerativeAI(process.env.API_KEY || "AIzaSyD_q8OD37k1Y5dpMLcouaxQR7eyxZagSbk");

// Define a schema for structured JSON response tailored for force-directed graphs
const schema = {
    description: "Nodes and links for a force-directed graph extracted from an image",
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

// Configure the model with schema and response configuration
const model = genAI.getGenerativeModel({
    model: "gemini-1.5-pro",
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

const uploadDir = path.join(__dirname, "..", "uploads");
//create /uploads directory if not exist
if (!fs.existsSync(uploadDir))
{
    console.log("Creating uploads directory");

    fs.mkdirSync(uploadDir);
}

// Configure Multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) =>
    {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) =>
    {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Helper function to convert image file to Generative AI compatible format
function fileToGenerativePart(filePath, mimeType)
{
    return {
        inlineData: {
            data: fs.readFileSync(filePath).toString("base64"),
            mimeType,
        },
    };
}

// Function to process API response and extract nodes and links
function processGraphData(responseText)
{
    try
    {
        const responseData = JSON.parse(responseText);
        const nodes = responseData.nodes || [];
        const links = responseData.links || [];

        console.log('Extracted Nodes:', nodes);
        console.log('Extracted Links:', links);

        return { nodes, links };
    } catch (error)
    {
        console.error('Error processing graph data:', error);
        return { nodes: [], links: [] };
    }
}

router.get("/create-lab", (req, res) =>
{
    const user_id = req.session.user_id;
    const lab_name = `brainstorm_lab_${crypto.randomInt(100, 10000)}`;

    const sql = "INSERT INTO brainstorm3s (user_id, lab_name) VALUES (?, ?)";

    con.query(sql, [user_id, lab_name], (err, result) =>
    {
        if (err)
        {
            res.send(err);
        }
        else
        {
            const lab_id = result.insertId;
            res.redirect(`/brainstorm3/lab/${lab_id}`);
        }
    });
})

// Route to render the upload page
router.get('/lab/:lab_id', (req, res) =>
{
    const lab_id = req.params.lab_id;
    res.render('brainstorm3/lab', { lab_id: lab_id, name: req.session.name });
});

// Route to handle image upload and processing
router.post('/generate-fdg-data', upload.single('image'), async (req, res) =>
{
    try
    {
        const brainstormFocus = req.body.brainstormFocus;
        const lab_id = req.body.lab_id;

        console.log(brainstormFocus);
        console.log(lab_id);

        const filePath = req.file.path; // Path to the uploaded file
        const filename = req.file.filename; // Name of the uploaded file
        console.log(filename);

        const mimeType = req.file.mimetype; // Mime type of the uploaded file

        const prompt = `Extract nodes and links for a force-directed graph from the image. ${brainstormFocus} `;
        const imagePart = fileToGenerativePart(filePath, mimeType);

        // Generate content with schema enforcement
        const result = await model.generateContent([prompt, imagePart]);

        // Extract nodes and links from structured JSON response
        const { nodes, links } = processGraphData(result.response.text());

        //save the brainstormFocus and image_path to the database
        const sql = "UPDATE brainstorm3s SET brainstormFocus = ?, image = ? WHERE id = ?";

        const result_update = con.execute(sql, [brainstormFocus, filename, lab_id], (err, result) =>
        {
            if (err)
            {
                console.error(err);
                res.status(500).send("error");
            }

        });


        // var nodes = [
        //     { id: 1, label: "Node 1", info: "This is Node 1's info." },
        //     { id: 2, label: "Node 2", info: "This is Node 2's info." },
        //     { id: 3, label: "Node 3", info: "This is Node 3's info." },
        //     { id: 4, label: "Node 4", info: "This is Node 4's info." },
        // ];

        // var links = [
        //     { source: 1, target: 2 },
        //     { source: 1, target: 3 },
        //     { source: 2, target: 4 },
        //     { source: 3, target: 4 },
        // ];



        // Respond with structured graph data
        res.json({ nodes, links });
    } catch (error)
    {
        console.error('Error generating structured graph data from image:', error);
        res.status(500).send('An error occurred while processing the image.');
    } finally
    {

    }
});



const streamData = {};

router.post("/start-stream", express.json(), (req, res) =>
{
    const sessionId = req.body.sessionId || "default-session";
    streamData[sessionId] = {
        ideas: req.body.ideas || [],
        brainstormFocus: req.body.brainstormFocus || ""
    };

    console.log("ideas", streamData[sessionId].ideas);
    console.log("brainstormFocus", streamData[sessionId].brainstormFocus);

    if (!streamData[sessionId].ideas.length)
    {
        return res.status(400).send("No ideas list provided.");
    }
    res.status(200).send("Stream initialized.");
});

router.get("/llm-stream", async (req, res) =>
{
    const sessionId = req.query.sessionId || "default-session";
    const sessionData = streamData[sessionId];

    if (!sessionData || !sessionData.ideas.length || !sessionData.brainstormFocus)
    {
        return res.status(400).send("No initialized session data found.");
    }

    const prompt = `relate the following: [${sessionData.ideas}]. ${sessionData.brainstormFocus}`;
    console.log("prompt", prompt);

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    try
    {
        const result = await model2.generateContentStream(prompt);
        for await (const chunk of result.stream)
        {
            const chunkText = chunk.text();
            res.write(`data: ${chunkText}\n\n`);
        }
        res.end();
    } catch (error)
    {
        console.error("Error during streaming:", error);
        res.write(`data: Error: ${error.message}\n\n`);
        res.end();
    }
});


router.get("/load-image/:lab_id", (req, res) =>
{
    const lab_id = req.params.lab_id;

    const sql = "SELECT * FROM brainstorm3s WHERE id = ?";
    con.query(sql, [lab_id], (err, result) =>
    {
        if (err)
        {
            res.send(err);
        }
        else
        {
            console.log(result);
            res.json({ image: result[0].image });
        }
    })
});

router.get("/images/:filename", (req, res) =>
{
    const uploadsFolder = path.join(__dirname, "..", "uploads"); // Path to your uploads folder
    const fileName = req.params.filename; // Extract file name from the request

    const filePath = path.join(uploadsFolder, fileName);

    res.sendFile(filePath, (err) =>
    {
        if (err)
        {
            console.error(err);
            res.status(404).send('Image not found');
        }
    });
});


router.post("/save-nodes-links-brainstormFocus-ai-text", (req, res) =>
{
    const { nodes, links, brainstormFocus, ai_text, lab_id } = req.body;

    const sql = "UPDATE brainstorm3s SET nodes = ?, links = ?, brainstormFocus = ?, ai_text = ? WHERE id = ?";
    con.query(sql, [JSON.stringify(nodes), JSON.stringify(links), brainstormFocus, ai_text, lab_id], (err, result) =>
    {
        if (err)
        {
            res.status(500).send(err);
        }
        else
        {
            res.status(200).send("updated successfully");
        }
    });
});


router.get("/load-history/:lab_id", (req, res) =>
{
    const lab_id = req.params.lab_id;

    const sql = "SELECT * FROM brainstorm3s WHERE id = ?";
    con.query(sql, [lab_id], (err, result) =>
    {
        if (err)
        {
            res.send(err);
        }
        else
        {
            // res.json(result[0]);
            res.send(result[0]);
        }
    })
});
module.exports = router;
