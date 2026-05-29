// ============================
// SMS OTP SERVICE - TWILIO INTEGRATION
// ============================
require('dotenv').config();

console.log("🔧 SMS Service Loading...");
console.log("TWILIO_ACCOUNT_SID:", process.env.TWILIO_ACCOUNT_SID ? "✓ Set" : "❌ Not set");
console.log("TWILIO_AUTH_TOKEN:", process.env.TWILIO_AUTH_TOKEN ? "✓ Set" : "❌ Not set");
console.log("TWILIO_PHONE_NUMBER:", process.env.TWILIO_PHONE_NUMBER);

// Check if Twilio credentials are available and valid
const hasValidTwilioCredentials = () => {
  const hasSID = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_ACCOUNT_SID.startsWith('AC');
  const hasToken = process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_AUTH_TOKEN.length > 0;
  const hasPhone = process.env.TWILIO_PHONE_NUMBER && process.env.TWILIO_PHONE_NUMBER.startsWith('+');
  
  console.log("Credential Check:", { hasSID, hasToken, hasPhone });
  
  return hasSID && hasToken && hasPhone;
};

let twilioClient = null;

if (hasValidTwilioCredentials()) {
  try {
    const twilio = require('twilio');
    twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    console.log("✅ Twilio initialized with real credentials");
    console.log("✅ Twilio Phone Number:", process.env.TWILIO_PHONE_NUMBER);
    console.log("✅ twilioClient object exists:", typeof twilioClient);
  } catch (error) {
    console.error("❌ Twilio initialization failed:", error.message);
    twilioClient = null;
  }
} else {
  console.log("⚠️  Twilio credentials NOT properly configured");
  console.log("🔄 Using MOCK SMS service for development");
}

console.log("DEBUG: twilioClient is:", twilioClient ? "INITIALIZED" : "NULL");

const sendSMS = async (phoneNumber, otp) => {
  try {
    // Format phone number to E.164 format
    const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;

    console.log(`\n📱 [SMS SERVICE] Sending OTP to ${formattedPhone}: ${otp}`);
    console.log(`DEBUG: At send time, twilioClient is:`, twilioClient ? "SET" : "NULL");

    // If real Twilio credentials are available, send via Twilio
    if (twilioClient) {
      try {
        console.log("🔄 Attempting to send via Twilio...");
        console.log("   From:", process.env.TWILIO_PHONE_NUMBER);
        console.log("   To:", formattedPhone);
        
        const message = await twilioClient.messages.create({
          body: `Your NagarVaani OTP is: ${otp}. Valid for 10 minutes. Do not share this OTP with anyone.`,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: formattedPhone
        });

        console.log(`✅ Message sent successfully!`);
        console.log(`   SID: ${message.sid}`);
        console.log(`   Status: ${message.status}`);

        return {
          success: true,
          message: `OTP sent to ${formattedPhone}`,
          messageSid: message.sid,
          status: message.status,
          service: 'twilio'
        };
      } catch (twilioError) {
        console.error("\n❌ Twilio SMS Error:", twilioError.message);
        console.error("   Error Code:", twilioError.code);
        
        // Provide helpful guidance
        if (twilioError.code === 21211) {
          console.error("   → Invalid phone number format");
        }
        if (twilioError.message.includes('unverified')) {
          console.error("   → Phone number not verified in trial account");
          console.error("   → Add phone number to verified numbers in Twilio console");
        }
        if (twilioError.code === 20003) {
          console.error("   → Account suspended or no credits");
        }

        return {
          success: false,
          message: `Twilio Error: ${twilioError.message}`,
          isDevelopment: true,
          otp: otp,
          twilioError: twilioError.message,
          service: 'error'
        };
      }
    } else {
      // Mock SMS for development (when no real credentials)
      console.log(`⚠️  [MOCK SMS] Twilio not initialized`);
      console.log(`   OTP for ${formattedPhone}: ${otp}`);
      return {
        success: true,
        message: `(Mock) OTP sent to ${formattedPhone}`,
        isDevelopment: true,
        otp: otp,
        service: 'mock'
      };
    }
  } catch (error) {
    console.error("❌ SMS Send Error:", error.message);
    throw new Error(`Failed to send SMS: ${error.message}`);
  }
};

module.exports = sendSMS;