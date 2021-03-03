const mongoose = require("mongoose"),
    user = require("./schemas/user"),
    goal = require("./schemas/goal"),
    conversation = require("./schemas/conversations"),
    dbHelpers = require("./helpers/dbHelpers"),
    bcrypt = require("bcryptjs");

let Schema = mongoose.Schema;

//Remove deprecated flags
mongoose.set('useFindAndModify', false);
mongoose.set('useNewUrlParser', true);
mongoose.set('useUnifiedTopology', true);


let User,
    Goal,
    Conversation;

module.exports.initialize = () => {
    return new Promise((resolve, reject) => {
        let db = mongoose.createConnection(process.env.DB_CONNECTION_STRING);

        db.on("error", (err) => {
            reject(err);
        })

        db.once("open", () => {
            User = db.model("users", user.schema);
            Goal = db.model("goals", goal.schema);
            Conversation = db.model("conversations", conversation.schema);

            console.log("Db running")
            resolve();
        })
    })
}

module.exports.registerUser = (userData) => {
    return new Promise( (resolve, reject) => {
        let errObj = {};

        //Hash the password 
        bcrypt.genSalt(10, (err, salt) => {

            if (err) {
                errObj.status = 500;
                errObj.err = err;
                reject(errObj)
            } else {
                bcrypt.hash(userData.password, salt, (err, hash) => {

                    //Fail to hash
                    if (err) {
                        errObj.status = 500;
                        errObj.err = err;
                        reject(errObj);
                    } else {

                        userData.password = hash;
                        let newUser = new User(userData);

                        newUser.save((err) => {

                            //Username already exists
                            if (err) { 
                                errObj.status = 400;
                                errObj.err = err;
                                reject(errObj);
                            } else {
                                resolve(newUser);
                            }
                        })
                    }
                })
            }
        })
    })
}

module.exports.login = (user) => {
    return new Promise( (resolve, reject) => {

        //Find user if they exist
        User.findOne({ username: user.username }).exec()
            .then( (foundUser) => {
  
              //Compare the hashed password with the password supplied
              bcrypt.compare(user.password, foundUser.password)
                .then( (response) => {
                  if (response) {
                    resolve(foundUser);
                  } else {
                    reject();
                  }
                })
  
            })
            .catch( (err) => {
              reject("No user found");
            })
  
    })
}

module.exports.addUserToGoal = (data) => {
    return new Promise( (resolve, reject) => {

        Goal.findById(mongoose.Types.ObjectId(data.goal), (err, goal) => {
            if (!err) {
                //Check if users available to match in same goal 
                if (goal.users.notMatched.length > 0) {
                    //add buddy for both users
                    User.findById(mongoose.Types.ObjectId(data.user), (err, user) => {

                        if (err) {
                            reject(err);
                        } 

                        const newGoal = {
                            goalType: goal._id,
                            targetGoal: data.targetGoal,
                            currentProgress: 0,
                            deadline: data.deadline,
                            dailyProgress: [],
                            buddy: goal.users.notMatched[0]
                        }

                        User.findById(mongoose.Types.ObjectId(goal.users.notMatched[0]), (err, otherUser) => {
                            
                            if (err) {
                                reject(err);
                            } 

                            for (let i = 0; i < otherUser.goals.length; i++) {

                                if (otherUser.goals[i].goalType.equals(newGoal.goalType)) {
                                    otherUser.goals[i].buddy = user._id;
                                    otherUser.save( (err) => {
                                        if (err) {
                                            reject(err);
                                        }
                                        dbHelpers.addGoalToUser(newGoal, user)
                                            .then(() => {

                                                goal.users.notMatched.shift();
                                                goal.save((err) => {
                                                    err ? reject(err) : resolve(newGoal);
                                                })

                                            }).catch((err) => reject(err));
                                    })
                                }
                            }
                        })
                    })
                } else {
                    //Find notMatched user in other goals of same category 
                    Goal.find({category: goal.category}, (err, allGoals) => {

                        if (allGoals.length > 0) {
                            for (let i = 0; i < allGoals.length; i++) {
                                if (allGoals[i].users.notMatched.length > 0) {
                                    
                                        User.findById(mongoose.Types.ObjectId(data.user), (err, user) => {

                                            if (err) {
                                                reject(err);
                                            } 
                                            console.log(allGoals[i]._id);
                                            const newGoal = {
                                                goalType: allGoals[i]._id,
                                                targetGoal: data.targetGoal,
                                                currentProgress: 0,
                                                deadline: data.deadline,
                                                dailyProgress: [],
                                                buddy: allGoals[i].users.notMatched[0]
                                            }
                    
                                            User.findById(mongoose.Types.ObjectId(allGoals[i].users.notMatched[0]), (err, otherUser) => {
                                                
                                                if (err) {
                                                    reject(err);
                                                } 

                                                for (let i = 0; i < otherUser.goals.length; i++) {
                                                    if (otherUser.goals[i].goalType === newGoal._id) {
                                                        otherUser.goals[i].buddy = user._id;
                                                        otherUser.save( (err) => {
                                                            if (err) {
                                                                reject(err);
                                                            }
                                                            dbHelpers.addGoalToUser(newGoal, user)
                                                                .then(() => {

                                                                    allGoals[i].users.notMatched.shift();
                                                                    allGoals[i].save((err) => {
                                                                        err ? reject(err) : resolve(newGoal);
                                                                    })

                                                                }).catch((err) => reject(err));
                                                        })
                                                    }
                                                }
                                            })
                                        })
                                }
                            }

                            //If no matches possible
                            goal.users.notMatched.push(data.user)
                            goal.save( (err) => {
                                if (err) {
                                    reject(err);
                                }

                                User.findById(mongoose.Types.ObjectId(data.user), (err, user) => {
                                    if (err) {
                                        reject(err);
                                    }
                                    const newGoal = {
                                        goalType: goal._id,
                                        targetGoal: data.targetGoal,
                                        currentProgress: 0,
                                        deadline: data.deadline,
                                        dailyProgress: []
                                    }
                                    dbHelpers.addGoalToUser(newGoal, user)
                                        .then( () => {
                                            resolve("add success, no match")
                                        }).catch( err => reject(err))
                                })
                            })
                        }
                    })
                }
        
            }
        })
    })
}