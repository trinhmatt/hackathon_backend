const   express = require("express"),
        router = express.Router(),
        db = require("../db");

router.post("/add-user-to-goal", (req, res) => {
    db.addUserToGoal(req.body)
        .then( (response) => {
            //res.send(matchedUser);
            res.send(response);
        }).catch( err => res.status(500).send(err));
})

module.exports = router;