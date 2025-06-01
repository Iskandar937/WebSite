const express = require("express");
const fs = require("fs");
const path = require("path");
const router = express.Router();

const usersFile = path.join(__dirname, "../data/users.json");

router.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../public/profile.html"));
});

router.post("/", (req, res) => {
    const { name, email, password, birthdate } = req.body;

    const users = JSON.parse(fs.readFileSync(usersFile, "utf8"));

    const userIndex = users.findIndex(u => u.email === email);

    if (userIndex !== -1) {
        users[userIndex] = { name, email, password, birthdate };
        fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
        res.send("<h2>Ma'lumotlar yangilandi. <a href='/profile'>Ortga qaytish</a></h2>");
    } else {
        res.send("<h2>Bunday email topilmadi. <a href='/profile'>Ortga qaytish</a></h2>");
    }
});

module.exports = router;
