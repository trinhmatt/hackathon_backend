const mongoose = require("mongoose"),
    user = require("./schemas/user"),
    goal = require("./schemas/goal"),
    conversation = require("./schemas/conversations"),
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