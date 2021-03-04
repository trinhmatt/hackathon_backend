const   mongoose = require("mongoose"),
        Schema = mongoose.Schema;

module.exports.schema = new Schema({
    users: [{type: Schema.Types.ObjectId, ref: "users"}],
    messages: [Schema.Types.Mixed]
})