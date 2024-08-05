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
        fs.writeFileSync('db.json', JSON.stringify(data));
    },
    getKey: function (key) {
        return this.get()[key];
    },
    set: function (data) {
        fs.writeFileSync('db.json', JSON.stringify(data));
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

app.get('/', (req, res) => {
    if (!req.isAuthenticated()) return res.render("index");
    res.render("main");

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
