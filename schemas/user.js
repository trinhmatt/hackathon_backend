const   mongoose = require("mongoose"),
        Schema = mongoose.Schema;

module.exports.schema = new Schema({
    username: {
        type: String,
        unique: true
    },
    password: String,
    email: {
        type: String, 
        unique: true
    },
    dateOfBirth: Date,
    gender: String,
    genderPref: String,
    avatar: String,
    conversations: [{type: Schema.Types.ObjectId, ref: "conversations"}],
    goals: [
        {
            goalType: {type: Schema.Types.ObjectId, ref: "goals"},
            targetGoal: Number,
            currentProgress: Number,
            deadline: Date, 
            dailyProgress: [{
                date: Date,
                picture: String, 
                rating: String
            }],
            buddy: {type: Schema.Types.ObjectId, ref: "users"}
        }
    ]
})