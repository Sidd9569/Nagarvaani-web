const axios = require("axios");
const fs = require("fs");
const path = require("path");
const FormData = require("form-data");

// PythonAnywhere AI API URL
const AI_API_URL =
  process.env.AI_API_URL ||
  "https://sidd9569.pythonanywhere.com";

async function detectIssue(imagePath) {
  try {
    // Check if image exists
    if (!fs.existsSync(imagePath)) {
      console.error("[ERROR] Image file not found:", imagePath);

      return {
        success: false,
        detectedObject: "Unknown",
        issueType: "Unknown",
        confidence: 0,
        source: "error",
      };
    }

    // Create form data
    const form = new FormData();

    form.append(
      "image",
      fs.createReadStream(imagePath),
      path.basename(imagePath)
    );

    console.log(
      `[AI] Sending image to ${AI_API_URL}/detect`
    );

    const response = await axios.post(
      `${AI_API_URL}/detect`,
      form,
      {
        headers: {
          ...form.getHeaders(),
        },
        timeout: 30000,
      }
    );

    console.log("[AI] Response:", response.data);

    return {
      success: response.data.success !== false,
      issueType: response.data.issueType || "Unknown",
      detectedObject:
        response.data.detectedObject ||
        response.data.issueType ||
        "Unknown",
      confidence: response.data.confidence || 0,
      source: response.data.source || "model",
    };
  } catch (error) {
    console.error(
      "[AI ERROR]",
      error.response?.data || error.message
    );

    return {
      success: false,
      issueType: "Unknown",
      detectedObject: "Unknown",
      confidence: 0,
      source: "error",
    };
  }
}

module.exports = detectIssue;
