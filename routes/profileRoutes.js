const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const authMiddleware = require("../middleware/authMiddleware");
const { getProfile, updateProfile } = require("../controllers/profileController");

// Profile image upload config
const profileStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(__dirname, "..", "uploads", "profiles");
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const uniqueName = "profile-" + req.user.id + "-" + Date.now() + ext;
    cb(null, uniqueName);
  }
});

const profileUpload = multer({
  storage: profileStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/jpg", "image/gif", "image/webp"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed (jpeg, png, gif, webp)"));
    }
  }
});

/* Get profile */
router.get("/", authMiddleware, getProfile);

/* Update profile (with optional image) */
router.put("/update", authMiddleware, (req, res, next) => {
  profileUpload.single("avatar")(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: "File too large. Maximum size is 5MB." });
        }
        return res.status(400).json({ error: err.message });
      }
      return res.status(400).json({ error: err.message });
    }
    next();
  });
}, updateProfile);

module.exports = router;