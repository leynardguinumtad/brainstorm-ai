
app.get('/highlight', (req, res) =>
{
    res.render('highlight');
});

app.get('/load-wiki', async (req, res) =>
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


app.get('/article', (req, res) =>
{
    res.render('article');
})

app.get('/wiki', (req, res) =>
{
    res.render('wiki', { articleData: null });
});


app.get('/brainstorm2', (req, res) =>
{
    res.render('brainstorm-from-text');
});
