"""
Flask API for Civic Issue Classification
Random Forest Model (Color Features)
Production-ready for Render deployment
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import pickle
import numpy as np
from pathlib import Path
from PIL import Image
from werkzeug.utils import secure_filename
import traceback

app = Flask(__name__)
CORS(app)

# ========================
# CONFIGURATION
# ========================
BASE_DIR = Path(__file__).parent
MODELS_DIR = BASE_DIR / "models"
UPLOAD_DIR = BASE_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

ALLOWED_EXTENSIONS = {'jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'}

# ========================
# GLOBAL VARIABLES
# ========================
CLASSIFIER = None
LABEL_ENCODER = None
CLASSES = []

# ========================
# LOAD MODEL
# ========================
def load_model():
    global CLASSIFIER, LABEL_ENCODER, CLASSES

    model_path = MODELS_DIR / "classifier.pkl"
    encoder_path = MODELS_DIR / "encoder.pkl"

    if not model_path.exists() or not encoder_path.exists():
        print("[WARNING] Model files not found. Run training first.")
        return False

    try:
        with open(model_path, 'rb') as f:
            CLASSIFIER = pickle.load(f)

        with open(encoder_path, 'rb') as f:
            LABEL_ENCODER = pickle.load(f)

        CLASSES = list(LABEL_ENCODER.classes_)
        print(f"[OK] Model loaded successfully. Classes: {CLASSES}")
        return True

    except Exception as e:
        print(f"[ERROR] Model loading failed: {e}")
        return False


# ========================
# FEATURE EXTRACTION
# ========================
def extract_color_features(image_array):
    features = []

    features.extend(np.mean(image_array, axis=(0, 1)))
    features.extend(np.std(image_array, axis=(0, 1)))
    features.extend(np.min(image_array, axis=(0, 1)))
    features.extend(np.max(image_array, axis=(0, 1)))

    h, w = image_array.shape[:2]
    h2, w2 = h // 2, w // 2

    for i in range(2):
        for j in range(2):
            quad = image_array[i*h2:(i+1)*h2, j*w2:(j+1)*w2]
            features.extend(np.mean(quad, axis=(0, 1)))

    return np.array(features, dtype=np.float32)


# ========================
# CLASSIFICATION FUNCTION
# ========================
def classify_image(image_path):
    if CLASSIFIER is None:
        return "Model Not Loaded", 0

    try:
        img = Image.open(image_path).convert('RGB')
        img = img.resize((224, 224))

        img_array = np.array(img, dtype=np.float32) / 255.0
        features = extract_color_features(img_array).reshape(1, -1)

        prediction = CLASSIFIER.predict(features)[0]
        probabilities = CLASSIFIER.predict_proba(features)[0]
        confidence = int(max(probabilities) * 100)

        issue_type = LABEL_ENCODER.inverse_transform([prediction])[0]

        return issue_type, confidence

    except Exception as e:
        print("[ERROR] Classification failed:", e)
        return "Unknown", 0


# ========================
# HEALTH CHECK
# ========================
@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        "status": "ok" if CLASSIFIER is not None else "error",
        "model_loaded": CLASSIFIER is not None,
        "classes": CLASSES
    })


# ========================
# IMAGE DETECTION API
# ========================
@app.route('/detect', methods=['POST'])
def detect():
    try:
        if 'image' not in request.files:
            return jsonify({"success": False, "error": "No image provided"}), 400

        file = request.files['image']

        if file.filename == '':
            return jsonify({"success": False, "error": "Empty filename"}), 400

        ext = file.filename.rsplit('.', 1)[1].lower() if '.' in file.filename else None

        if ext not in ALLOWED_EXTENSIONS:
            return jsonify({
                "success": False,
                "error": "Unsupported file type"
            }), 400

        filename = secure_filename(file.filename)
        filepath = UPLOAD_DIR / filename
        file.save(filepath)

        try:
            if CLASSIFIER is None:
                return jsonify({
                    "success": False,
                    "error": "Model not loaded"
                }), 500

            issue_type, confidence = classify_image(str(filepath))

            return jsonify({
                "success": True,
                "issueType": issue_type,
                "confidence": confidence,
                "source": "random_forest_model"
            })

        finally:
            try:
                os.remove(filepath)
            except:
                pass

    except Exception as e:
        print(traceback.format_exc())
        return jsonify({"success": False, "error": str(e)}), 500


# ========================
# INFO ENDPOINT
# ========================
@app.route('/info', methods=['GET'])
def info():
    return jsonify({
        "name": "Civic Issue Classifier API",
        "version": "4.0",
        "model": "Random Forest (Color Features)",
        "classes": CLASSES,
        "endpoints": ["/health", "/detect", "/info"]
    })


# ========================
# TRAIN INFO
# ========================
@app.route('/train', methods=['GET'])
def train():
    return jsonify({
        "message": "Run python train_classifier.py to train model",
        "classes": CLASSES
    })


# ========================
# START SERVER (RENDER SAFE)
# ========================
if __name__ == '__main__':
    print("Starting Flask AI Service...")

    load_model()

    port = int(os.environ.get("PORT", 8000))  # RENDER SAFE

    app.run(
        host="0.0.0.0",
        port=port,
        debug=False,
        threaded=True
    )
