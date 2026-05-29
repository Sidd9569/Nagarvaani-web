const User = require("../models/User");

/* Update Points */

async function addPoints(userId, points){

    try{

        const user = await User.findById(userId);

        if(!user) return;

        user.points += points;

        await user.save();

    }catch(error){

        console.log("Leaderboard update error:", error);

    }

}

/* Get Top Citizens */

async function getTopUsers(){

    const users = await User.find()
    .sort({points:-1})
    .limit(10)
    .select("name points reportsSubmitted badges");

    return users;

}

module.exports = {
    addPoints,
    getTopUsers
};