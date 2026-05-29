const axios = require("axios");
const fs = require("fs");
const path = require("path");

async function detectIssue(imagePath) {
    try {
        // Read image file as binary
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

        // Create FormData for file upload
        const form = new FormData();
        const fileBuffer = fs.readFileSync(imagePath);
        const blob = new Blob([fileBuffer]);
        form.append('image', blob, path.basename(imagePath));

        // Send to Python API
        const response = await axios.post(
            "http://localhost:8000/detect",
            form,
            {
                headers: form.getHeaders ? form.getHeaders() : {
                    'Content-Type': 'multipart/form-data'
                },
                timeout: 30000
            }
        );

        // Return response with normalized format
        return {
            success: response.data.success !== false,
            issueType: response.data.issueType || "Unknown",
            detectedObject: response.data.detectedObject || response.data.issueType || "Unknown",
            confidence: response.data.confidence || 0,
            source: response.data.source || "model"
        };

    } catch (error) {
        console.log("[WARNING] AI Detection Error:", error.message);
        console.log("[INFO] Model not available - classification failed");
        
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