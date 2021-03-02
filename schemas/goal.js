const   mongoose = require("mongoose"),
        Schema = mongoose.Schema;

module.exports.schema = new Schema({
    category: String,
    name: String,
    users: [{type: Schema.Types.ObjectId, ref: "users"}]
})