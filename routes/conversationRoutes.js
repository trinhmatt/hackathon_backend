const   express = require("express"),
        router = express.Router(),
        passport = require("passport"),
        db = require("../db");

router.post("/create-conversation", (req, res) => {
    db.createConversation(req.body.users)
    .then( (response) => {
      res.send(response);
    }).catch( err => res.send(err));
})

module.exports = router;