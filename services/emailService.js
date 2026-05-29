const nodemailer = require("nodemailer");

// Check if email credentials are configured
const hasValidEmailCredentials = () => {
  return process.env.EMAIL_USER && process.env.EMAIL_PASS &&
         process.env.EMAIL_USER !== 'your_email@gmail.com';
};

let transporter = null;

if (hasValidEmailCredentials()) {
  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
  console.log("✅ Email service initialized with real Gmail account");
} else {
  console.log("⚠️  Email credentials not configured. Using mock email service for development.");
}

/* Send Email */
async function sendEmail(to, subject, htmlContent, textContent = null) {
  if (!transporter) {
    // Mock email for development
    console.log("\n📧 [MOCK EMAIL]");
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body: ${textContent || htmlContent}`);
    console.log("\n");
    return { success: true, isDevelopment: true, message: "Mock email sent (development mode)" };
  }

  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: to,
    subject: subject,
    html: htmlContent,
    text: textContent
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email sent successfully:", info.response);
    return { success: true, message: "Email sent successfully", info };
  } catch (error) {
    console.error("❌ Email error:", error.message);
    throw error;
  }
}

/* Send Issue Report Confirmation Email */
async function sendIssueReportEmail(userEmail, userName, ticketId, issueType, description, latitude, longitude) {
  const subject = `🎫 Issue Report Confirmation - Ticket #${ticketId}`;
  
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                background-color: #f4f4f4;
                margin: 0;
                padding: 20px;
            }
            .container {
                max-width: 600px;
                margin: 0 auto;
                background-color: white;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                overflow: hidden;
            }
            .header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 30px;
                text-align: center;
            }
            .header h1 {
                margin: 0;
                font-size: 28px;
            }
            .header p {
                margin: 10px 0 0 0;
                opacity: 0.9;
            }
            .content {
                padding: 30px;
            }
            .ticket-info {
                background-color: #f9f9f9;
                border-left: 4px solid #667eea;
                padding: 15px;
                margin-bottom: 20px;
                border-radius: 4px;
            }
            .ticket-info h3 {
                margin: 0 0 10px 0;
                color: #667eea;
            }
            .ticket-detail {
                display: flex;
                justify-content: space-between;
                padding: 8px 0;
                border-bottom: 1px solid #eee;
            }
            .ticket-detail:last-child {
                border-bottom: none;
            }
            .ticket-label {
                font-weight: 600;
                color: #666;
                width: 40%;
            }
            .ticket-value {
                color: #333;
                word-break: break-word;
            }
            .status-badge {
                display: inline-block;
                background-color: #4caf50;
                color: white;
                padding: 8px 16px;
                border-radius: 20px;
                font-size: 14px;
                font-weight: bold;
                margin-top: 10px;
            }
            .points-info {
                background-color: #e8f5e9;
                border-left: 4px solid #4caf50;
                padding: 15px;
                margin: 20px 0;
                border-radius: 4px;
            }
            .points-info h3 {
                margin: 0 0 10px 0;
                color: #4caf50;
            }
            .next-steps {
                background-color: #e3f2fd;
                border-left: 4px solid #2196f3;
                padding: 15px;
                margin: 20px 0;
                border-radius: 4px;
            }
            .next-steps h3 {
                margin: 0 0 10px 0;
                color: #2196f3;
            }
            .next-steps ol {
                margin: 10px 0;
                padding-left: 20px;
            }
            .next-steps li {
                margin: 8px 0;
            }
            .location-map {
                margin-top: 15px;
                padding: 10px;
                background-color: #f5f5f5;
                border-radius: 4px;
                font-family: monospace;
                font-size: 12px;
            }
            .footer {
                background-color: #f9f9f9;
                padding: 20px;
                text-align: center;
                border-top: 1px solid #eee;
                font-size: 12px;
                color: #666;
            }
            .button {
                display: inline-block;
                background-color: #667eea;
                color: white;
                padding: 12px 24px;
                border-radius: 4px;
                text-decoration: none;
                margin-top: 15px;
                font-weight: bold;
            }
            .button:hover {
                background-color: #764ba2;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🎫 Issue Report Submitted</h1>
                <p>Thank you for making our city better!</p>
            </div>
            
            <div class="content">
                <p>Hi <strong>${userName}</strong>,</p>
                
                <p>Your civic issue report has been successfully submitted to NagarVaani. Our team will review and take necessary action.</p>
                
                <div class="ticket-info">
                    <h3>📋 Report Details</h3>
                    <div class="ticket-detail">
                        <span class="ticket-label">Ticket ID:</span>
                        <span class="ticket-value"><strong>${ticketId}</strong></span>
                    </div>
                    <div class="ticket-detail">
                        <span class="ticket-label">Issue Type:</span>
                        <span class="ticket-value">${issueType}</span>
                    </div>
                    <div class="ticket-detail">
                        <span class="ticket-label">Description:</span>
                        <span class="ticket-value">${description}</span>
                    </div>
                    <div class="ticket-detail">
                        <span class="ticket-label">Status:</span>
                        <span class="ticket-value">
                            <span class="status-badge">Pending Review</span>
                        </span>
                    </div>
                </div>
                
                <div class="location-map">
                    <strong>📍 Location Coordinates:</strong><br>
                    Latitude: ${parseFloat(latitude).toFixed(6)}<br>
                    Longitude: ${parseFloat(longitude).toFixed(6)}
                </div>
                
                <div class="points-info">
                    <h3>🏆 You Earned 10 Points!</h3>
                    <p>Thank you for contributing to civic improvement. Your points can be redeemed for rewards.</p>
                </div>
                
                <div class="next-steps">
                    <h3>📌 What Happens Next?</h3>
                    <ol>
                        <li>Our team reviews your report within 24-48 hours</li>
                        <li>We verify the issue at the specified location</li>
                        <li>Once verified, we assign it to relevant authorities</li>
                        <li>You'll receive updates via email as we progress</li>
                        <li>Track your issue status on your dashboard</li>
                    </ol>
                </div>
                
                <a href="http://localhost:5000/dashboard" class="button">View Dashboard</a>
                
                <p style="margin-top: 30px; color: #666; font-size: 14px;">
                    <strong>Ticket Reference:</strong> Keep this ticket ID (${ticketId}) for future reference.<br>
                    If you have any questions, reply to this email or visit our website.
                </p>
            </div>
            
            <div class="footer">
                <p><strong>NagarVaani - The Voice of the City</strong></p>
                <p>Empowering citizens to report and resolve civic issues</p>
                <p>&copy; 2026 NagarVaani. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
  `;

  const textContent = `
NagarVaani - Issue Report Confirmation

Hi ${userName},

Your civic issue report has been successfully submitted to NagarVaani. Our team will review and take necessary action.

REPORT DETAILS:
- Ticket ID: ${ticketId}
- Issue Type: ${issueType}
- Description: ${description}
- Status: Pending Review
- Location: Lat ${parseFloat(latitude).toFixed(6)}, Long ${parseFloat(longitude).toFixed(6)}

YOU EARNED 10 POINTS!
Thank you for contributing to civic improvement. Your points can be redeemed for rewards.

WHAT HAPPENS NEXT:
1. Our team reviews your report within 24-48 hours
2. We verify the issue at the specified location
3. Once verified, we assign it to relevant authorities
4. You'll receive updates via email as we progress
5. Track your issue status on your dashboard

View your dashboard at: http://localhost:5000/dashboard

Keep this ticket ID (${ticketId}) for future reference.

Best regards,
NagarVaani Team
  `;

  try {
    return await sendEmail(userEmail, subject, htmlContent, textContent);
  } catch (error) {
    console.error("Failed to send issue report email:", error);
    throw error;
  }
}

/* Send Admin Notification Email for New Issue Report */
async function sendAdminNotification(ticketId, issueType, description, latitude, longitude, priority, reporterName, reporterEmail, reporterMobile) {
  const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
  const subject = `🚨 New Issue Reported - Ticket #${ticketId}`;
  
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                background-color: #f4f4f4;
                margin: 0;
                padding: 20px;
            }
            .container {
                max-width: 600px;
                margin: 0 auto;
                background-color: white;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                overflow: hidden;
            }
            .header {
                background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
                color: white;
                padding: 30px;
                text-align: center;
            }
            .header h1 {
                margin: 0;
                font-size: 28px;
            }
            .header p {
                margin: 10px 0 0 0;
                opacity: 0.9;
            }
            .content {
                padding: 30px;
            }
            .ticket-info {
                background-color: #f9f9f9;
                border-left: 4px solid #e74c3c;
                padding: 15px;
                margin-bottom: 20px;
                border-radius: 4px;
            }
            .ticket-info h3 {
                margin: 0 0 10px 0;
                color: #e74c3c;
            }
            .ticket-detail {
                display: flex;
                justify-content: space-between;
                padding: 8px 0;
                border-bottom: 1px solid #eee;
            }
            .ticket-detail:last-child {
                border-bottom: none;
            }
            .ticket-label {
                font-weight: 600;
                color: #666;
                width: 40%;
            }
            .ticket-value {
                color: #333;
                word-break: break-word;
            }
            .priority-high {
                color: #e74c3c;
                font-weight: bold;
            }
            .priority-medium {
                color: #f39c12;
                font-weight: bold;
            }
            .priority-low {
                color: #27ae60;
                font-weight: bold;
            }
            .reporter-info {
                background-color: #e3f2fd;
                border-left: 4px solid #2196f3;
                padding: 15px;
                margin: 20px 0;
                border-radius: 4px;
            }
            .reporter-info h3 {
                margin: 0 0 10px 0;
                color: #2196f3;
            }
            .location-map {
                margin-top: 15px;
                padding: 10px;
                background-color: #f5f5f5;
                border-radius: 4px;
                font-family: monospace;
                font-size: 12px;
            }
            .action-button {
                display: inline-block;
                background-color: #e74c3c;
                color: white;
                padding: 12px 24px;
                border-radius: 4px;
                text-decoration: none;
                margin-top: 15px;
                font-weight: bold;
            }
            .action-button:hover {
                background-color: #c0392b;
            }
            .footer {
                background-color: #f9f9f9;
                padding: 20px;
                text-align: center;
                border-top: 1px solid #eee;
                font-size: 12px;
                color: #666;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🚨 New Issue Report</h1>
                <p>A new civic issue has been reported on NagarVaani</p>
            </div>
            
            <div class="content">
                <p><strong>Dear Admin,</strong></p>
                
                <p>A new issue has been reported and requires your attention. Please review the details below and take necessary action.</p>
                
                <div class="ticket-info">
                    <h3>📋 Issue Details</h3>
                    <div class="ticket-detail">
                        <span class="ticket-label">Ticket ID:</span>
                        <span class="ticket-value"><strong>${ticketId}</strong></span>
                    </div>
                    <div class="ticket-detail">
                        <span class="ticket-label">Issue Type:</span>
                        <span class="ticket-value">${issueType}</span>
                    </div>
                    <div class="ticket-detail">
                        <span class="ticket-label">Description:</span>
                        <span class="ticket-value">${description || 'No description provided'}</span>
                    </div>
                    <div class="ticket-detail">
                        <span class="ticket-label">Priority:</span>
                        <span class="ticket-value"><span class="priority-${(priority || 'medium').toLowerCase()}">${priority || 'Medium'}</span></span>
                    </div>
                    <div class="ticket-detail">
                        <span class="ticket-label">Status:</span>
                        <span class="ticket-value">Pending Review</span>
                    </div>
                </div>
                
                <div class="location-map">
                    <strong>📍 Location Coordinates:</strong><br>
                    Latitude: ${parseFloat(latitude).toFixed(6)}<br>
                    Longitude: ${parseFloat(longitude).toFixed(6)}<br>
                    <a href="https://www.google.com/maps?q=${latitude},${longitude}" target="_blank" style="color: #2196f3;">➡️ View on Google Maps</a>
                </div>
                
                <div class="reporter-info">
                    <h3>👤 Reporter Information</h3>
                    <div class="ticket-detail">
                        <span class="ticket-label">Name:</span>
                        <span class="ticket-value">${reporterName || 'N/A'}</span>
                    </div>
                    <div class="ticket-detail">
                        <span class="ticket-label">Email:</span>
                        <span class="ticket-value">${reporterEmail || 'N/A'}</span>
                    </div>
                    <div class="ticket-detail">
                        <span class="ticket-label">Mobile:</span>
                        <span class="ticket-value">${reporterMobile || 'N/A'}</span>
                    </div>
                </div>
                
                <a href="http://localhost:5000/dashboard" class="action-button">View in Dashboard</a>
            </div>
            
            <div class="footer">
                <p><strong>NagarVaani - The Voice of the City</strong></p>
                <p>Empowering citizens to report and resolve civic issues</p>
                <p>&copy; 2026 NagarVaani. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
  `;

  const textContent = `
🚨 NEW ISSUE REPORT - Ticket #${ticketId}

Issue Details:
- Ticket ID: ${ticketId}
- Issue Type: ${issueType}
- Description: ${description || 'No description provided'}
- Priority: ${priority || 'Medium'}
- Status: Pending Review

Location:
- Latitude: ${latitude}
- Longitude: ${longitude}
- Google Maps: https://www.google.com/maps?q=${latitude},${longitude}

Reporter:
- Name: ${reporterName || 'N/A'}
- Email: ${reporterEmail || 'N/A'}
- Mobile: ${reporterMobile || 'N/A'}

View Dashboard: http://localhost:5000/dashboard
  `;

  try {
    return await sendEmail(adminEmail, subject, htmlContent, textContent);
  } catch (error) {
    console.error("Failed to send admin notification:", error);
    throw error;
  }
}

/* Send Issue Resolved Confirmation Email to Reporter */
async function sendIssueResolvedEmail(userEmail, userName, ticketId, issueType, description) {
  const subject = `✅ Issue Resolved - Ticket #${ticketId}`;
  
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                background-color: #f4f4f4;
                margin: 0;
                padding: 20px;
            }
            .container {
                max-width: 600px;
                margin: 0 auto;
                background-color: white;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                overflow: hidden;
            }
            .header {
                background: linear-gradient(135deg, #4caf50 0%, #2e7d32 100%);
                color: white;
                padding: 30px;
                text-align: center;
            }
            .header h1 {
                margin: 0;
                font-size: 28px;
            }
            .header p {
                margin: 10px 0 0 0;
                opacity: 0.9;
            }
            .content {
                padding: 30px;
            }
            .resolved-badge {
                display: inline-block;
                background-color: #4caf50;
                color: white;
                padding: 10px 20px;
                border-radius: 20px;
                font-size: 16px;
                font-weight: bold;
                margin: 10px 0;
            }
            .ticket-info {
                background-color: #f9f9f9;
                border-left: 4px solid #4caf50;
                padding: 15px;
                margin: 20px 0;
                border-radius: 4px;
            }
            .ticket-info h3 {
                margin: 0 0 10px 0;
                color: #4caf50;
            }
            .ticket-detail {
                display: flex;
                justify-content: space-between;
                padding: 8px 0;
                border-bottom: 1px solid #eee;
            }
            .ticket-detail:last-child {
                border-bottom: none;
            }
            .ticket-label {
                font-weight: 600;
                color: #666;
                width: 40%;
            }
            .ticket-value {
                color: #333;
                word-break: break-word;
            }
            .message-box {
                background-color: #e8f5e9;
                border-left: 4px solid #4caf50;
                padding: 15px;
                margin: 20px 0;
                border-radius: 4px;
                text-align: center;
            }
            .message-box h2 {
                margin: 0 0 10px 0;
                color: #2e7d32;
            }
            .message-box p {
                margin: 5px 0;
                color: #555;
            }
            .button {
                display: inline-block;
                background-color: #4caf50;
                color: white;
                padding: 12px 24px;
                border-radius: 4px;
                text-decoration: none;
                margin-top: 15px;
                font-weight: bold;
            }
            .button:hover {
                background-color: #388e3c;
            }
            .footer {
                background-color: #f9f9f9;
                padding: 20px;
                text-align: center;
                border-top: 1px solid #eee;
                font-size: 12px;
                color: #666;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>✅ Issue Resolved!</h1>
                <p>Your reported problem has been taken care of</p>
            </div>
            
            <div class="content">
                <div class="message-box">
                    <h2>🎉 Great News!</h2>
                    <p>The issue you reported has been <strong>successfully resolved</strong>.</p>
                    <p>Thank you for helping make our city better!</p>
                </div>
                
                <p>Hi <strong>${userName}</strong>,</p>
                
                <p>We are pleased to inform you that the civic issue you reported to NagarVaani has been reviewed and marked as <strong>Resolved</strong>.</p>
                
                <div class="ticket-info">
                    <h3>📋 Issue Details</h3>
                    <div class="ticket-detail">
                        <span class="ticket-label">Ticket ID:</span>
                        <span class="ticket-value"><strong>${ticketId}</strong></span>
                    </div>
                    <div class="ticket-detail">
                        <span class="ticket-label">Issue Type:</span>
                        <span class="ticket-value">${issueType}</span>
                    </div>
                    <div class="ticket-detail">
                        <span class="ticket-label">Description:</span>
                        <span class="ticket-value">${description || 'No description'}</span>
                    </div>
                    <div class="ticket-detail">
                        <span class="ticket-label">Status:</span>
                        <span class="ticket-value">
                            <span class="resolved-badge">✅ Resolved</span>
                        </span>
                    </div>
                </div>
                
                <p style="margin-top: 20px;">
                    <strong>🏆 You earned 10 points</strong> for reporting this issue. Your contribution helps make our community a better place.
                </p>
                
                <p>If you have any further concerns, feel free to report a new issue or contact our support team.</p>
                
                <a href="http://localhost:5000/dashboard" class="button">View Dashboard</a>
                
                <p style="margin-top: 30px; color: #666; font-size: 14px;">
                    Thank you for being a responsible citizen!<br>
                    Together, we can make our city better.
                </p>
            </div>
            
            <div class="footer">
                <p><strong>NagarVaani - The Voice of the City</strong></p>
                <p>Empowering citizens to report and resolve civic issues</p>
                <p>&copy; 2026 NagarVaani. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
  `;

  const textContent = `
✅ ISSUE RESOLVED - Ticket #${ticketId}

Hi ${userName},

Great news! The issue you reported has been successfully resolved.

ISSUE DETAILS:
- Ticket ID: ${ticketId}
- Issue Type: ${issueType}
- Description: ${description || 'No description'}
- Status: ✅ Resolved

You earned 10 points for reporting this issue. Thank you for contributing!

View Dashboard: http://localhost:5000/dashboard

Best regards,
NagarVaani Team
  `;

  try {
    return await sendEmail(userEmail, subject, htmlContent, textContent);
  } catch (error) {
    console.error("Failed to send issue resolved email:", error);
    throw error;
  }
}

module.exports = {
  sendEmail,
  sendIssueReportEmail,
  sendAdminNotification,
  sendIssueResolvedEmail
};
