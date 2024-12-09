app.get('/ask', (req, res) =>
{
    res.render('test/ask');
});




app.get('/try', (req, res) =>
{
    res.render('test/try');
});

app.get('/llm', async (req, res) =>
{
    const prompt = "Write a story about a magic backpack.";

    const result = await model.generateContentStream(prompt);

    // Print text as it comes in.
    for await (const chunk of result.stream)
    {
        const chunkText = chunk.text();
        process.stdout.write(chunkText);
    }
});