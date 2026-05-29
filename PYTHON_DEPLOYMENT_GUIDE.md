# 🐍 Python AI Service Deployment Guide

## For User: Sidd9569

This guide will help you deploy your AI classification service (`ai-model/app.py`) to PythonAnywhere.

---

## 📦 What You Need to Deploy

Your AI service consists of these files in the `ai-model` folder:
- `app.py` - Main Flask application
- `train_classifier.py` - Model training script
- `train_model.py` - Alternative training script
- `models/` - Folder for trained models (after training)
- `uploads/` - Temporary upload folder

---

## 🚀 Step-by-Step Deployment to PythonAnywhere

### Step 1: Sign Up/Login to PythonAnywhere

1. Go to [https://www.pythonanywhere.com](https://www.pythonanywhere.com)
2. Click **"Sign up"** (free account)
3. Choose **"Beginner"** account type
4. Complete registration

### Step 2: Upload Your Files

#### Option A: Using Web Interface (Easiest)

1. **Log in to PythonAnywhere**
2. Click **"Files"** tab at the top
3. Navigate to your home directory: `/home/Sidd9569/`
4. Click **"Upload"** button
5. Upload these files one by one:
   - `app.py`
   - `train_classifier.py`
   - `train_model.py`
   - `requirements.txt` (create this first - see below)

#### Option B: Using Git (Recommended)

1. **Open a Bash console** in PythonAnywhere (click "Consoles" → "Bash")
2. Run these commands:
   ```bash
   cd /home/Sidd9569
   git clone https://github.com/Sidd9569/Nagarvaani-web.git
   cd Nagarvaani-web/ai-model
   ```

### Step 3: Create requirements.txt

Create a file named `requirements.txt` with this content:
```
flask
flask-cors
pillow
numpy
werkzeug
scikit-learn
pandas
```

Upload this file to `/home/Sidd9569/ai-model/` or create it in the cloned repository.

### Step 4: Install Dependencies

1. **Open a Bash console** in PythonAnywhere
2. Run:
   ```bash
   cd /home/Sidd9569/ai-model
   pip install -r requirements.txt
   ```

   Or if you used Git:
   ```bash
   cd /home/Sidd9569/Nagarvaani-web/ai-model
   pip install -r requirements.txt
   ```

### Step 5: Train the Model

Before the AI service can work, you need to train the model:

1. **Prepare training images**:
   - Place your training images in the `temp_images/` folder
   - Name them with issue types: `pothole_1.jpg`, `garbage_2.jpg`, etc.

2. **Run training**:
   ```bash
   cd /home/Sidd9569/ai-model
   python train_classifier.py
   ```

3. **Verify model was created**:
   - Check that `models/classifier.pkl` and `models/encoder.pkl` exist

### Step 6: Configure Web App

1. **Go to "Web" tab** in PythonAnywhere
2. Click **"Add a new web app"**
3. Choose **"Flask"** → **"Python 3.10"**
4. Click **"Next"**
5. Accept the default path: `/home/Sidd9569/`
6. Click **"Next"** → **"Add web app"**

### Step 7: Configure WSGI File

1. **Click on the WSGI file link** in the Web tab
   - It will open a file editor

2. **Replace ALL content** with this:
   ```python
   import sys
   import os
   
   # Add the ai-model directory to Python path
   path = '/home/Sidd9569/ai-model'
   if path not in sys.path:
       sys.path.insert(0, path)
   
   # Set environment variable for Flask
   os.environ['FLASK_APP'] = 'app.py'
   
   # Import the Flask app
   from app import app as application
   ```

3. **Click "Save"**

### Step 8: Configure Python Version

1. In the **Web tab**, find **"Python version"**
2. Select **"3.10"** from the dropdown
3. Click **"Save"**

### Step 9: Set Up Static Files (Optional)

If you want to serve static files:

1. In the **Web tab**, scroll to **"Static files"**
2. Click **"Add another static files route"**
3. Set:
   - **URL**: `/static/`
   - **Directory**: `/home/Sidd9569/ai-model/static/`
4. Click **"Save"**

### Step 10: Reload Your Web App

1. In the **Web tab**, click the green **"Reload"** button
2. Wait for the reload to complete

### Step 11: Test Your AI Service

1. **Visit your app**: `https://Sidd9569.pythonanywhere.com`
2. **Test the health endpoint**: `https://Sidd9569.pythonanywhere.com/health`
3. **Test the info endpoint**: `https://Sidd9569.pythonanywhere.com/info`

You should see JSON responses indicating the service is running.

---

## 🔗 Update Backend to Use AI Service

After your AI service is live, update your Node.js backend:

### Edit `services/aiDetectionService.js`:

```javascript
const response = await axios.post(
    "https://Sidd9569.pythonanywhere.com/detect",  // NEW URL
    form,
    { headers: form.getHeaders ? form.getHeaders() : { 'Content-Type': 'multipart/form-data' } }
);
```

### Commit and push the change:

```bash
cd Nagarvaani
git add .
git commit -m "Update AI service URL to PythonAnywhere"
git push origin main
```

---

## 📊 Your Deployment URLs

- **Backend (Render)**: `https://nagarvaani-backend.onrender.com`
- **AI Service (PythonAnywhere)**: `https://Sidd9569.pythonanywhere.com`
- **GitHub Repository**: `https://github.com/Sidd9569/Nagarvaani-web`

---

## 🛠️ Troubleshooting

### Error: "Module not found"
**Solution**: Make sure you installed all dependencies:
```bash
pip install flask flask-cors pillow numpy werkzeug scikit-learn
```

### Error: "Model not loaded"
**Solution**: Train the model first:
```bash
python train_classifier.py
```

### Error: "WSGI application error"
**Solution**: Check your WSGI file configuration and make sure the path is correct.

### App not responding
**Solution**: 
1. Check the "Error log" in PythonAnywhere Web tab
2. Reload the app again
3. Make sure all files are uploaded correctly

---

## 📝 Important Notes

1. **PythonAnywhere Free Tier Limitations**:
   - Your app will be put to sleep after inactivity
   - First request after sleep takes longer to respond
   - Limited CPU and memory

2. **Model Training**:
   - Train the model locally first if possible
   - Upload pre-trained models to save time
   - Training on free tier may be slow

3. **File Uploads**:
   - PythonAnywhere has file size limits
   - Large image uploads may fail
   - Consider using cloud storage for large files

---

## ✅ Deployment Checklist

- [ ] Sign up for PythonAnywhere
- [ ] Upload ai-model files
- [ ] Install dependencies
- [ ] Train the model
- [ ] Configure WSGI file
- [ ] Reload web app
- [ ] Test AI service endpoints
- [ ] Update backend URL
- [ ] Test full integration

Once completed, your AI service will be live and ready to classify civic issues!