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
    return new Promise((resolve, reject) => {
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

module.exports.updateUser = (userData) => {
    return new Promise((resolve, reject) => {
        User.findByIdAndUpdate(
            mongoose.Types.ObjectId(userData._id),
            userData,
            { new: true, upsert: true },
            (err, updatedUser) => {
                err ? reject(err) : resolve(updatedUser);
            })
    })
}

module.exports.login = (user) => {
    return new Promise((resolve, reject) => {

        //Find user if they exist and populate referenced fields
        User.findOne({ username: user.username })
            .populate({
                path: "goals",
                populate: {
                    path: "conversation",
                    model: "conversations"
                }
            })
            .populate({
                path: "goals",
                populate: {
                    path: "goalType",
                    model: "goals"
                }
            })
            .populate({
                path: "goals",
                populate: {
                    path: "buddy",
                    model: "users"
                }
            })
            .exec()
            .then((foundUser) => {

                //Compare the hashed password with the password supplied
                bcrypt.compare(user.password, foundUser.password)
                    .then((response) => {
                        if (response) {
                            resolve(foundUser);
                        } else {
                            reject();
                        }
                    })

            })
            .catch((err) => {
                reject("No user found");
            })

    })
}

module.exports.getUser = (id) => {
    return new Promise((resolve, reject) => {
        User.findOne({ _id: mongoose.Types.ObjectId(id) })
            .populate({
                path: "goals",
                populate: {
                    path: "goalType",
                    model: "goals"
                }
            })
            .populate({
                path: "goals",
                populate: {
                    path: "buddy",
                    model: "users"
                }
            })
            .exec()
            .then(user => resolve(user)).catch(err => reject(err));
    })
}

module.exports.getAllConvos = (id) => {
    return new Promise((resolve, reject) => {
        User.findOne({ _id: mongoose.Types.ObjectId(id) })
            .populate({
                path: "goals",
                populate: {
                    path: "goalType",
                    model: "goals"
                }
            })
            .populate({
                path: "goals",
                populate: {
                    path: "conversation",
                    model: "conversations"
                }
            })
            .exec()
            .then(user => resolve(user.goals)).catch( err => reject(err));
    })
}

//GOALS
module.exports.getGoals = (category) => {
    return new Promise((resolve, reject) => {
        Goal.find({ category }, (err, goals) => {

            err ? reject(err) : resolve(goals);
        })
    })
}

module.exports.addUserToGoal = (data) => {
    return new Promise((resolve, reject) => {

        Goal.findById(mongoose.Types.ObjectId(data.goal), (err, goal) => {
            if (!err) {
                //Check if users available to match in same goal 
                if (goal.users.notMatched.length > 0) {

                    dbHelpers.createConversation([mongoose.Types.ObjectId(data.user), goal.users.notMatched[0]], Conversation)
                        .then((conversation) => {
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
                                    buddy: goal.users.notMatched[0],
                                    conversation: conversation._id
                                }

                                User.findById(mongoose.Types.ObjectId(goal.users.notMatched[0]), (err, otherUser) => {

                                    if (err) {
                                        reject(err);
                                    }

                                    let didMatch = false;

                                    for (let i = 0; i < otherUser.goals.length; i++) {

                                        if (otherUser.goals[i].goalType.equals(newGoal.goalType) && !didMatch) {

                                            didMatch = true;

                                            otherUser.goals[i].buddy = user._id;
                                            otherUser.goals[i].conversation = conversation._id;

                                            otherUser.save((err) => {
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
                        }).catch(err => reject(err));

                } else {
                    //Find notMatched user in other goals of same category 
                    Goal.find({ category: goal.category }, (err, allGoals) => {

                        if (allGoals.length > 0) {
                            let didMatch = false;
                            for (let i = 0; i < allGoals.length; i++) {

                                //Match user with first available user in the same category
                                if (allGoals[i].users.notMatched.length > 0 && !didMatch) {

                                    //Need to track if a match has been made since for loop does not wait for async function
                                    didMatch = true;

                                    dbHelpers.createConversation([mongoose.Types.ObjectId(data.user), allGoals[i].users.notMatched[0]], Conversation)
                                        .then((conversation) => {
                                            User.findById(mongoose.Types.ObjectId(data.user), (err, user) => {

                                                if (err) {
                                                    reject(err);
                                                }

                                                const newGoal = {
                                                    goalType: allGoals[i]._id,
                                                    targetGoal: data.targetGoal,
                                                    currentProgress: 0,
                                                    deadline: data.deadline,
                                                    dailyProgress: [],
                                                    buddy: allGoals[i].users.notMatched[0],
                                                    conversation: conversation._id
                                                }

                                                User.findById(mongoose.Types.ObjectId(allGoals[i].users.notMatched[0]), (err, otherUser) => {

                                                    if (err) {
                                                        reject(err);
                                                    }

                                                    //Assign buddy and add conversation reference for other user
                                                    for (let i = 0; i < otherUser.goals.length; i++) {
                                                        if (otherUser.goals[i].goalType.equals(newGoal.goalType)) {
                                                            didMatch = true;
                                                            otherUser.goals[i].buddy = user._id;
                                                            otherUser.goals[i].conversation = conversation._id;

                                                            otherUser.save((err) => {
                                                                if (err) {
                                                                    reject(err);
                                                                }

                                                                //Add goal to current user
                                                                dbHelpers.addGoalToUser(newGoal, user)
                                                                    .then(() => {

                                                                        //Remove user from goal's unmatched array
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
                                        }).catch(err => reject(err));
                                }
                            }

                            //If no matches possible
                            if (!didMatch) {
                                goal.users.notMatched.push(data.user)
                                goal.save((err) => {
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
                                            .then(() => {
                                                resolve(newGoal);
                                            }).catch(err => reject(err))
                                    })
                                })
                            }   
                            
                        }
                    })
                }

            }
        })
    })
}


module.exports.updateGoal = (update, userID) => {
    return new Promise((resolve, reject) => {
        User.findById(mongoose.Types.ObjectId(userID), (err, user) => {
            if (!err) {
                for (let i = 0; i < user.goals.length; i++) {
                    if (user.goals[i]._id.equals(update._id)) {
                        user.goals[i] = update;
                        user.save(err => err ? reject(err) : resolve(user.goals[i]))
                    }
                }
            } else {
                reject(err);
            }
        })
    })
}

//CONVERSATIONS
module.exports.createConversation = (users, goalID) => {

    return new Promise((resolve, reject) => {
        let convData = {
            users,
            goal: goalID,
            messages: []
        }

        let newConv = new Conversation(convData)
        newConv.save((err) => {
            if (err) {
                reject(err);
            } else {

                User.findById(mongoose.Types.ObjectId(users[0]), (err, user1) => {
                    if (!err) {

                        user1.conversations.push(newConv._id);

                        user1.save((err) => {
                            if (!err) {
                                User.findById(mongoose.Types.ObjectId(users[1]), (err, user2) => {
                                    if (!err) {
                                        user2.conversations.push(newConv._id);
                                        user2.save((err) => {
                                            if (!err) {
                                                resolve(newConv);
                                            } else {
                                                console.log(err)
                                                reject("could not save array");
                                            }
                                        })
                                    } else {
                                        console.log(err)
                                        reject("could not save array");
                                    }
                                })
                            } else {
                                console.log(err);
                                reject("could not save array");
                            }
                        })
                    }
                })
            }
        })
    })
}

module.exports.getConversation = (convID) => {
    return new Promise((resolve, reject) => {
        Conversation.findById(mongoose.Types.ObjectId(convID), (err, conversation) => {
            console.log("convo: ", conversation)
            err ? reject(err) : resolve(conversation);
        })
    })
}

module.exports.saveMessage = (messageData) => {
    console.log("conv id: ", messageData.conversationID)
    return new Promise((resolve, reject) => {
        Conversation.findById(mongoose.Types.ObjectId(messageData.conversationID), (err, conversation) => {
            if (!err) {
                conversation.messages = messageData.msgs;
                conversation.save((err) => {
                    if (!err) {
                        resolve(conversation.messages);
                    } else {
                        reject(err);
                    }
                })
            } else {
                reject(err);
            }
        })
    })
}