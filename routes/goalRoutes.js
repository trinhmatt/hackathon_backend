const   express = require("express"),
        router = express.Router(),
        db = require("../db");

router.post("/add-user-to-goal", (req, res) => {
    db.addUserToGoal(req.body)
        .then( (matchedUser) => {
            //res.send(matchedUser);
        }).catch( err => res.status(500).send(err));
})

module.exports = router;