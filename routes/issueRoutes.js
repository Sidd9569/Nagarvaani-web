const express = require("express");
const router = express.Router();
const https = require("https");

const issueController = require("../controllers/issueController");
const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

// ======================================================
// GEOCODING (OpenStreetMap - Render SAFE)
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

    const url =
      `https://nominatim.openstreetmap.org/search` +
      `?q=${encodeURIComponent(address)}` +
      `&format=json&limit=5`;

    https
      .get(
        url,
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

              const formatted = (results || []).map((place) => ({
                latitude: parseFloat(place.lat),
                longitude: parseFloat(place.lon),
                place_name: place.name || "Unknown",
                formatted_address: place.display_name
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
// ISSUE ROUTES (Render SAFE)
// ======================================================

// Report issue
router.post(
  "/report",
  authMiddleware,
  upload.single("image"),
  issueController.reportIssue || ((req, res) => {
    return res.status(500).json({
      success: false,
      error: "reportIssue controller missing"
    });
  })
);

// AI detect issue type (FIXED SAFETY WRAPPER)
router.post(
  "/detect",
  upload.single("image"),
  issueController.detectIssueType || ((req, res) => {
    return res.status(500).json({
      success: false,
      error: "detectIssueType controller missing"
    });
  })
);

// Vote issue
router.post(
  "/vote/:id",
  authMiddleware,
  issueController.voteIssue || ((req, res) => {
    return res.status(500).json({
      success: false,
      error: "voteIssue controller missing"
    });
  })
);

// Resolve issue
router.put(
  "/resolve/:id",
  authMiddleware,
  issueController.resolveIssue || ((req, res) => {
    return res.status(500).json({
      success: false,
      error: "resolveIssue controller missing"
    });
  })
);

// Get all issues
router.get(
  "/",
  issueController.getIssues || ((req, res) => {
    return res.status(500).json({
      success: false,
      error: "getIssues controller missing"
    });
  })
);

// Get user issues
router.get(
  "/user/my-issues",
  authMiddleware,
  issueController.getUserIssues || ((req, res) => {
    return res.status(500).json({
      success: false,
      error: "getUserIssues controller missing"
    });
  })
);

module.exports = router;
