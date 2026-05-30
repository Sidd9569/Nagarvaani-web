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

// ============================
// AI SERVICE (RENDER READY)
// ============================

const AI_API_URL =
  process.env.AI_API_URL ||
  "https://my-backend-8w9s.onrender.com";

// ============================
// NORMALIZER
// ============================

function normalizeIssueType(value) {
  if (!value) return "Garbage";

  const key = String(value)
    .toLowerCase()
    .replace(/\s+/g, "_");

  const map = {
    pothole: "Pothole",
    garbage: "Garbage",
    trash: "Garbage",
    streetlight: "Broken Streetlight",
    street_light: "Broken Streetlight",
    manhole: "Manhole",
    electric: "Electrical Fault",
    electrical_fault: "Electrical Fault"
  };

  return map[key] || "Garbage";
}

// ============================
// DETECT ISSUE (AI)
// ============================

exports.detectIssueType = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No image uploaded"
      });
    }

    const form = new FormData();

    form.append(
      "image",
      fs.createReadStream(req.file.path)
    );

    const response = await axios.post(
      `${AI_API_URL}/detect`,
      form,
      {
        headers: form.getHeaders(),
        timeout: 30000
      }
    );

    const detected =
      response.data.detectedObject ||
      response.data.issueType ||
      "Unknown";

    return res.json({
      success: true,
      detectedObject: detected,
      issueType: normalizeIssueType(detected),
      confidence: response.data.confidence || 0,
      source: "AI"
    });

  } catch (err) {
    console.error("AI ERROR:", err.message);

    return res.status(500).json({
      success: false,
      error: "AI detection failed",
      issueType: "Garbage"
    });

  } finally {
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
  }
};

// ============================
// REPORT ISSUE
// ============================

exports.reportIssue = async (req, res) => {
  try {
    const { issueType, description, latitude, longitude, priority } = req.body;

    const ticketId = generateTicket();

    const issue = await Issue.create({
      ticketId,
      issueType,
      description,
      latitude,
      longitude,
      priority,
      image: req.file?.filename || null,
      reportedBy: req.user.id
    });

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.points += 10;
    user.reportsSubmitted += 1;
    await user.save();

    return res.status(201).json({
      success: true,
      ticketId,
      message: "Issue reported successfully"
    });

  } catch (err) {
    console.error("REPORT ERROR:", err.message);

    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// ============================
// GET ISSUES
// ============================

exports.getIssues = async (req, res) => {
  try {
    const issues = await Issue.find()
      .populate("reportedBy", "name email");

    res.json(issues);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ============================
// VOTE ISSUE
// ============================

exports.voteIssue = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);

    if (!issue) {
      return res.status(404).json({ error: "Not found" });
    }

    const userId = req.user.id.toString();

    const index = issue.votes.findIndex(v => v.toString() === userId);

    if (index >= 0) {
      issue.votes.splice(index, 1);
    } else {
      issue.votes.push(req.user.id);
    }

    await issue.save();

    res.json({
      votes: issue.votes.length,
      voted: index === -1
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ============================
// RESOLVE ISSUE
// ============================

exports.resolveIssue = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);

    if (!issue) {
      return res.status(404).json({ error: "Not found" });
    }

    issue.status = "Resolved";
    await issue.save();

    res.json({
      message: "Resolved",
      ticketId: issue.ticketId
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ============================
// USER ISSUES
// ============================

exports.getUserIssues = async (req, res) => {
  try {
    const issues = await Issue.find({
      reportedBy: req.user.id
    });

    res.json(issues);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
