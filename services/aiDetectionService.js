const axios = require("axios");
const fs = require("fs");
const path = require("path");
const FormData = require("form-data");

const AI_API_URL =
    process.env.AI_API_URL ||
    "https://my-backend-8w9s.onrender.com";

async function detectIssue(imagePath) {
    try {
        if (!fs.existsSync(imagePath)) {
            console.log("[ERROR] Image file not found:", imagePath);

            return {
                success: false,
                detectedObject: "Unknown",
                issueType: "Unknown",
                confidence: 0,
                source: "error"
            };
        }

        const form = new FormData();

        form.append(
            "image",
            fs.createReadStream(imagePath)
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

        return {
            success: response.data.success !== false,
            issueType: response.data.issueType || "Unknown",
            detectedObject:
                response.data.detectedObject ||
                response.data.issueType ||
                "Unknown",
            confidence: response.data.confidence || 0,
            source: response.data.source || "model"
        };
    } catch (error) {
        console.log(
            "[WARNING] AI Detection Error:",
            error.response?.data || error.message
        );

        return {
            success: false,
            issueType: "Unknown",
            detectedObject: "Unknown",
            confidence: 0,
            source: "error"
        };
    }
}

module.exports = detectIssue;
