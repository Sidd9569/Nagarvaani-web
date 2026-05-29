const mongoose = require("mongoose");

const rewardSchema = new mongoose.Schema({

    rewardName: String,

    pointsRequired: Number,

    description: String,

    image: String

});

module.exports = mongoose.model("Reward", rewardSchema);