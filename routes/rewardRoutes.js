const express = require("express");
const router = express.Router();

const { getRewards, redeemReward, awardCreditPoints, getUserRewards } = require("../controllers/rewardController");

const authMiddleware = require("../middleware/authMiddleware");

/* Award credit points (admin) */

router.post("/award", authMiddleware, awardCreditPoints);

/* Get reward list */

router.get("/", getRewards);

/* Get user's redeemed rewards */

router.get("/mine", authMiddleware, getUserRewards);

/* Redeem reward */

router.post("/redeem", authMiddleware, redeemReward);

module.exports = router;
