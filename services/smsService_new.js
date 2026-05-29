// ============================
// SMS OTP SERVICE - TWILIO INTEGRATION
// ============================
require('dotenv').config();

console.log("\n🔧 [SMS SERVICE] Initializing...");
console.log("Twilio Account SID:", process.env.TWILIO_ACCOUNT_SID ? "✓ Set" : "❌ Not set");
console.log("Twilio Auth Token:", process.env.TWILIO_AUTH_TOKEN ? "✓ Set" : "❌ Not set");
console.log("Twilio Phone Number:", process.env.TWILIO_PHONE_NUMBER || "❌ Not set");

let twilioClient = null;

try {
  // Always try to initialize Twilio if credentials exist
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) {
    const twilio = require('twilio');
    twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    console.log("✅ Twilio client initialized successfully");
  } else {
    console.log("⚠️  Missing Twilio credentials");
  }
} catch (error) {
  console.error("❌ Error initializing Twilio:", error.message);
  twilioClient = null;
}

const sendSMS = async (phoneNumber, otp) => {
  try {
    // Format phone number
    const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;

    console.log(`\n📱 [SMS] Sending OTP to ${formattedPhone}: ${otp}`);
    console.log(`   Twilio Client Status: ${twilioClient ? "ACTIVE" : "INACTIVE"}`);

    if (!twilioClient) {
      console.log("   → Using MOCK SMS (Twilio not available)");
      return {
        success: true,
        message: `(Mock) OTP sent to ${formattedPhone}`,
        isDevelopment: true,
        otp: otp,
        service: "mock"
      };
    }

    // Send via Twilio
    try {
      console.log("   → Attempting Twilio send...");
      const message = await twilioClient.messages.create({
        body: `Your NagarVaani OTP is: ${otp}. Valid for 10 minutes. Do not share this OTP with anyone.`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: formattedPhone
      });

      console.log(`   ✅ SMS sent successfully!`);
      console.log(`   SID: ${message.sid}`);

      return {
        success: true,
        message: `OTP sent to ${formattedPhone}`,
        messageSid: message.sid,
        isDevelopment: false,
        service: "twilio"
      };
    } catch (error) {
      console.error(`   ❌ Twilio Error (${error.code}):`, error.message);

      // If it's a trial account restriction, return helpful message
      if (error.message.includes("unverified")) {
        console.log("   → Number must be verified in Twilio console (trial account)");
      }

      return {
        success: false,
        message: `Twilio Error: ${error.message}`,
        isDevelopment: true,
        otp: otp,
        error: error.message,
        service: "twilio_error"
      };
    }
  } catch (error) {
    console.error("❌ SMS Service Error:", error.message);
    throw error;
  }
};

module.exports = sendSMS;
