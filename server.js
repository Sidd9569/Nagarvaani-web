const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();

// ================= MIDDLEWARE =================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// static files (css, js, images)
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));


// ================= DATABASE =================
async function startMongo() {
  let uri = process.env.MONGO_URI;
  const username = process.env.MONGO_USERNAME;
  const password = process.env.MONGO_PASSWORD;
  
  if (!uri) {
    console.error("❌ MONGO_URI is missing in environment/.env");
    process.exit(1);
  }
  
  // If using direct connection (mongodb://) and credentials are separate, inject them
  if (uri.startsWith('mongodb://') && username && password && !uri.includes('@')) {
    // Insert credentials before the host
    const urlParts = uri.match(/^(mongodb:\/\/)([^?]+)(.*)$/);
    if (urlParts) {
      uri = `${urlParts[1]}${encodeURIComponent(username)}:${encodeURIComponent(password)}@${urlParts[2]}${urlParts[3]}`;
    }
  }

  // Avoid printing credentials; keep it short.
  const maskedHost = String(uri).replace(
    /^(mongodb\+srv:\/\/[^@]+@)?([^/?#]+).*$/i,
    (_m, _creds, host) => host
  );

  console.log(`🔌 Connecting to MongoDB...`);

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000, // 10 second timeout
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000
    });
    console.log(`✅ MongoDB Connected (${maskedHost})`);
    return true;
  } catch (err) {
    console.error("❌ MongoDB connection failed.");
    console.error("   Error:", err?.message);
    console.error("   Code:", err?.code);
    console.error("   Hostname:", err?.hostname || err?.cause?.hostname);

    // SRV/DNS hint
    if (String(err?.message || '').includes('querySrv') || err?.code === 'ENOTFOUND') {
      console.error(
        "   Tip: Atlas SRV lookup failed (mongodb+srv://). Update MONGO_URI to the non-SRV form (mongodb://host:27017/...) and restart."
      );
    }

    // Network/timeout hint
    if (err?.code === 'ETIMEDOUT' || err?.code === 'ECONNREFUSED') {
      console.error("   Tip: Connection timed out or was refused. Check your network and MongoDB Atlas IP whitelist.");
    }

    return false;
  }
}


// ================= ROUTES =================
const authRoutes = require("./routes/authRoutes");
const issueRoutes = require("./routes/issueRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const rewardRoutes = require("./routes/rewardRoutes");
const profileRoutes = require("./routes/profileRoutes");
const contactRoutes = require("./routes/contactRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/issues", issueRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/rewards", rewardRoutes);
app.use("/api/contact", contactRoutes);


// ================= HTML PAGES =================

// Home page
app.get("/", (req, res) => {
res.sendFile(path.join(__dirname, "views", "home.html"));
});

// Login page
app.get("/login", (req, res) => {
res.sendFile(path.join(__dirname, "views", "login.html"));
});

// Register page
app.get("/register", (req, res) => {
res.sendFile(path.join(__dirname, "views", "register.html"));
});

// Report Issue page
app.get("/report", (req, res) => {
res.sendFile(path.join(__dirname, "views", "report.html"));
});

// Dashboard page
app.get("/dashboard", (req, res) => {
res.sendFile(path.join(__dirname, "views", "dashboard.html"));
});

// Leaderboard page
app.get("/leaderboard", (req, res) => {
res.sendFile(path.join(__dirname, "views", "leaderboard.html"));
});

// Rewards page
app.get("/rewards", (req, res) => {
res.sendFile(path.join(__dirname, "views", "rewards.html"));
});


// Profile page
app.get("/profile", (req, res) => {
res.sendFile(path.join(__dirname, "views", "profile.html"));
});


// ================= SERVER =================
const PORT = process.env.PORT || 5000;

// Start MongoDB connection first, then start server
startMongo().then((success) => {
  if (success) {
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } else {
    console.error("❌ Failed to connect to MongoDB. Server cannot start.");
    console.log("💡 Starting server in limited mode (without database)...");
    // Start server anyway but warn about limited functionality
    app.listen(PORT, () => {
      console.log(`⚠️ Server running on http://localhost:${PORT} (LIMITED MODE - No Database)`);
    });
  }
}).catch((err) => {
  console.error("❌ Unexpected error during startup:", err);
  process.exit(1);
});
