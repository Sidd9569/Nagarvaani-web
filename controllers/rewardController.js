const mongoose = require("mongoose");
const Reward = require("../models/Reward");
const User = require("../models/User");
const { sendEmail } = require("../services/emailService");

/* -------- Get User's Redeemed Rewards -------- */

exports.getUserRewards = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("redeemedRewards");
    res.json({ redeemedRewards: user.redeemedRewards || [] });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* -------- Get Rewards -------- */

exports.getRewards = async (req,res)=>{

try{

const rewards = await Reward.find();

res.json(rewards);

}catch(error){

res.status(500).json({message:error.message});

}

};

/* -------- Award Credit Points (Admin) -------- */

exports.awardCreditPoints = async (req, res) => {
  try {
    const { userId, points } = req.body;

    if (!userId || !points || points <= 0) {
      return res.status(400).json({ error: "Valid userId and points required" });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.creditPoints += points;
    await user.save();

    console.log(`✅ Awarded ${points} credit points to ${user.name} (${user.email})`);

    res.json({
      message: `Awarded ${points} credit points to ${user.name}`,
      user: {
        id: user._id,
        name: user.name,
        creditPoints: user.creditPoints,
        totalScore: user.points + user.creditPoints
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* -------- Redeem Reward (with email + SMS notification) -------- */

exports.redeemReward = async (req,res)=>{

try{

const {rewardId, rewardName, pointsRequired, rewardDescription} = req.body;

const user = await User.findById(req.user.id);

/* Support both MongoDB reward ID and inline reward data from frontend */
let reward = null;
if (rewardId && mongoose.Types.ObjectId.isValid(rewardId)) {
  try { reward = await Reward.findById(rewardId); } catch(e) {}
}

const name = reward ? reward.rewardName : (rewardName || 'Reward');
const cost = reward ? reward.pointsRequired : (parseInt(pointsRequired) || 0);
const desc = reward ? (reward.description || '') : (rewardDescription || '');

if (cost <= 0) {
  return res.status(400).json({message:"Invalid reward"});
}

if(user.points < cost){
return res.status(400).json({message:"Not enough points"});
}

user.points -= cost;
// Track the purchased reward ID in user's redeemedRewards array
if (rewardId && !user.redeemedRewards.includes(Number(rewardId))) {
  user.redeemedRewards.push(Number(rewardId));
}

await user.save();

/* Send email confirmation to user */
const emailSubject = `🎁 Reward Redeemed - ${name}`;
const emailHtml = `
  <div style="font-family:'Segoe UI',sans-serif;max-width:600px;margin:0 auto;">
    <div style="background:linear-gradient(135deg,#8b5cf6,#06b6d4);padding:30px;text-align:center;border-radius:16px 16px 0 0;">
      <h1 style="color:#fff;margin:0;font-size:24px;">🎉 Reward Redeemed!</h1>
      <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;">Thank you for being an active citizen!</p>
    </div>
    <div style="padding:30px;background:#fff;border-radius:0 0 16px 16px;">
      <p style="color:#333;font-size:16px;">Hi <strong>${user.name}</strong>,</p>
      <p style="color:#555;">You have successfully redeemed:</p>
      <div style="background:#f0f4ff;padding:20px;border-radius:12px;margin:16px 0;text-align:center;border:1px solid #e0e7ff;">
        <div style="font-size:48px;margin-bottom:8px;">🎁</div>
        <h2 style="color:#8b5cf6;margin:0;">${name}</h2>
        <p style="color:#666;margin:8px 0;">${desc}</p>
        <p style="color:#f59e0b;font-weight:700;font-size:18px;">-${cost} points</p>
      </div>
      <p style="color:#555;">Your remaining balance: <strong>${user.points + user.creditPoints} points</strong></p>
      <p style="color:#888;font-size:13px;">Check more rewards on your NagarVaani dashboard.</p>
    </div>
  </div>
`;
try {
  await sendEmail(user.email, emailSubject, emailHtml);
  console.log(`✅ Reward redemption email sent to ${user.email}`);
} catch (emailErr) {
  console.warn(`⚠️ Failed to send reward email: ${emailErr.message}`);
}

/* Send SMS notification if mobile number exists */
if (user.mobileNumber) {
  try {
    const sendSMS = require("../services/smsService");
    const smsMsg = `🎁 NagarVaani: Redeemed "${name}" for ${cost} points! Balance: ${user.points + user.creditPoints} pts. Thank you!`;
    await sendSMS(user.mobileNumber, smsMsg);
    console.log(`✅ Reward SMS sent to ${user.mobileNumber}`);
  } catch (smsErr) {
    console.warn(`⚠️ Failed to send reward SMS: ${smsErr.message}`);
  }
}

res.json({message:"Reward redeemed successfully"});

}catch(error){

res.status(500).json({message:error.message});

}

};
