const mongoose = require("mongoose"),
      bcrypt = require("bcryptjs");

let Schema = mongoose.Schema;
mongoose.set('useFindAndModify', false);