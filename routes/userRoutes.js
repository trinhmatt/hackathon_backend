const   express = require("express"),
        router = express.Router(),
        passport = require("passport"),
        db = require("../db");


router.post("/login", passport.authenticate('local'), (req, res) => {
    if (!!req.user) {
        res.send(req.user);
    } else {
        res.status(400).send("Invalid Login");
    }
})

router.get("/logout", (req, res) => {
    if (!!req.user) {
        req.logout();
        res.send("logged out");
    } else {
        res.send("not logged in");
    }
    
})

router.post("/register", (req, res) => {
    let userInfo = req.body;
    let userCheck = true;

    if (!!userInfo.username && userInfo.username.length > 0) {
        userInfo.username = userInfo.username.trim();
    } else {
        userCheck = false;
    }

    if (!!userInfo.password && userInfo.password.length > 0) {
        userInfo.password = userInfo.password.trim();
    } else {
        userCheck = false;
    }

    if (userCheck) {

        userInfo.conversations = [];
        userInfo.goals = [];

        db.registerUser(userInfo).then( (user) => {
            res.send(user);
        }).catch( err => {
            res.status(err.status).send(err.err);
        })
    }
    
})

router.put("/updateUser", (req, res) => {
    db.updateUser(req.body)
        .then( (updatedUser) => res.send(updatedUser))
        .catch( err => res.status(500).send(err));
})

router.get("/get-user/:id", (req, res) => {
    db.getUser(req.params.id)
        .then( user => res.send(user))
        .catch( err => res.status(500).send(err));
})

module.exports = router;