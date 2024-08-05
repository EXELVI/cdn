const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

app.use('/cdn', express.static(path.join(__dirname, 'uploads')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.raw());
app.use(express.static("public"));
app.set("view engine", "ejs");

app.get('/', (req, res) => {
    res.render("index");
});
app.post('/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }
    res.render("upload", { fileUrl: `/cdn/${req.file.filename}` });
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).render("error", { error: "Internal Server Error", code: "500", errormessage: "An internal server error occurred.", textcolor: "danger", color: "#dc3545" });
});

app.use((req, res) => {
    res.status(404).render("error", { error: "Not Found", code: "404", errormessage: "The requested URL was not found on this server.", textcolor: "warning", color: "#ffc107" });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
