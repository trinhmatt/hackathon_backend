const express = require("express"),
    bodyParser = require("body-parser"),
    cors = require("cors"),
    path = require("path"),
    passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy,
    session = require("express-session"),
    bcrypt = require("bcryptjs"),
    dotenv = require("dotenv").config(),
    db = require("./db.js"),
    app = express(),
    http = require('http').Server(app),
    io = require('socket.io')(http);

const userRoutes = require("./routes/userRoutes"),
    conversationRoutes = require("./routes/conversationRoutes"),
    goalRoutes = require("./routes/goalRoutes");

let HTTP_PORT = process.env.PORT || 8080;

app.use(bodyParser.urlencoded({ extended: true }));

//Enable cross origin
app.use(cors());

//User authentication
app.use(session({ secret: "hackathon", resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

//Use custom strategy to authenticate user credentials
passport.use(new LocalStrategy((username, password, done) => {
    const user = { username, password };
    db.login(user)
        .then((foundUser) => {
            return done(null, foundUser);
        })
        .catch((err) => {
            console.log(err);
            return done(null, false, { message: err });
        })
}));

//Serialize user data into session cookies
passport.serializeUser(function (user, done) {
    done(null, user);
});

passport.deserializeUser(function (user, done) {
    done(null, user);
})

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "/index.html"));
})

app.use(userRoutes);
app.use(goalRoutes);
app.use(conversationRoutes);



io.on("connection", (socket) => {
    console.log("a user connected");
    socket.on("send message", (messageData) => {
        console.log(messageData);
        db.saveMessage(messageData)
            .then((newMessages) => {
                socket.broadcast.emit("from server", newMessages);
            })
            .catch((err) => console.log(err));
    })
})


db.initialize().then(() => {
    http.listen(HTTP_PORT, () => {
        console.log("app listening on: " + HTTP_PORT);
    });
}).catch(err => console.log(err));