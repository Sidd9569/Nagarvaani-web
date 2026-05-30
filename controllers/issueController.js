const Issue = require("../models/Issue");
const User = require("../models/User");
const generateTicket = require("../utils/generateTicket");

const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");

const {
  sendIssueReportEmail,
  sendAdminNotification,
  sendIssueResolvedEmail
} = require("../services/emailService");

// ======================================
// AI SERVICE URL
// ======================================

const AI_API_URL =
  process.env.AI_API_URL ||
  "https://my-backend-8w9s.onrender.com";

// ======================================
// ISSUE TYPE NORMALIZATION
// ======================================

const issueTypeMapping = {
  pothole: "Pothole",
  pothole_mark: "Pothole",

  garbage: "Garbage",
  trash: "Garbage",
  litter: "Garbage",

  streetlight: "Broken Streetlight",
  street_light: "Broken Streetlight",
  broken_light: "Broken Streetlight",
  light: "Broken Streetlight",

  manhole: "Manhole",
  manhole_cover: "Manhole",

  electric: "Electrical Fault",
  electrical: "Electrical Fault",
  electrical_fault: "Electrical Fault",
  wire: "Electrical Fault",
  cable: "Electrical Fault",
  power_line: "Electrical Fault"
};

function normalizeIssueType(value) {
  if (!value) return "Garbage";

  const key = String(value)
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

  return issueTypeMapping[key] || "Garbage";
}

// ======================================
// AI IMAGE DETECTION
// ======================================

exports.detectIssueType = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No image uploaded"
      });
    }

    console.log("Image received:", req.file.filename);

    const form = new FormData();

    form.append(
      "image",
      fs.createReadStream(req.file.path),
      req.file.originalname
    );

    const response = await axios.post(
      `${AI_API_URL}/detect`,
      form,
      {
        headers: {
          ...form.getHeaders()
        },
        timeout: 30000
      }
    );

    console.log(
      "AI Response:",
      response.data
    );

    const detectedObject =
      response.data.detectedObject ||
      response.data.issueType ||
      "Unknown";

    const issueType =
      normalizeIssueType(
        response.data.issueType ||
        detectedObject
      );

    return res.status(200).json({
      success: true,
      detectedObject,
      issueType,
      confidence:
        response.data.confidence || 0,
      source:
        response.data.source ||
        "AI Model"
    });

  } catch (error) {

    console.error(
      "AI Detection Error:",
      error.response?.data ||
      error.message
    );

    return res.status(500).json({
      success: false,
      error:
        error.response?.data?.error ||
        error.message,
      issueType: "Garbage"
    });

  } finally {

    if (
      req.file &&
      req.file.path &&
      fs.existsSync(req.file.path)
    ) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (err) {
        console.log(
          "File cleanup error:",
          err.message
        );
      }
    }
  }
};

// ======================================
// REPORT ISSUE
// ======================================

exports.reportIssue = async (req, res) => {
  try {

    const {
      issueType,
      description,
      latitude,
      longitude,
      priority
    } = req.body;

    const ticketId = generateTicket();

    const issue = new Issue({
      ticketId,
      issueType,
      description,
      latitude,
      longitude,
      priority,
      image: req.file
        ? req.file.filename
        : null,
      reportedBy: req.user.id
    });

    await issue.save();

    const user =
      await User.findById(req.user.id);

    if (!user) {
      await Issue.findByIdAndDelete(
        issue._id
      );

      return res.status(404).json({
        error: "User not found"
      });
    }

    user.points += 10;
    user.reportsSubmitted += 1;

    await user.save();

    try {
      await sendIssueReportEmail(
        user.email,
        user.name,
        ticketId,
        issueType,
        description,
        latitude,
        longitude
      );
    } catch (err) {
      console.log(
        "Email Error:",
        err.message
      );
    }

    try {
      await sendAdminNotification(
        ticketId,
        issueType,
        description,
        latitude,
        longitude,
        priority,
        user.name,
        user.email,
        user.mobileNumber
      );
    } catch (err) {
      console.log(
        "Admin Email Error:",
        err.message
      );
    }

    return res.status(201).json({
      success: true,
      message:
        "Issue reported successfully",
      ticketId
    });

  } catch (error) {

    console.error(
      "Report Issue Error:",
      error
    );

    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
