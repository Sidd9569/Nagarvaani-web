const express = require("express");
const router = express.Router();
const https = require("https");
const url = require("url");

const { reportIssue, getIssues, detectIssueType, resolveIssue, voteIssue } = require("../controllers/issueController");

const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

/* Geocoding API - Get coordinates from address using OpenStreetMap Nominatim */
router.get("/geocode", (req, res) => {
  try {
    const { address } = req.query;
    
    if (!address) {
      return res.status(400).json({ error: "Address parameter required" });
    }

    // Using OpenStreetMap Nominatim (free, reliable, no API key needed)
    // Proxied through backend to avoid CORS issues
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=5`;

    console.log(`🔍 Geocoding request for: "${address}"`);
    console.log(`📍 Calling Nominatim API: ${nominatimUrl}`);

    https.get(nominatimUrl, {
      headers: {
        'User-Agent': 'NagarVaani/1.0 (+http://localhost:5000)'
      }
    }, (response) => {
      let data = "";
      
      console.log(`Nominatim Response Status: ${response.statusCode}`);

      response.on("data", (chunk) => {
        data += chunk;
      });

      response.on("end", () => {
        try {
          const results = JSON.parse(data);
          
          if (results && results.length > 0) {
            // Transform Nominatim response
            const transformedResults = results.map(place => ({
              latitude: parseFloat(place.lat),
              longitude: parseFloat(place.lon),
              place_name: place.name || place.address,
              formatted_address: place.display_name
            }));
            
            console.log(`✅ Found ${transformedResults.length} location(s)`);
            res.json({ results: transformedResults });
          } else {
            console.log("❌ No results found");
            res.json({ results: [], message: "No locations found" });
          }
        } catch (e) {
          console.error("❌ Error parsing response:", e.message);
          res.status(500).json({ error: "Invalid response", details: e.message });
        }
      });
    }).on("error", (error) => {
      console.error("❌ API error:", error);
      res.status(500).json({ error: "Geocoding failed", details: error.message });
    });

  } catch (error) {
    console.error("❌ Geocoding error:", error);
    res.status(500).json({ error: "Geocoding failed", details: error.message });
  }
});

/* Report issue */

router.post("/report", authMiddleware, upload.single("image"), reportIssue);

/* Detect issue type from image */

router.post("/detect", upload.single("image"), detectIssueType);

/* Vote on issue (agree that problem is genuine) */

router.post("/vote/:id", authMiddleware, voteIssue);

/* Mark issue as resolved */

router.put("/resolve/:id", authMiddleware, resolveIssue);

/* Get all issues */

router.get("/", getIssues);

/* Get user's issues */

router.get("/user/my-issues", authMiddleware, require("../controllers/issueController").getUserIssues);

module.exports = router;