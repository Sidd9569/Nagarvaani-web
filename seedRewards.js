const mongoose = require("mongoose");
require("dotenv").config();
const Reward = require("./models/Reward");

const rewards = [
  {
    rewardName: "Shopping Voucher",
    pointsRequired: 200,
    description: "Get a ₹500 shopping voucher valid at major online and offline stores.",
    image: null
  },
  {
    rewardName: "Fuel Discount",
    pointsRequired: 300,
    description: "Get ₹200 fuel discount voucher valid at Indian Oil, BPCL, and HPCL pumps.",
    image: null
  },
  {
    rewardName: "Metro Recharge",
    pointsRequired: 150,
    description: "Free metro recharge worth ₹100 for your daily commute.",
    image: null
  },
  {
    rewardName: "Movie Ticket",
    pointsRequired: 250,
    description: "Get one free movie ticket at PVR, INOX, or Cinepolis.",
    image: null
  },
  {
    rewardName: "Amazon Gift Card",
    pointsRequired: 500,
    description: "₹500 Amazon Gift Card to use on any purchase.",
    image: null
  },
  {
    rewardName: "Electricity Bill Discount",
    pointsRequired: 400,
    description: "Get ₹300 discount on your electricity bill payment.",
    image: null
  },
  {
    rewardName: "Swiggy Food Voucher",
    pointsRequired: 180,
    description: "₹150 Swiggy food voucher for your next order.",
    image: null
  },
  {
    rewardName: "Mobile Recharge",
    pointsRequired: 100,
    description: "Free ₹50 mobile recharge for any prepaid number.",
    image: null
  }
];

async function seedRewards() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to database");

    // Clear existing rewards
    await Reward.deleteMany({});
    console.log("🗑️ Cleared existing rewards");

    // Insert new rewards
    const result = await Reward.insertMany(rewards);
    console.log(`✅ ${result.length} rewards inserted successfully:`);
    result.forEach(r => console.log(`   - ${r.rewardName} (${r.pointsRequired} pts)`));

    await mongoose.disconnect();
    console.log("✅ Done! Database disconnected.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding rewards:", error.message);
    process.exit(1);
  }
}

seedRewards();