const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");

// Mobile OTP routes
router.post("/send-unified-otp", authController.sendUnifiedOTP);
router.post("/verify-unified-otp", authController.verifyUnifiedOTP);

// Registration and login
router.post("/register", authController.completeRegistration);
router.post("/login", authController.loginUser);

module.exports = router;