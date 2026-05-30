const express = require("express");
const router = express.Router();
const https = require("https");

const issueController = require("../controllers/issueController");
const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

// ======================================================
// GEOCODING (OpenStreetMap Nominatim - NO API KEY)
// ======================================================

router.get("/geocode", (req, res) => {
  try {
    const { address } = req.query;

    if (!address) {
      return res.status(400).json({
        success: false,
        error: "Address parameter required"
      });
    }

    const nominatimUrl =
      `https://nominatim.openstreetmap.org/search` +
      `?q=${encodeURIComponent(address)}` +
      `&format=json&limit=5`;

    https
      .get(
        nominatimUrl,
        {
          headers: {
            "User-Agent": "NagarVaani/1.0"
          }
        },
        (response) => {
          let data = "";

          response.on("data", (chunk) => {
            data += chunk;
          });

          response.on("end", () => {
            try {
              const results = JSON.parse(data);

              if (!results || results.length === 0) {
                return res.json({
                  success: true,
                  results: []
                });
              }

              const formatted = results.map((place) => ({
                latitude: parseFloat(place.lat),
                longitude: parseFloat(place.lon),
                place_name:
                  place.name || "Unknown",
                formatted_address:
                  place.display_name
              }));

              return res.json({
                success: true,
                results: formatted
              });

            } catch (err) {
              return res.status(500).json({
                success: false,
                error: "Failed to parse geocoding response"
              });
            }
          });
        }
      )
      .on("error", (err) => {
        return res.status(500).json({
          success: false,
          error: "Geocoding request failed",
          details: err.message
        });
      });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ======================================================
// ISSUE ROUTES
// ======================================================

// Report issue (with image upload)
router.post(
  "/report",
  authMiddleware,
  upload.single("image"),
  issueController.reportIssue
);

// AI detection (image → issue type)
router.post(
  "/detect",
  upload.single("image"),
  issueController.detectIssueType
);

// Vote issue
router.post(
  "/vote/:id",
  authMiddleware,
  issueController.voteIssue
);

// Resolve issue
router.put(
  "/resolve/:id",
  authMiddleware,
  issueController.resolveIssue
);

// Get all issues
router.get(
  "/",
  issueController.getIssues
);

// Get logged-in user's issues
router.get(
  "/user/my-issues",
  authMiddleware,
  issueController.getUserIssues
);

module.exports = router;
