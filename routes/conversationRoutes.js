const   express = require("express"),
        router = express.Router(),
        passport = require("passport"),
        db = require("../db");

router.post("/create-conversation", (req, res) => {
    db.createConversation(req.body.users, req.body.goal)
    .then( (response) => {
      res.send(response);
    }).catch( err => res.send(err));
})

router.get("/get-convo/:convoID", (req, res) => {
  db.getConversation(req.params.convoID)
    .then( convo => res.send(convo))
    .catch( err => res.status(500).send(err));
})

router.get("/get-all-convos/:userID", (req, res) => {
  db.getAllConvos(req.params.userID)
    .then( goals => res.send(goals))
    .catch( err => res.status(500).send(err));
})

module.exports = router;