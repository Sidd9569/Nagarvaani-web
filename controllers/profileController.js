const User = require("../models/User");
const fs = require("fs");
const path = require("path");

/* -------- Get Profile -------- */

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password -otp -otpExpiry -mobileOTP -mobileOTPExpiry");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const totalScore = (user.points || 0) + (user.creditPoints || 0);

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      mobileNumber: user.mobileNumber,
      city: user.city,
      avatar: user.avatar,
      bio: user.bio,
      points: user.points || 0,
      creditPoints: user.creditPoints || 0,
      totalScore,
      reportsSubmitted: user.reportsSubmitted || 0,
      createdAt: user.createdAt
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* -------- Update Profile -------- */

exports.updateProfile = async (req, res) => {
  try {
    const { name, city, bio } = req.body;
    const updateData = {};

    if (name) updateData.name = name;
    if (city !== undefined) updateData.city = city;
    if (bio !== undefined) updateData.bio = bio;

    // Handle avatar upload
    if (req.file) {
      console.log("✅ Avatar file received:", req.file.filename);
      // Delete old avatar if exists
      const oldUser = await User.findById(req.user.id);
      if (oldUser && oldUser.avatar) {
        const oldPath = path.join(__dirname, "..", oldUser.avatar);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
          console.log("🗑️ Deleted old avatar:", oldUser.avatar);
        }
      }
      updateData.avatar = "uploads/profiles/" + req.file.filename;
    } else {
      console.log("⚠️ No file received in request. Content-Type:", req.headers['content-type']);
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select("-password -otp -otpExpiry -mobileOTP -mobileOTPExpiry");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const totalScore = (user.points || 0) + (user.creditPoints || 0);

    res.json({
      message: "Profile updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        mobileNumber: user.mobileNumber,
        city: user.city,
        avatar: user.avatar,
        bio: user.bio,
        points: user.points || 0,
        creditPoints: user.creditPoints || 0,
        totalScore,
        reportsSubmitted: user.reportsSubmitted || 0
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};