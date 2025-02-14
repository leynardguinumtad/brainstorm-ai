const path = require('path');
const express = require('express');
const con = require("../db/connection");

const router = express.Router();

router.get("/", (req, res) =>
{
    res.render("admin/login");
})


router.post("/", (req, res) =>
{
    const { username, password } = req.body;

    const sql = "SELECT * FROM admins WHERE username = ? AND password = ?";
    con.query(sql, [username, password], (err, result) =>
    {
        if (err)
        {
            res.status(500).send("error");

        }
        else
        {
            if (result.length == 0)
            {
                console.log("not found");
                req.flash("error", "Account not found");
                res.redirect("/admin/");
            }
            else
            {
                req.session.admin_user_id = result[0].id;
                console.log(req.session.admin_user_id);
                req.flash("success", "Login Successful");
                res.redirect("/admin/home");
            }
        }
    });
});



router.get("/home", (req, res) =>
{
    const sql2 = "SELECT * FROM users";
    con.query(sql2, (err, result) =>
    {
        res.render("admin/home", { users: result });
    });
});


router.get("/delete/:id", (req, res) =>
{
    const id = req.params.id;
    const sql = "DELETE FROM users WHERE id = ?";
    con.query(sql, [id], (err, result) =>
    {
        if (err)
        {
            res.status(500).send("error");
        }
        else
        {
            res.redirect("/admin/home");
        }
    });
});


router.get("/logout", (req, res) =>
{
    req.session.destroy((err) =>
    {
        if (err)
        {
            console.error(err);
            res.redirect("/auth/login");

        }
        else
        {
            console.log("session destroyed");
            res.redirect("/admin/");

        }
    })
});




module.exports = router;



