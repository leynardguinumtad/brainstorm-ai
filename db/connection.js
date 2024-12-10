const mysql2 = require('mysql2');

const con = mysql2.createConnection({
    host: "localhost",
    database: "brainstorm_ai_db",
    password: "",
    user: "root",
});


con.connect((err) =>
{
    if (err)
    {
        console.log(err);

    }
    else
    {
        console.log("db connected");
    }
});

module.exports = con;