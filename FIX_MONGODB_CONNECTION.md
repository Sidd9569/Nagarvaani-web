# 🔧 Fix MongoDB Connection Error

## Error: "MongoDB connection failed. Code: undefined, Hostname: undefined"

This error typically occurs due to network/DNS issues or MongoDB Atlas configuration problems.

---

## ✅ Step-by-Step Solutions

### Step 1: Verify MongoDB Atlas Network Access

1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Click **"Network Access"** in the left sidebar
3. Click **"+ ADD IP ADDRESS"**
4. Click **"ALLOW ACCESS FROM ANYWHERE"** (adds 0.0.0.0/0)
5. Click **"Confirm"**

### Step 2: Verify Database User

1. In MongoDB Atlas, click **"Database Access"**
2. Ensure user `ss2654001_db_user` exists
3. Click **"Edit"** on the user
4. Verify password is `hOIXaIj8cYcrzddt`
5. Ensure user has **"Read and write to any database"** privilege
6. Click **"Update User"**

### Step 3: Test Connection String

Try this test in your terminal:

```bash
# Install MongoDB shell if not installed
# Then test connection:
mongosh "mongodb+srv://ss2654001_db_user:hOIXaIj8cYcrzddt@cluster0.kkqplva.mongodb.net/nagarvaani?retryWrites=true&w=majority"
```

If this fails, the issue is with your MongoDB Atlas setup.

### Step 4: Check DNS/Network

The error "Hostname: undefined" suggests a DNS resolution problem.

**For Windows:**
```bash
# Flush DNS cache
ipconfig /flushdns

# Check if you can resolve the MongoDB host
nslookup cluster0.kkqplva.mongodb.net
```

If nslookup fails, try:
- Restart your router
- Use a different network (mobile hotspot)
- Use a VPN

### Step 5: Update MongoDB Driver

Make sure you have the latest MongoDB driver:

```bash
cd Nagarvaani
npm install mongoose@latest
```

### Step 6: Try Alternative Connection String

Sometimes the connection string format matters. Try without the options:

In `.env`, change:
```
MONGO_URI=mongodb+srv://ss2654001_db_user:hOIXaIj8cYcrzddt@cluster0.kkqplva.mongodb.net/nagarvaani
```

(Remove `?retryWrites=true&w=majority`)

### Step 7: Check MongoDB Cluster Status

1. Go to MongoDB Atlas
2. Check if your cluster is running (green status)
3. If it's paused, resume it
4. If it's stuck, try restarting the cluster

### Step 8: Verify Cluster Name

Make sure your cluster name is correct:
- In MongoDB Atlas, look at your cluster name
- It should match `cluster0` in the connection string
- The full hostname should be: `cluster0.kkqplva.mongodb.net`

---

## 🚀 Quick Test

Run this simple test to check if MongoDB is accessible:

```javascript
// Create a file test-mongo.js in Nagarvaani folder
const mongoose = require('mongoose');

mongoose.connect('mongodb+srv://ss2654001_db_user:hOIXaIj8cYcrzddt@cluster0.kkqplva.mongodb.net/nagarvaani?retryWrites=true&w=majority')
  .then(() => {
    console.log('✅ MongoDB Connected Successfully!');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ MongoDB Connection Error:', err.message);
    console.error('Full error:', err);
    process.exit(1);
  });
```

Then run:
```bash
cd Nagarvaani
node test-mongo.js
```

---

## 📋 Common Causes and Fixes

| Cause | Solution |
|-------|----------|
| IP not whitelisted | Add 0.0.0.0/0 in Network Access |
| Wrong password | Reset password in Database Access |
| Cluster paused | Resume cluster in MongoDB Atlas |
| DNS issues | Flush DNS, restart router, or use VPN |
| Wrong cluster name | Verify cluster name in Atlas |
| Firewall blocking | Temporarily disable firewall to test |
| MongoDB driver outdated | Run `npm install mongoose@latest` |

---

## 🆘 Still Not Working?

If none of the above works:

1. **Reset your MongoDB password**:
   - Go to Database Access
   - Click "Edit" on your user
   - Set a new password
   - Update `.env` with the new password

2. **Create a new database user**:
   - Go to Database Access
   - Click "+ Add New Database User"
   - Create user with username: `nagarvaani_user`
   - Set password: (choose a strong password)
   - Give "Read and write to any database" privilege
   - Update `.env` with new credentials

3. **Check MongoDB Atlas logs**:
   - Go to Clusters → Click "..." → "Logs"
   - Look for connection errors

---

## ✅ After Fixing

Once the connection works, your server should start successfully:

```bash
cd Nagarvaani
npm start
```

You should see:
```
✅ MongoDB Connected (cluster0.kkqplva.mongodb.net)
Server running on http://localhost:5000