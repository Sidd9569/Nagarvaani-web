const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const sendSMS = require("../services/smsService");

// Generate random OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ============================
// MOBILE REGISTRATION: SEND OTP TO MOBILE
// ============================
exports.sendUnifiedOTP = async (req, res) => {
  try {
    const mobileNumberRaw = req.body.mobileNumber || "";
    const mobileNumber = mobileNumberRaw.toString().replace(/\D/g, "");

    console.log("sendUnifiedOTP body:", req.body, "normalized mobile:", mobileNumber);

    if (!mobileNumber) {
      return res.status(400).json({
        message: "Mobile number is required"
      });
    }

    // Validate mobile number format
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(mobileNumber)) {
      return res.status(400).json({
        message: "Invalid mobile number format"
      });
    }

    // Check if mobile already exists and is fully registered
    const existingMobileUser = await User.findOne({ mobileNumber, password: { $exists: true } });
    if (existingMobileUser) {
      return res.status(400).json({
        message: "Mobile number already registered"
      });
    }

    // Generate mobile OTP
    const mobileOTP = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // Valid for 10 minutes

    // Create or update user session for mobile OTP verification
    await User.updateOne(
      { mobileNumber },
      {
        mobileNumber,
        mobileOTP,
        mobileOTPExpiry: otpExpiry,
        isMobileVerified: false
      },
      { upsert: true }
    );

    // Send only mobile OTP
    console.log(`DEBUG: About to call sendSMS with ${mobileNumber} and OTP ${mobileOTP}`);
    const smsResult = await sendSMS(mobileNumber, mobileOTP);
    console.log(`DEBUG: sendSMS returned:`, smsResult);

    console.log(`Mobile OTP sent to ${mobileNumber}: ${mobileOTP}`);

    // For development: include OTP in response if using mock service
    const response = {
      message: smsResult.isDevelopment
        ? `OTP sent to your mobile number (Development mode - OTP: ${mobileOTP})`
        : "OTP sent to your mobile number"
    };

    if (smsResult.isDevelopment) {
      response.otp = mobileOTP; // Include OTP for development testing
      response.isDevelopment = true;
    }

    res.json(response);

  } catch (error) {
    console.error("Send Unified OTP Error:", error);
    res.status(500).json({
      message: error.message || "Server error"
    });
  }
};

// ============================
// MOBILE REGISTRATION: VERIFY MOBILE OTP
// ============================
exports.verifyUnifiedOTP = async (req, res) => {
  try {
    const { mobileNumber, mobileOTP } = req.body;

    if (!mobileNumber || !mobileOTP) {
      return res.status(400).json({
        message: "Mobile number and OTP are required"
      });
    }

    // Find user by mobile number
    const user = await User.findOne({ mobileNumber });

    if (!user) {
      return res.status(400).json({
        message: "Verification session not found. Please start over."
      });
    }

    // Check if mobile OTP expired
    if (new Date() > user.mobileOTPExpiry) {
      return res.status(400).json({
        message: "Mobile OTP expired"
      });
    }

    // Check if OTP matches
    if (user.mobileOTP !== mobileOTP) {
      return res.status(400).json({
        message: "Invalid mobile OTP"
      });
    }

    // Mark mobile as verified
    user.isMobileVerified = true;
    user.mobileOTP = null;
    user.mobileOTPExpiry = null;
    await user.save();

    console.log(`Mobile verified for ${mobileNumber}`);

    res.json({
      message: "Mobile OTP verified successfully"
    });

  } catch (error) {
    console.error("Verify Unified OTP Error:", error);
    res.status(500).json({
      message: "Server error"
    });
  }
};

// ============================
// COMPLETE REGISTRATION (UNIFIED FLOW)
// ============================
exports.completeRegistration = async (req, res) => {
  try {
    const { email, name, password, city, mobileNumber } = req.body;

    if (!email || !name || !password || !mobileNumber) {
      return res.status(400).json({
        message: "Please fill all required fields"
      });
    }

    // Check if mobile is verified
    const user = await User.findOne({
      mobileNumber,
      isMobileVerified: true
    });

    if (!user) {
      return res.status(400).json({
        message: "Please verify your mobile number first"
      });
    }

    // Prevent duplicate email registration
    const existingEmailUser = await User.findOne({ email, password: { $exists: true } });
    if (existingEmailUser) {
      return res.status(400).json({
        message: "Email already registered"
      });
    }

    // Check if user already has password (fully registered)
    if (user.password) {
      return res.status(400).json({
        message: "User already registered"
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user with complete details
    user.email = email;
    user.name = name;
    user.password = hashedPassword;
    user.city = city || "";
    user.isVerified = true;
    await user.save();

    console.log("Registration completed for:", user.email);

    res.json({
      message: "Registration successful"
    });

  } catch (error) {
    console.error("Complete Registration Error:", error);
    res.status(500).json({
      message: "Server error"
    });
  }
};

// ============================
// LOGIN
// ============================
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password required"
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.json({
        message: "User not found"
      });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.json({
        message: "Incorrect password"
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    console.log("User logged in:", user.email);

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        city: user.city
      }
    });

  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({
      message: "Server error"
    });
  }
};