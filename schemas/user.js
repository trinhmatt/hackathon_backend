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
    conversations: [{type: Schema.Types.ObjectId, ref: "conversations"}],
    buddies: [{type: Schema.Types.ObjectId, ref: "users"}],
    goals: [{type: Schema.Types.ObjectId, ref: "goals"}]
})