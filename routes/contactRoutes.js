const express = require("express");
const router = express.Router();
const Contact = require("../models/Contact");

// POST /api/contact - Save contact form submission
router.post("/", async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    if (!name || !email || !phone || !subject || !message) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const contact = new Contact({ name, email, phone, subject, message });
    await contact.save();

    res.status(201).json({ message: "Message sent successfully!" });
  } catch (error) {
    console.error("Contact form error:", error);
    res.status(500).json({ error: "Failed to save message" });
  }
});

module.exports = router;