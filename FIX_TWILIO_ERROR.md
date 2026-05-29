# 🔧 Fix Twilio Authentication Error (20003)

## Error: "Twilio SMS Error: Authenticate - Error Code: 20003 → Account suspended or no credits"

This error means your Twilio account is either suspended or has no credits remaining.

---

## ✅ Solutions

### Option 1: Verify Twilio Account Status

1. **Log in to Twilio Console**: [https://www.twilio.com/console](https://www.twilio.com/console)
2. Check your account status:
   - Look for any suspension notices
   - Check your credit balance
   - Verify your account is verified (not trial)

3. **If account is suspended**:
   - Contact Twilio support to reactivate
   - Add payment method if required
   - Complete account verification

4. **If no credits**:
   - Add funds to your Twilio account
   - Upgrade to a paid plan

### Option 2: Verify Credentials

Your Twilio credentials should be in `.env`:
```
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=your_twilio_phone_number
```

**To get your credentials:**

1. Log in to Twilio Console
2. Go to **Settings** → **General**
3. Copy your **Account SID**
4. Click **"Show"** next to **Auth Token** and copy it
5. Go to **Phone Numbers** → **Manage** → **Active Numbers**
6. Verify `+12526694855` is listed

**If credentials don't match:**
- Copy the correct values from Twilio
- Update your `.env` file
- Restart your server

### Option 3: Regenerate Auth Token

If you suspect the auth token is compromised or invalid:

1. Go to Twilio Console → Settings → General
2. Click **"Regenerate"** next to Auth Token
3. Copy the new token
4. Update `.env`:
   ```
   TWILIO_AUTH_TOKEN=your_new_token_here
   ```
5. Restart your server

### Option 4: Use Twilio Trial Account Properly

If you're using a Twilio trial account:

⚠️ **Trial account limitations:**
- Can only send SMS to verified phone numbers
- Must verify the recipient number first

**To verify a phone number:**
1. Go to Twilio Console → Phone Numbers → Verified Caller IDs
2. Click **"+ Add a verified caller ID"**
3. Enter the phone number you want to send SMS to
4. Twilio will call/text that number with a verification code
5. Enter the code to verify
6. Now you can send SMS to that number

### Option 5: Disable SMS (Use Email Only)

If you don't want to deal with Twilio right now, you can disable SMS and rely on email notifications only.

**Modify `services/smsService.js`:**

```javascript
// Comment out the Twilio code and just log
async function sendSMS(phoneNumber, message) {
    console.log(`[SMS DISABLED] Would send to ${phoneNumber}: ${message}`);
    return {
        success: true,
        message: 'SMS disabled - check console for message',
        isDevelopment: true
    };
}
```

---

## 📋 Quick Checklist

- [ ] Log in to Twilio Console
- [ ] Check account status (not suspended)
- [ ] Check credit balance (has credits)
- [ ] Verify Account SID matches `.env`
- [ ] Verify Auth Token matches `.env`
- [ ] Verify phone number is in your Twilio account
- [ ] If trial account, verify recipient phone numbers
- [ ] Restart server after any changes

---

## 🔄 Test After Fixing

After making changes, test the SMS functionality:

1. Restart your server: `npm start`
2. Try to register/login with OTP
3. Check if SMS is received

---

## 💡 Alternative: Use Different SMS Provider

If Twilio continues to be problematic, consider alternatives:
- **Vonage (Nexmo)**: Similar API, often cheaper
- **Plivo**: Good for international SMS
- **AWS SNS**: If you use AWS
- **TextLocal**: Popular in India

You would need to modify `services/smsService.js` to use a different provider.

---

## ✅ Expected Behavior After Fix

When SMS works correctly, you should see:
```
✅ SMS sent successfully to +919569854644
Twilio SID: SMxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Instead of the authentication error.