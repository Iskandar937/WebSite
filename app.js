const express = require("express")
const cors = require("cors")
const fs = require("fs")
const path = require("path")
const session = require("express-session")

const app = express()
const PORT = 3000


app.use(
    cors({
        origin: "http://localhost:3000",
        credentials: true,
        allowedHeaders: ["Content-Type", "Email", "Password"],
    }),
)

app.use(
    session({
        secret: "uzun_va_xavfsiz_kalit_12345",
        resave: false,
        saveUninitialized: false,
        cookie: { secure: false, maxAge: 3600000 },
    }),
)

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(express.static("public"))

const dataDir = path.join(__dirname, "data")
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir)
}

const authenticateUser = (req, res, next) => {
    console.log("Auth log: So'rov header'lari:", req.headers)
    const { email, password } = req.headers
    console.log("Auth log: So'rov email:", email || "Yo'q")
    console.log("Auth log: So'rov parol:", password ? "Kiritildi" : "Yo'q")

    if (!email || !password) {
        console.log("Auth log: Email yoki parol yo'q")
        return res.status(401).json({ message: "Email va parol kiritilishi shart" })
    }

    const filePath = path.join(__dirname, "data", "users.json")
    try {
        if (!fs.existsSync(filePath)) {
            console.log("Auth log: users.json topilmadi")
            return res.status(404).json({ message: "Hech qanday foydalanuvchi topilmadi" })
        }

        const users = JSON.parse(fs.readFileSync(filePath, "utf-8"))
        const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase())

        if (!user) {
            console.log("Auth log: Foydalanuvchi topilmadi:", email)
            return res.status(401).json({ message: "Email yoki parol noto'g'ri" })
        }

        if (password !== user.password) {
            console.log("Auth log: Parol xato:", email)
            return res.status(401).json({ message: "Email yoki parol noto'g'ri" })
        }

        console.log("Auth log: Foydalanuvchi tasdiqlandi:", { email })
        req.user = user
        next()
    } catch (err) {
        console.log("Auth log: Xato:", err.message)
        return res.status(500).json({ message: "Server xatosi: " + err.message })
    }
}

app.post("/register", async (req, res) => {
    const { name, email, password, birthdate } = req.body
    console.log("Register log: Email:", email)

    if (!name || !email || !password || !birthdate) {
        return res.status(400).json({ message: "Barcha maydonlar to'ldirilishi shart" })
    }

    const filePath = path.join(__dirname, "data", "users.json")
    try {
        let users = []
        if (fs.existsSync(filePath)) {
            users = JSON.parse(fs.readFileSync(filePath, "utf-8"))
        }

        if (users.find((user) => user.email.toLowerCase() === email.toLowerCase())) {
            console.log("Register log: Email allaqachon ro'yxatdan o'tgan:", email)
            return res.status(400).json({ message: "Bu email allaqachon ro'yxatdan o'tgan" })
        }

        const newUser = {
            name,
            email,
            password,
            birthdate,
            date: new Date().toISOString().split("T")[0],
            role: "user",
        }

        users.push(newUser)
        fs.writeFileSync(filePath, JSON.stringify(users, null, 2))
        console.log("Register log: Foydalanuvchi ro'yxatdan o'tdi:", email)
        res.status(201).json({ message: "Ro'yxatdan o'tish muvaffaqiyatli!" })
    } catch (err) {
        console.log("Register log: Xato:", err.message)
        res.status(500).json({ message: "Server xatosi: " + err.message })
    }
})

app.post("/login", (req, res) => {
    const { email, password } = req.body

    const filePath = path.join(__dirname, "data", "users.json")
    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: "Foydalanuvchilar fayli topilmadi" })
    }

    const users = JSON.parse(fs.readFileSync(filePath, "utf8"))
    const user = users.find((u) => u.email === email)

    if (!user) {
        return res.status(401).json({ message: "Foydalanuvchi topilmadi" })
    }

    if (password === user.password) {
        res.json({ role: user.role })
    } else {
        res.status(401).json({ message: "Parol noto'g'ri" })
    }
})

app.post("/order", (req, res) => {
    const { name, phone, service, message } = req.body
    console.log("Order log: Buyurtma:", { name, phone, service })

    if (!name || !phone || !service) {
        return res.status(400).json({ message: "Barcha maydonlar to'ldirilishi shart" })
    }

    const filePath = path.join(__dirname, "data", "order.json")
    try {
        let orders = []
        if (fs.existsSync(filePath)) {
            orders = JSON.parse(fs.readFileSync(filePath, "utf-8"))
        }

        const newOrder = {
            name,
            phone,
            service,
            message: message || "",
            date: new Date().toISOString(),
        }

        orders.push(newOrder)
        fs.writeFileSync(filePath, JSON.stringify(orders, null, 2))
        console.log("Order log: Buyurtma saqlandi:", name)
        res.status(201).json({ message: "Buyurtma muvaffaqiyatli yuborildi!" })
    } catch (err) {
        console.log("Order log: Xato:", err.message)
        res.status(500).json({ message: "Server xatosi: " + err.message })
    }
})

