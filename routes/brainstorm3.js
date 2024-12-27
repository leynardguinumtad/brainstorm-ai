// const path = require('path');
// const axios = require('axios');
// const express = require('express');
// const multer = require('multer');
// const fs = require('fs');
// const { GoogleGenerativeAI } = require("@google/generative-ai");
// const { render } = require("ejs");
// const { log } = require("console");
// const genAI = new GoogleGenerativeAI("AIzaSyAd78ny7jD23ZLIXbuPH41TRRiscLFItOU");
// const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// // Set up middleware and configurations
// const router = express.Router();

// const storage = multer.diskStorage({
//     destination: (req, file, cb) =>
//     {
//         cb(null, 'uploads/');
//     },
//     filename: (req, file, cb) =>
//     {
//         cb(null, file.originalname + path.extname(file.originalname));
//     }
// });
// const upload = multer({ storage: storage });

// function fileToGenerativePart(filePath, mimeType)
// {
//     return {
//         inlineData: {
//             data: fs.readFileSync(filePath).toString("base64"),
//             mimeType,
//         },
//     };
// }

// router.get('/lab', (req, res) =>
// {
//     res.render("brainstorm3/lab");
// });


// router.post("/upload", upload.single('image'), async (req, res) =>
// {
//     try
//     {
//         const filePath = req.file.path; // Path to the uploaded file
//         const mimeType = req.file.mimetype; // Mime type of the uploaded file

//         const prompt = `
//             Analyze the image and brainstorm ideas that can be extracted from it.
//             Provide the response strictly in the following JSON format:
//             {
//                 "main_idea": "A brief summary of the main theme of the image",
//                 "key_elements": ["List", "of", "important", "objects", "or", "elements"],
//                 "creative_ideas": ["Idea 1", "Idea 2", "Idea 3"]
//             }
//         `;

//         const imagePart = fileToGenerativePart(filePath, mimeType);

//         // Generate content with structured JSON output
//         const result = await model.generateContent([prompt, imagePart]);

//         // Parse and validate JSON response
//         let jsonResponse;
//         try
//         {
//             jsonResponse = JSON.parse(result.response.text());
//         } catch (parseError)
//         {
//             console.error('Failed to parse JSON response from model:', parseError);
//             throw new Error('Model did not return a valid JSON response');
//         }

//         // Log and respond with the structured JSON result
//         console.log(jsonResponse);
//         res.json(jsonResponse);
//     } catch (error)
//     {
//         console.error('Error generating JSON from image:', error);
//         res.status(500).send('An error occurred while processing the image.');
//     } finally
//     {
//         // Clean up the uploaded file
//         if (req.file && req.file.path)
//         {
//             fs.unlinkSync(req.file.path);
//         }
//     }
// });


// module.exports = router;


const path = require('path');
const fs = require('fs'); // For file operations
const express = require('express');
const multer = require('multer'); // For file uploads
const { GoogleGenerativeAI, SchemaType } = require('@google/generative-ai');

const router = express.Router();

// Initialize Google Generative AI with API key
const genAI = new GoogleGenerativeAI(process.env.API_KEY || "AIzaSyAd78ny7jD23ZLIXbuPH41TRRiscLFItOU");

// Define a schema for structured JSON response
const schema = {
    description: "Brainstormed ideas extracted from an image",
    type: SchemaType.OBJECT,
    properties: {
        description: {
            type: SchemaType.STRING,
            description: "A description of the image content",
            nullable: false,
        },
        ideas: {
            type: SchemaType.ARRAY,
            description: "List of brainstormed ideas from the image",
            items: {
                type: SchemaType.STRING,
            },
            nullable: true,
        },
    },
    required: ["description"],
};

// Configure the model with schema and response configuration
const model = genAI.getGenerativeModel({
    model: "gemini-1.5-pro",
    generationConfig: {
        responseMimeType: "application/json",
        responseSchema: schema,
    },
});

// Configure Multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) =>
    {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) =>
    {
        cb(null, file.originalname + path.extname(file.originalname));
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

// Route to render the upload page
router.get('/lab', (req, res) =>
{
    res.render('brainstorm3/lab');
});

// Route to handle image upload and processing
router.post('/upload', upload.single('image'), async (req, res) =>
{
    try
    {
        const filePath = req.file.path; // Path to the uploaded file
        const mimeType = req.file.mimetype; // Mime type of the uploaded file

        const prompt = "Brainstorm ideas that can be extracted from the image";
        const imagePart = fileToGenerativePart(filePath, mimeType);

        // Generate content with schema enforcement
        const result = await model.generateContent([prompt, imagePart]);

        // Log the JSON response
        console.log('Structured Response:', result.response.text());

        // Send the JSON response back to the client
        res.json(JSON.parse(result.response.text()));
    } catch (error)
    {
        console.error('Error generating structured JSON from image:', error);
        res.status(500).send('An error occurred while processing the image.');
    } finally
    {
        // Clean up the uploaded file
        if (req.file && req.file.path)
        {
            fs.unlinkSync(req.file.path);
        }
    }
});

module.exports = router;
