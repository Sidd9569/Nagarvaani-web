# 🚀 NagarVaani - Complete Deployment Guide

This guide will help you deploy your NagarVaani civic issue reporting platform to production.

---

## 📋 Project Overview

Your project consists of:
- **Node.js/Express API** (port 5000) - Main backend server
- **MongoDB Database** - Data storage (now using MongoDB Atlas)
- **Python Flask AI Service** (port 8000) - Image classification
- **Static Frontend** - HTML/CSS/JS pages
- **Third-party Services** - Twilio (SMS), Gmail (Email)

---

## ✅ Pre-Deployment Checklist

### 1. Environment Variables Updated
Your `.env` file has been updated with MongoDB Atlas connection:
```
MONGO_URI=mongodb+srv://ss2654001_db_user:hOIXaIj8cYcrzddt@cluster0.kkqplva.mongodb.net/nagarvaani?retryWrites=true&w=majority
```

### 2. MongoDB Atlas Network Access
⚠️ **IMPORTANT**: Configure MongoDB Atlas network access:
1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Click "Network Access" in left sidebar
3. Click "Add IP Address"
4. For development, click "Allow Access from Anywhere" (0.0.0.0/0)
5. For production, add your server's IP address

### 3. Database User Permissions
Ensure your database user has read/write permissions:
1. Go to "Database Access" in MongoDB Atlas
2. Verify user `ss2654001_db_user` exists
3. User should have "Read and write to any database" privilege

---

## 🌐 Deployment Option 1: Render.com (Recommended - Free)

### Step 1: Prepare GitHub Repository

```bash
# Navigate to your project
cd Nagarvaani

# Initialize git (if not already done)
git init
git add .
git commit -m "Prepare for production deployment"

# Create a new repository on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/nagarvaani.git
git push -u origin main
```

### Step 2: Deploy to Render

