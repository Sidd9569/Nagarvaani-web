const Issue = require("../models/Issue");
const User = require("../models/User");

/* -------- Dashboard Stats -------- */

exports.getStats = async (req,res)=>{

try{

const total = await Issue.countDocuments();

const resolved = await Issue.countDocuments({status:"Resolved"});

const pending = await Issue.countDocuments({status:"Pending"});

const user = await User.findById(req.user.id);

const monthly = new Array(12).fill(0);

const issues = await Issue.find({reportedBy:req.user.id});

issues.forEach(issue=>{

const month = new Date(issue.createdAt).getMonth();

monthly[month]++;

});

/* Calculate user's rank on leaderboard */
const allUsers = await User.find()
  .sort({points:-1, creditPoints:-1, reportsSubmitted:-1})
  .select("points creditPoints reportsSubmitted");

let userRank = 0;
for (let i = 0; i < allUsers.length; i++) {
  const u = allUsers[i];
  const currentScore = (u.points || 0) + (u.creditPoints || 0);
  const userScore = (user.points || 0) + (user.creditPoints || 0);
  const currentReports = u.reportsSubmitted || 0;
  const userReports = user.reportsSubmitted || 0;
  
  if (currentScore > userScore || (currentScore === userScore && currentReports > userReports)) {
    continue;
  }
  
  if (u._id.toString() === user._id.toString()) {
    userRank = i + 1;
    break;
  }
}

if (userRank === 0) {
  userRank = allUsers.length > 0 ? allUsers.length : 1;
}

res.json({

total,
resolved,
pending,
points:user.points,
creditPoints: user.creditPoints || 0,
reportsSubmitted: user.reportsSubmitted || 0,
rank: userRank,
totalUsers: allUsers.length,
monthly

});

}catch(error){

res.status(500).json({message:error.message});

}

};

/* -------- Leaderboard -------- */

exports.getLeaderboard = async (req,res)=>{

try{

const users = await User.find()
.sort({points:-1, creditPoints:-1, reportsSubmitted:-1})
.select("name email mobileNumber city points creditPoints reportsSubmitted");

// Add totalScore (points + creditPoints) to each user
const usersWithScore = users.map((user, index) => {
  const userObj = user.toObject();
  userObj.totalScore = (userObj.points || 0) + (userObj.creditPoints || 0);
  userObj.rank = index + 1;
  return userObj;
});

// Re-sort by totalScore descending for true comparison
usersWithScore.sort((a, b) => b.totalScore - a.totalScore || b.reportsSubmitted - a.reportsSubmitted);

// Re-assign ranks after re-sorting
usersWithScore.forEach((user, index) => {
  user.rank = index + 1;
});

res.json(usersWithScore);

}catch(error){

res.status(500).json({message:error.message});

}

};
