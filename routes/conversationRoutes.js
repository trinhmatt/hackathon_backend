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
  console.log(req.params.convoID)
  db.getConversation(req.params.convoID)
    .then( convo => res.send(convo))
    .catch( err => res.status(500).send(err));
})

module.exports = router;