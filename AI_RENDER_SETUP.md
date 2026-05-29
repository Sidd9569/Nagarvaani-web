# Render setup: AI Flask model + Node (NagarVaani)

This guide explains how to make your `ai-model/app.py` work on **Render** together with the Node/Express backend.

## 1) Deploy the Flask AI service (separate Render Web Service)

### What to deploy
- File: `Nagarvaani/ai-model/app.py`
- Requirements: `Nagarvaani/ai-model/requirements.txt`

### Render settings
1. **New Service → Web Service**
2. Build Command:
   - `pip install -r requirements.txt`
3. Start Command:
   - `python app.py`
4. Port:
   - Your Flask code uses `port=8000` in `app.run(...)`.

> Render will give you a public URL like:
> `https://your-flask-service.onrender.com`

### Critical: include model files in the Flask deployment
Your Flask code loads:
- `Nagarvaani/ai-model/models/classifier.pkl`
- `Nagarvaani/ai-model/models/encoder.pkl`

Ensure these exist **in the repo** and are not gitignored.

### Test
After deploying, verify:
- `GET /health`

## 2) Deploy the Node/Express backend (separate Render Web Service)

Your Node code currently calls Flask like this:
- `http://localhost:8000/detect`

On Render, `localhost:8000` inside the Node container will NOT be your Flask service.

### Add an environment variable to Node
In Render → your Node service → **Environment**:
- `AI_API_URL=https://<YOUR_FLASK_RENDER_URL>/detect`

Example:
- `AI_API_URL=https://abc123.onrender.com/detect`

## 3) Update Node code to use `AI_API_URL`

Change the axios target URL in:
- `Nagarvaani/services/aiDetectionService.js`
- `Nagarvaani/controllers/issueController.js`

Use:
- `process.env.AI_API_URL || 'http://localhost:8000/detect'`

### Extra safety (recommended)
Also add a timeout and better error logging.

## 4) Quick checklist
- [ ] Flask is deployed on Render as its **own** Web Service
- [ ] Node is deployed on Render as its **own** Web Service
- [ ] Flask model files (`classifier.pkl`, `encoder.pkl`) are present in the repo under `ai-model/models/`
- [ ] Node env var `AI_API_URL` is set to the Flask service `/detect` endpoint
- [ ] Node code uses `process.env.AI_API_URL`

## 5) If it still fails

1. Check Flask logs:
   - Are you getting POST requests to `/detect`?
2. Check Flask `/health`:
   - `model_loaded` must be true.
3. Check Node logs:
   - Confirm the request URL is the Render Flask URL, not `localhost`.