1. **Sign up/Login** at [Render.com](https://render.com)

2. **Create New Web Service**:
   - Click "New +" → "Web Service"
   - Connect your GitHub account
   - Select your `nagarvaani` repository

3. **Configure Service**:
   - **Name**: `nagarvaani`
   - **Region**: Choose closest to your users (e.g., Singapore for India)
   - **Branch**: `main`
   - **Root Directory**: `Nagarvaani`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`

4. **Add Environment Variables** (in Render dashboard → Environment):
   ```
   PORT=5000
   MONGO_URI=mongodb+srv://ss2654001_db_user:hOIXaIj8cYcrzddt@cluster0.kkqplva.mongodb.net/nagarvaani?retryWrites=true&w=majority
   JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
   TWILIO_ACCOUNT_SID=AC44c74f0f5b3599df9920234014a52781
   TWILIO_AUTH_TOKEN=4057b4b04f8f7162900f61839f199f4b
   TWILIO_PHONE_NUMBER=+12526694855
   EMAIL_USER=ss2654001@gmail.com
   EMAIL_PASS=your_gmail_app_password
   ADMIN_EMAIL=ss2654001@gmail.com
   ```

5. **Click "Create Web Service"**

### Step 3: Deploy Python AI Service

Since Render free tier only supports one service, deploy the AI service separately:

#### Option A: PythonAnywhere (Free)
1. Sign up at [PythonAnywhere](https://www.pythonanywhere.com)
2. Create a new web app
3. Upload your `ai-model` folder
4. Configure WSGI file to point to Flask app
5. Update `aiDetectionService.js` with the new URL

#### Option B: Hugging Face Spaces (Free)
1. Create a new Space at [Hugging Face](https://huggingface.co/spaces)
2. Choose "Docker" or "Gradio" SDK
3. Upload your AI model code
4. Get the public URL

#### Option C: Skip AI Service (Fallback Mode)
The app will work without AI - images will be classified as "Unknown" but all other features work.

### Step 4: Update AI Detection Service URL

After deploying the AI service, update `services/aiDetectionService.js`:

```javascript
// Change this line:
const response = await axios.post(
    "http://localhost:8000/detect",  // OLD
    // Change to your production AI service URL
    "https://your-ai-service.com/detect",  // NEW
    form,
    { headers: form.getHeaders ? form.getHeaders() : { 'Content-Type': 'multipart/form-data' } }
);
```

---

## 🌐 Deployment Option 2: Railway.app

1. **Sign up** at [Railway.app](https://railway.app)

2. **Deploy from GitHub**:
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository

3. **Configure**:
   - Railway auto-detects Node.js
   - Set root directory to `Nagarvaani`
   - Add environment variables (same as Render)

4. **Deploy AI Service**:
   - Add another service in the same project
   - Configure as Python service
   - Point to `ai-model` directory

---

## 🌐 Deployment Option 3: VPS (DigitalOcean/AWS)

### Prerequisites
- Ubuntu 20.04+ server
- Domain name (optional but recommended)
- SSH access

### Step 1: Connect to Server
```bash
ssh root@your_server_ip
```

### Step 2: Install Required Software
```bash
# Update system
apt update && apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Install MongoDB (or use Atlas)
# Skip if using MongoDB Atlas

# Install Python
apt install -y python3 python3-pip

# Install Nginx
apt install -y nginx

# Install PM2
npm install -g pm2

# Install Git
apt install -y git
```

### Step 3: Clone Repository
```bash
cd /var/www
git clone https://github.com/YOUR_USERNAME/nagarvaani.git
cd nagarvaani/Nagarvaani
npm install
```

### Step 4: Configure Environment
```bash
nano .env
# Paste your environment variables
# Press Ctrl+X, Y, Enter to save
```

### Step 5: Start Application with PM2
```bash
# Start Node.js app
pm2 start server.js --name nagarvaani-api

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup systemd
# Run the command it outputs
```

### Step 6: Configure Nginx
```bash
nano /etc/nginx/sites-available/nagarvaani
```

Paste this configuration:
```nginx
server {
    listen 80;
    server_name your_domain.com www.your_domain.com;

    # Increase client max body size for file uploads
    client_max_body_size 20M;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # AI Service (if running locally)
    location /api/ai/ {
        proxy_pass http://localhost:8000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:
```bash
ln -s /etc/nginx/sites-available/nagarvaani /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
   ```
   TWILIO_ACCOUNT_SID=your_twilio_account_sid_here
   ```

   ```
   TWILIO_AUTH_TOKEN=your_twilio_auth_token_here
   ```

### Step 8: Deploy Python AI Service (Optional)
```bash
cd /var/www/nagarvaani/Nagarvaani/ai-model

# Install Python dependencies
pip3 install flask flask-cors pillow numpy werkzeug scikit-learn

# Train the model (if not already trained)
python3 train_classifier.py

# Start with PM2
pm2 start "python3 app.py" --name nagarvaani-ai
pm2 save
```

---

## 🌐 Deployment Option 4: Docker

### Create Dockerfile
Create `Nagarvaani/Dockerfile`:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

### Create docker-compose.yml
Create `docker-compose.yml` in project root:
```yaml
version: '3.8'
services:
  api:
    build: ./Nagarvaani
    ports:
      - "5000:5000"
    environment:
      - MONGO_URI=${MONGO_URI}
      - JWT_SECRET=${JWT_SECRET}
      - TWILIO_ACCOUNT_SID=${TWILIO_ACCOUNT_SID}
      - TWILIO_AUTH_TOKEN=${TWILIO_AUTH_TOKEN}
      - TWILIO_PHONE_NUMBER=${TWILIO_PHONE_NUMBER}
      - EMAIL_USER=${EMAIL_USER}
      - EMAIL_PASS=${EMAIL_PASS}
      - ADMIN_EMAIL=${ADMIN_EMAIL}
    depends_on:
      - mongo
  
  ai:
    build: ./Nagarvaani/ai-model
    ports:
      - "8000:8000"
  
  mongo:
    image: mongo:6
    volumes:
      - mongo_data:/data/db
    ports:
      - "27017:27017"

volumes:
  mongo_data:
```

### Build and Run
```bash
# Create .env file with your variables
cp .env.example .env

# Build and run
docker-compose up -d

# View logs
docker-compose logs -f api
docker-compose logs -f ai
```

---

## 🔧 Post-Deployment Tasks

### 1. Test Your Application
- Visit your deployed URL
- Test user registration and login
- Test issue reporting with image upload
- Verify email notifications
- Check database connections in MongoDB Atlas

### 2. Update Frontend API URLs
If your frontend JavaScript files have hardcoded `localhost` URLs, update them:

In `public/js/*.js` files, change:
```javascript
const API_URL = 'http://localhost:5000';
```
to:
```javascript
const API_URL = 'https://your-domain.com';
```

### 3. Configure CORS (if needed)
The server already has CORS enabled, but verify in `server.js`:
```javascript
app.use(cors({
  origin: ['https://your-domain.com', 'http://localhost:5000']
}));
```

### 4. Set Up Monitoring
- **Uptime Monitoring**: Use [UptimeRobot](https://uptimerobot.com) (free)
- **Error Tracking**: Consider [Sentry](https://sentry.io) (free tier)
- **Logs**: Check Render/Railway logs or use `pm2 logs` on VPS

### 5. Database Backup
Set up automated backups in MongoDB Atlas:
1. Go to MongoDB Atlas → Backups
2. Enable automated backups
3. Configure backup schedule

---

## 🛠️ Troubleshooting

### MongoDB Connection Issues
```
Error: MongoDB connection failed
```
**Solution**: 
- Verify MongoDB Atlas network access allows your IP
- Check connection string is correct
- Ensure database user has proper permissions

### Port Already in Use
```
Error: Port 5000 already in use
```
**Solution**:
```bash
# Find process using port 5000
lsof -i :5000
# Kill the process
kill -9 <PID>
```

### Environment Variables Not Loading
**Solution**:
- Ensure `.env` file is in the same directory as `server.js`
- Restart the application after changing `.env`
- Verify environment variables are set in deployment platform

### AI Detection Not Working
**Solution**:
- Verify AI service is running: `curl http://localhost:8000/health`
- Check `aiDetectionService.js` has correct URL
- Ensure model files exist in `ai-model/models/`

### File Upload Issues
**Solution**:
- Increase `client_max_body_size` in Nginx
- Check `uploads/` directory has write permissions
- Verify multer configuration in `middleware/uploadMiddleware.js`

---

## 📊 Monitoring and Maintenance

### Daily Tasks
- Check application logs
- Monitor database usage
- Review error reports

### Weekly Tasks
- Update dependencies: `npm audit fix`
- Review user feedback
- Check disk space on VPS

### Monthly Tasks
- Backup database
- Review security updates
- Analyze usage patterns

---

## 🔒 Security Recommendations

1. **Change Default Secrets**:
   - Generate strong JWT_SECRET
   - Use environment variables for all secrets

2. **Enable HTTPS**:
   - Use Let's Encrypt (free SSL)
   - Force HTTPS redirects

3. **Rate Limiting**:
   Consider adding rate limiting to prevent abuse:
   ```javascript
   const rateLimit = require('express-rate-limit');
   app.use('/api/', rateLimit({
     windowMs: 15 * 60 * 1000, // 15 minutes
     max: 100 // limit each IP to 100 requests per windowMs
   }));
   ```

4. **Input Validation**:
   Ensure all user inputs are validated and sanitized

5. **Regular Updates**:
   Keep all dependencies updated for security patches

---

## 📞 Support

If you encounter issues during deployment:
1. Check application logs
2. Review this guide
3. Search for specific error messages
4. Check MongoDB Atlas logs
5. Review deployment platform documentation

---

## 🎉 Congratulations!

Your NagarVaani platform is now live! Users can:
- Register and login
- Report civic issues with photos
- View dashboard and leaderboard
- Earn rewards
- Receive notifications via email/SMS

Remember to monitor your application and gather user feedback for future improvements!