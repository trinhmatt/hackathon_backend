const   mongoose = require("mongoose"),
        Schema = mongoose.Schema;

module.exports.schema = new Schema({
    users: [{type: Schema.Types.ObjectId, ref: "users"}],
    goal: {type: Schema.Types.ObjectId, ref: "goals"},
    messages: [
        {
            user: String,
            createdAt: Date,
            bodyText: String,
            type: String
        }
    ]
})