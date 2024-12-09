const path = require("path");
const axios = require("axios");
const express = require('express');
const router = express.Router();

router.get("/login", (req, res) =>
{
    res.render("auth/login");
});

router.get("", (req, res) =>
{
    res.render("auth/register");
});


module.exports = router;