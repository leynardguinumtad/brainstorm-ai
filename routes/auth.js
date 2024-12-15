const path = require("path");
const axios = require("axios");
const express = require('express');
const con = require("../db/connection")

const router = express.Router();

router.get("/login", (req, res) =>
{
    res.render("auth/login");
});

router.post("/login", (req, res) =>
{
    const { email, password } = req.body;

    const sql = "SELECT * FROM users WHERE email = ? AND password = ?";
    con.query(sql, [email, password], (err, result) =>
    {
        if (err)
        {
            res.status(500).send("error");
        }
        else
        {
            if (!result)
            {
                req.session.user_id = result[0].id;
                console.log(`user id: ${req.session.user_id}`);
                req.flash("success", "Login Successful");
                res.redirect("/home");
            }
            else
            {
                req.flash("error", "Account not found");
                console.log("not found");
                res.redirect("/auth/login");
            }
        }
    });
});

router.get("/register", (req, res) =>
{
    res.render("auth/register");
});

router.post("/register", (req, res) =>
{
    const { fname, lname, email, password, confirm_password } = req.body;
    const name = fname + " " + lname;

    const sql = "INSERT INTO users (name, email, password) VALUES (?, ?, ?)";
    con.query(sql, [name, email, password], (err, result) =>
    {
        if (err)
        {
            req.flash("error", err);
            res.redirect("/auth/register");
        } else
        {
            console.log(`id: ${result.insertId}`);
            //save the id in the session
            req.session["user_id"] = result.insertId;
            req.flash("success", "Account created successfully");
            res.redirect("/home");
        }
    });


});


module.exports = router;