const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String
  },
  email: {
    type: String,
    unique: true,
    sparse: true
  },
  password: {
    type: String
  },
  mobileNumber: {
    type: String,
    unique: true,
    sparse: true
  },
  city: {
    type: String
  },
  avatar: {
    type: String,
    default: null
  },
  bio: {
    type: String,
    default: ""
  },
  points: {
    type: Number,
    default: 0
  },
  creditPoints: {
    type: Number,
    default: 0
  },
  reportsSubmitted: {
    type: Number,
    default: 0
  },
  otp: {
    type: String,
    default: null
  },
  otpExpiry: {
    type: Date,
    default: null
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  mobileOTP: {
    type: String,
    default: null
  },
  mobileOTPExpiry: {
    type: Date,
    default: null
  },
  isMobileVerified: {
    type: Boolean,
    default: false
  },
  redeemedRewards: {
    type: [Number],
    default: []
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("User", userSchema);