require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;
const fs = require('fs');
var DiscordStrategy = require('passport-discord').Strategy;
var passport = require('passport');
var session = require('express-session');

var scopes = ['identify'];

var db = {
    get: function () {
        return JSON.parse(fs.readFileSync('db.json'));
    },
    setKey: function (key, value) {
        var data = this.get();
        data[key] = value;
        fs.writeFileSync('db.json', JSON.stringify(data, null, 2));
    },
    getKey: function (key) {
        return this.get()[key];
    },
    set: function (data) {
        fs.writeFileSync('db.json', JSON.stringify(data, null, 2));
    }
}

passport.use(new DiscordStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: 'http://localhost:3000/auth/discord/callback',
    scope: scopes
},
    function (accessToken, refreshToken, profile, done) {
        process.nextTick(function () {
            return done(null, profile);
        });
    }
));
passport.serializeUser(function (user, done) {
    done(null, user);
});
passport.deserializeUser(function (obj, done) {
    done(null, obj);
});

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

app.use(session({
    secret: 'super-super-secret:)',
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

app.get('/auth/discord', passport.authenticate('discord'));

app.get('/auth/discord/callback',
    passport.authenticate('discord', { failureRedirect: '/' }),
    (req, res) => {
        res.redirect('/');
    }
);

function getFileIcon(fileName) {
    const ext = fileName.split('.').pop();
    switch (ext) {
        case 'doc':
        case 'docx':
            return 'bi-file-earmark-word';
        case 'xls':
        case 'xlsx':
            return 'bi-file-earmark-excel';
        case 'ppt':
        case 'pptx':
            return 'bi-filetype-pptx';
        case 'pdf':
            return 'bi-file-earmark-pdf';
        case 'zip':
        case 'rar':
        case '7z':
        case 'tar':
            return 'bi-file-earmark-zip';
        case 'mp3':
        case 'wav':
        case 'flac':
        case 'ogg':
        case 'm4a':
        case 'wma':
            return 'bi-file-earmark-music';
        case 'mp4':
        case 'mkv':
        case 'avi':
        case 'mov':
        case 'wmv':
        case 'flv':
        case 'webm':
            return 'bi-file-earmark-play';
        case 'jpg':
        case 'jpeg':
        case 'png':
        case 'gif':
        case 'bmp':
        case 'webp':
        case 'ico':
            return 'bi-file-earmark-image';
        case 'txt':
        case 'log':
            return 'bi-file-earmark-text';
        case 'js': //filetype from now
            return 'bi-filetype-js';
        case 'css':
            return 'bi-filetype-css';
        case 'html':
            return 'bi-filetype-html';
        case 'json':
            return 'bi-filetype-json';
        case 'md':
            return 'bi-filetype-md';
        case 'csv':
            return 'bi-filetype-csv';
        case 'sql':
            return 'bi-filetype-sql';
        case 'py':
            return 'bi-filetype-py';
        case 'java':
            return 'bi-filetype-java';
        case 'ai':
            return 'bi-filetype-ai';
        case 'psd':
            return 'bi-filetype-psd';
        case 'svg':
            return 'bi-filetype-svg';
        case 'heic':
            return 'bi-filetype-heic';
        case 'php':
            return 'bi-filetype-php';
        case 'key':
            return 'bi-filetype-key';
        case 'sass':
            return 'bi-filetype-sass';
        case 'mdx':
            return 'bi-filetype-mdx';
        case 'jsx':
            return 'bi-filetype-jsx';
        case 'rb':
            return 'bi-filetype-rb';
        case 'tsx':
            return 'bi-filetype-tsx';
        case 'woff':
        case 'woff2':
            return 'bi-filetype-woff';
        case 'ttf':
            return 'bi-filetype-ttf';
        case 'otf':
            return 'bi-filetype-otf';
        case 'exe':
            return 'bi-filetype-exe';
        case 'aac':
            return 'bi-filetype-aac';
        case 'raw':
            return 'bi-filetype-raw';
        case 'tiff':
            return 'bi-filetype-tiff';
        case 'yml':
        case 'yaml':
            return 'bi-filetype-yml';
        case 'xml':
        case 'c':
        case 'ts':
        case 'cpp':
        case 'h':
        case 'hpp':
        case 'go':
        case 'cs':
        case 'swift':
        case 'kt':
        case 'rs':
        case 'lua':
        case 'sh':
        case 'bat':
        case 'ps1':
        case 'cmd':
        case 'pl':
        case 'r':
        case 'm':
        case 'v':
        case 'vb':
        case 'f':
            return 'bi-file-earmark-code';
        default:
            return 'bi-file-earmark';
    }
}

app.get('/', (req, res) => {
    if (!req.isAuthenticated()) return res.render("index");
    var dbData = db.getKey(req.user.id);
    res.render("main", { files: dbData ? dbData.files : [], getFileIcon });

});

app.post('/upload', upload.single('file'), (req, res) => {
    if (!req.isAuthenticated()) return res.redirect('/auth/discord');
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }
    if (db.getKey(req.user.id) === undefined) {
        db.setKey(req.user.id, { files: [] });
    }
    var data = db.getKey(req.user.id);
    data.files.push(req.file);
    db.setKey(req.user.id, data);
    res.render("upload", { fileUrl: `/cdn/${req.file.filename}` });
});

app.get('/download/:file', (req, res) => {
    if (!req.isAuthenticated()) return res.redirect('/auth/discord');
    var file = db.getKey(req.user.id).files.find(f => f.filename === req.params.file);
    if (!file) return res.status(404).render("error", { error: "Not Found", code: "404", errormessage: "The requested file was not found on this server.", textcolor: "primary", color: "#007bff" });
    res.download(`uploads/${file.filename}`);
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
