const Issue = require("../models/Issue");
const User = require("../models/User");
const generateTicket = require("../utils/generateTicket");
const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const { sendIssueReportEmail, sendAdminNotification, sendIssueResolvedEmail } = require("../services/emailService");

const issueTypeMapping = {
  pothole: "Pothole",
  pothole_mark: "Pothole",
  "pothole mark": "Pothole",
  garbage: "Garbage",
  trash: "Garbage",
  litter: "Garbage",
  streetlight: "Broken Streetlight",
  street_light: "Broken Streetlight",
  "street light": "Broken Streetlight",
  broken: "Broken Streetlight",
  broken_light: "Broken Streetlight",
  "broken light": "Broken Streetlight",
  light: "Broken Streetlight",
  manhole: "Manhole",
  manhole_cover: "Manhole",
  "manhole cover": "Manhole",
  electric: "Electric Fault",
  electrical: "Electric Fault",
  electrical_fault: "Electric Fault",
  wire: "Electric Fault",
  cable: "Electric Fault",
  power_line: "Electric Fault",
  "power line": "Electric Fault",
  damage: "Pothole",
  road_damage: "Pothole",
  "road damage": "Pothole",
};

function normalizeIssueType(rawValue) {
  if (!rawValue) {
    return "Garbage";
  }

  const cleanedValue = String(rawValue).trim().toLowerCase();
  if (issueTypeMapping[cleanedValue]) {
    return issueTypeMapping[cleanedValue];
  }

  const normalizedKey = cleanedValue.replace(/[\s-]+/g, "_");
  if (issueTypeMapping[normalizedKey]) {
    return issueTypeMapping[normalizedKey];
  }

  for (const [key, value] of Object.entries(issueTypeMapping)) {
    if (cleanedValue.includes(key)) {
      return value;
    }
  }

  return "Garbage";
}

/* -------- Detect Issue Type from Image -------- */

exports.detectIssueType = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image uploaded" });
    }

    // Send image to Python classification service
    const form = new FormData();
    form.append("image", fs.createReadStream(req.file.path), req.file.filename);

    const response = await axios.post("http://localhost:8000/detect", form, {
      headers: form.getHeaders(),
    });

    const detectedObject = response.data.detectedObject || response.data.issueType;
    const confidence = response.data.confidence || 0;
    const mappedIssueType = normalizeIssueType(response.data.issueType || detectedObject);

    res.json({
      success: true,
      detectedObject: detectedObject,
      confidence: confidence,
      issueType: mappedIssueType,
      source: response.data.source || "model",
    });
  } catch (error) {
    console.log("Detection Error:", error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      issueType: "Garbage",
    });
  }
};

/* -------- Report Issue -------- */

exports.reportIssue = async (req,res)=>{

try{

const {issueType,description,latitude,longitude,priority} = req.body;

const ticketId = generateTicket();

const issue = new Issue({

ticketId,
issueType,
description,
latitude,
longitude,
priority,
image:req.file ? req.file.filename : null,
reportedBy:req.user.id

});

await issue.save();

/* update user points */

const user = await User.findById(req.user.id);

if (!user) {
  // Delete the issue since we can't update the user
  await Issue.findByIdAndDelete(issue._id);
  return res.status(404).json({ error: "User not found" });
}

user.points += 10;
user.reportsSubmitted += 1;

await user.save();

/* Send confirmation email to user */
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
  console.log(`✅ Confirmation email sent to ${user.email}`);
} catch (emailError) {
  console.warn(`⚠️ Failed to send email to ${user.email}:`, emailError.message);
  // Don't fail the entire request if email fails
}

/* Send admin notification email */
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
  console.log(`✅ Admin notification sent for ticket ${ticketId}`);
} catch (adminEmailError) {
  console.warn(`⚠️ Failed to send admin notification:`, adminEmailError.message);
  // Don't fail the entire request if admin email fails
}

res.json({
message:"Issue reported successfully",
ticketId
});

}catch(error){

res.status(500).json({message:error.message});

}

};

/* -------- Get All Issues -------- */

exports.getIssues = async (req,res)=>{

try{

const issues = await Issue.find().populate("reportedBy", "name email mobileNumber");

res.json(issues);

}catch(error){

res.status(500).json({message:error.message});

}

};

/* -------- Vote on Issue (Agree that it's genuine) -------- */

exports.voteIssue = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);

    if (!issue) {
      return res.status(404).json({ error: "Issue not found" });
    }

    // Check if user already voted
    const userIdStr = req.user.id.toString();
    const alreadyVoted = issue.votes.some(v => v.toString() === userIdStr);

    if (alreadyVoted) {
      // Remove vote (unvote)
      issue.votes = issue.votes.filter(v => v.toString() !== userIdStr);
      await issue.save();
      return res.json({
        message: "Vote removed",
        votes: issue.votes.length,
        voted: false,
        ticketId: issue.ticketId
      });
    }

    // Add vote
    issue.votes.push(req.user.id);
    await issue.save();

    console.log(`✅ Vote added to issue ${issue.ticketId}. Total votes: ${issue.votes.length}`);

    res.json({
      message: "Vote recorded",
      votes: issue.votes.length,
      voted: true,
      ticketId: issue.ticketId
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* -------- Resolve Issue (Mark as Resolved) -------- */

exports.resolveIssue = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id).populate("reportedBy", "name email");

    if (!issue) {
      return res.status(404).json({ error: "Issue not found" });
    }

    // Only the reporter who created this issue can resolve it
    // reportedBy is stored as ObjectId in DB; after populate it becomes a document. Handle both cases safely.
    const reporterId = issue.reportedBy && (issue.reportedBy._id || issue.reportedBy);

    if (!reporterId || reporterId.toString() !== req.user.id.toString()) {
      console.log('Resolve denied:', {
        issueId: req.params.id,
        reqUserId: req.user.id,
        issueReportedBy: reporterId ? reporterId.toString() : null,
        rawIssueReportedByType: issue.reportedBy ? typeof issue.reportedBy : null
      });
      return res.status(403).json({ error: "You can only resolve your own reported issues" });
    }



    // Perform resolve
    issue.status = "Resolved";
    await issue.save();

    console.log(`✅ Issue ${issue.ticketId} marked as resolved by ${req.user.id}`);



    /* Send resolved confirmation email to the reporter */
    if (issue.reportedBy && issue.reportedBy.email) {
      try {
        await sendIssueResolvedEmail(
          issue.reportedBy.email,
          issue.reportedBy.name,
          issue.ticketId,
          issue.issueType,
          issue.description
        );
        console.log(`✅ Resolved email sent to ${issue.reportedBy.email}`);
      } catch (emailError) {
        console.warn(`⚠️ Failed to send resolved email:`, emailError.message);
      }
    }

    res.json({
      message: "Issue marked as resolved",
      ticketId: issue.ticketId,
      status: issue.status
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* -------- Get User's Issues -------- */

exports.getUserIssues = async (req, res) => {

try {

const issues = await Issue.find({ reportedBy: req.user.id }).populate("reportedBy", "name email mobileNumber");

res.json(issues);

} catch(error) {

res.status(500).json({message:error.message});

}

};
