const express = require("express");
const router = express.Router();

const { getStats, getLeaderboard } = require("../controllers/dashboardController");

const authMiddleware = require("../middleware/authMiddleware");

/* Dashboard stats */

router.get("/stats", authMiddleware, getStats);

/* Leaderboard */

router.get("/leaderboard", getLeaderboard);

module.exports = router;