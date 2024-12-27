const path = require("path");
const axios = require("axios");
const express = require("express");

const { GoogleGenerativeAI, SchemaType } = require("@google/generative-ai");
const { render } = require("ejs");
const { log } = require("console");
const router = express.Router();

const genAI = new GoogleGenerativeAI("AIzaSyAd78ny7jD23ZLIXbuPH41TRRiscLFItOU");

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

router.get("/lab", (req, res) =>
{
    res.render("brainstorm2/lab");
});

router.post("/generate-fdr-data", async (req, res) =>
{
    const ideas_list = req.body.ideas;
    console.log(ideas_list);

    const prompt = `Brainstorm using the given array of ideas. Extract nodes and links for a force-directed graph from the following array of ideas: [${ideas_list.join(", ")}]. add links to relate these ideas`;

    // const prompt = `Given the following array of ideas: [${ideas_list.join(", ")}], brainstorm their relationships and interconnectedness. 
    //                 Identify key nodes representing each idea and determine meaningful links between them to illustrate their connections in a force-directed graph. 
    //                 Extract essential information for each node, such as unique IDs, labels, and additional context, and define clear links specifying source and target node IDs to represent their relationships.`;

    const result = await model.generateContent(prompt);
    const { nodes, links } = processGraphData(result.response.text());

    res.json({ nodes, links });
});

module.exports = router;
