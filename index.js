const express = require("express");
const path = require("path");
const axios = require("axios");
const app = express();

const homeRouter = require("./routes/home");
const brainstorm1Router = require("./routes/brainstorm1");

// Set up middleware and configurations
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));

//Routes
app.use("/home", homeRouter);
app.use("/brainstorm1", brainstorm1Router);

// Step 5: Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
{
    console.log(`Server is running on http://localhost:${PORT}`);
});
