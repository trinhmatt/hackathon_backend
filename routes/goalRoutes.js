const   express = require("express"),
        router = express.Router(),
        db = require("../db");


router.get("/goals-from-type/:category", (req, res) => {
    db.getGoals(req.params.category)
        .then( goals => res.send(goals))
        .catch(err => res.status(500).send(err));
})

router.post("/add-user-to-goal", (req, res) => {
    db.addUserToGoal(req.body)
        .then( (response) => {
            //res.send(matchedUser);
            res.send(response);
        }).catch( err => res.status(500).send(err));
})

router.put("/update-goal", (req, res) => {
    db.updateGoal(req.body.goal, req.body.user)
        .then( (updatedGoal) => res.send(updatedGoal))
        .catch( err => res.status(500).send(err));
})


module.exports = router;