app.post("/contact", (req, res) => {
    const { name, email, message } = req.body
    console.log("Contact log: Aloqa xabari:", { name, email })

    if (!name || !email || !message) {
        return res.status(400).json({ message: "Barcha maydonlar to'ldirilishi shart" })
    }

    const filePath = path.join(__dirname, "data", "comments.json")
    try {
        let comments = []
        if (fs.existsSync(filePath)) {
            comments = JSON.parse(fs.readFileSync(filePath, "utf-8"))
        }

        const newContact = {
            name,
            email,
            message,
            date: new Date().toISOString(),
        }

        comments.push(newContact)
        fs.writeFileSync(filePath, JSON.stringify(comments, null, 2))
        console.log("Contact log: Aloqa xabari saqlandi:", email)
        res.status(201).json({ message: "Xabar muvaffaqiyatli yuborildi!" })
    } catch (err) {
        console.log("Contact log: Xato:", err.message)
        res.status(500).json({ message: "Server xatosi: " + err.message })
    }
})

app.get("/profile", authenticateUser, (req, res) => {
    const filePath = path.join(__dirname, "data", "users.json")
    try {
        if (!fs.existsSync(filePath)) {
            console.log("Profile log: users.json topilmadi")
            return res.status(404).json({ message: "Foydalanuvchilar fayli topilmadi" })
        }
        const users = JSON.parse(fs.readFileSync(filePath, "utf-8"))
        console.log("Profile log: So'rov email:", req.user.email)
        const user = users.find((u) => u.email.toLowerCase() === req.user.email.toLowerCase())
        if (!user) {
            console.log("Profile log: Foydalanuvchi topilmadi:", req.user.email)
            return res.status(404).json({ message: "Foydalanuvchi topilmadi" })
        }
        console.log("Profile log: Ma'lumotlar yuborildi:", { email: user.email, role: user.role || "undefined" })
        res.json({
            name: user.name,
            email: user.email,
            birthdate: user.birthdate,
            date: user.date,
            role: user.role || "user",
        })
    } catch (err) {
        console.log("Profile log: Xato:", err.message)
        res.status(500).json({ message: "Server xatosi: " + err.message })
    }
})

app.put("/profile", authenticateUser, async (req, res) => {
    const { name, email, password, birthdate } = req.body
    console.log("Profile log: Tahrirlash so'rovi:", { name, email, password: password ? "****" : "Bo'sh", birthdate })

    if (!name || !email || !birthdate) {
        console.log("Profile log: Name, email yoki birthdate kiritilmadi")
        return res.status(400).json({ message: "Ism, email va tug'ilgan sana kiritilishi shart" })
    }

    const filePath = path.join(__dirname, "data", "users.json")
    try {
        if (!fs.existsSync(filePath)) {
            console.log("Profile log: users.json topilmadi")
            return res.status(404).json({ message: "Foydalanuvchilar fayli topilmadi" })
        }

        const users = JSON.parse(fs.readFileSync(filePath, "utf-8"))
        const userIndex = users.findIndex((u) => u.email.toLowerCase() === req.user.email.toLowerCase())

        if (userIndex === -1) {
            console.log("Profile log: Foydalanuvchi topilmadi:", req.user.email)
            return res.status(404).json({ message: "Foydalanuvchi topilmadi" })
        }

        if (email.toLowerCase() !== req.user.email.toLowerCase()) {
            if (users.find((u) => u.email.toLowerCase() === email.toLowerCase())) {
                console.log("Profile log: Email allaqachon mavjud:", email)
                return res.status(400).json({ message: "Bu email allaqachon ro'yxatdan o'tgan" })
            }
        }

        const oldUser = users[userIndex]
        const updatedFields = {}
        if (name !== oldUser.name) updatedFields.name = name
        if (email.toLowerCase() !== oldUser.email.toLowerCase()) updatedFields.email = email
        if (birthdate !== oldUser.birthdate) updatedFields.birthdate = birthdate
        if (password) updatedFields.password = true
        console.log("Profile log: Yangilangan maydonlar:", updatedFields)

        let newPassword = oldUser.password
        if (password) {
            newPassword = password
            console.log("Profile log: Parol yangilandi")
        }

        users[userIndex] = {
            ...oldUser,
            name,
            email,
            password: newPassword,
            birthdate,
        }

        fs.writeFileSync(filePath, JSON.stringify(users, null, 2))
        console.log("Profile log: Ma'lumotlar yangilandi:", email)

        const responseData = { message: "Ma'lumotlar muvaffaqiyatli yangilandi" }
        res.json(responseData)
    } catch (err) {
        console.log("Profile log: Xato:", err.message)
        res.status(500).json({ message: "Server xatosi: " + err.message })
    }
})

app.get("/admin/orders", authenticateUser, (req, res) => {
    const filePath = path.join(__dirname, "data", "order.json")
    try {
        if (!fs.existsSync(filePath)) {
            console.log("Orders log: order.json topilmadi")
            return res.json([])
        }

        const orders = JSON.parse(fs.readFileSync(filePath, "utf-8"))
        console.log("Orders log: Buyurtmalar yuborildi, foydalanuvchi:", { email: req.user.email })
        res.json(orders)
    } catch (err) {
        console.log("Orders log: Xato:", err.message)
        res.status(500).json({ message: "Server xatosi: " + err.message })
    }
})

app.get("/admin/comments", authenticateUser, (req, res) => {
    const filePath = path.join(__dirname, "data", "comments.json")
    try {
        if (!fs.existsSync(filePath)) {
            console.log("Comments log: comments.json topilmadi")
            return res.json([])
        }

        const comments = JSON.parse(fs.readFileSync(filePath, "utf-8"))
        console.log("Comments log: Xabarlar yuborildi, foydalanuvchi:", { email: req.user.email })
        res.json(comments)
    } catch (err) {
        console.log("Comments log: Xato:", err.message)
        res.status(500).json({ message: "Server xatosi: " + err.message })
    }
})

app.listen(PORT, () => {
    console.log(`Server http://localhost:${PORT} da ishlamoqda`)
})
