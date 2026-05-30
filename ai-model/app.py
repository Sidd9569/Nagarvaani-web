```python
"""
Flask API for Civic Issue Classification
Render Deployment Ready
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

# =========================
# FLASK APP
# =========================

app = Flask(__name__)
CORS(app)

# =========================
# PATHS
# =========================

BASE_DIR = Path(__file__).parent
MODELS_DIR = BASE_DIR / "models"
UPLOAD_DIR = BASE_DIR / "uploads"

UPLOAD_DIR.mkdir(exist_ok=True)

ALLOWED_EXTENSIONS = {
    "jpg",
    "jpeg",
    "png",
    "gif",
    "webp",
    "bmp"
}

# =========================
# GLOBAL VARIABLES
# =========================

CLASSIFIER = None
LABEL_ENCODER = None
CLASSES = []

# =========================
# LOAD MODEL
# =========================

def load_model():
    global CLASSIFIER
    global LABEL_ENCODER
    global CLASSES

    model_path = MODELS_DIR / "classifier.pkl"
    encoder_path = MODELS_DIR / "encoder.pkl"

    try:

        if not model_path.exists():
            print(f"[ERROR] Missing model file: {model_path}")
            return False

        if not encoder_path.exists():
            print(f"[ERROR] Missing encoder file: {encoder_path}")
            return False

        with open(model_path, "rb") as f:
            CLASSIFIER = pickle.load(f)

        with open(encoder_path, "rb") as f:
            LABEL_ENCODER = pickle.load(f)

        CLASSES = list(LABEL_ENCODER.classes_)

        print("=" * 50)
        print("[OK] MODEL LOADED SUCCESSFULLY")
        print(f"[OK] Classes: {CLASSES}")
        print("=" * 50)

        return True

    except Exception as e:
        print("[ERROR] Failed to load model")
        print(str(e))
        traceback.print_exc()
        return False


# =========================
# FEATURE EXTRACTION
# =========================

def extract_color_features(image_array):

    features = []

    features.extend(np.mean(image_array, axis=(0, 1)))
    features.extend(np.std(image_array, axis=(0, 1)))
    features.extend(np.min(image_array, axis=(0, 1)))
    features.extend(np.max(image_array, axis=(0, 1)))

    h, w = image_array.shape[:2]

    h2 = h // 2
    w2 = w // 2

    for i in range(2):
        for j in range(2):

            quad = image_array[
                i * h2:(i + 1) * h2,
                j * w2:(j + 1) * w2
            ]

            features.extend(
                np.mean(quad, axis=(0, 1))
            )

    return np.array(features, dtype=np.float32)


# =========================
# CLASSIFICATION
# =========================

def classify_image(image_path):

    if CLASSIFIER is None:
        return "Model Not Loaded", 0

    try:

        img = Image.open(image_path).convert("RGB")
        img = img.resize((224, 224))

        img_array = np.array(img, dtype=np.float32) / 255.0

        features = extract_color_features(
            img_array
        ).reshape(1, -1)

        prediction = CLASSIFIER.predict(features)[0]

        probabilities = CLASSIFIER.predict_proba(features)[0]

        confidence = int(
            max(probabilities) * 100
        )

        issue_type = LABEL_ENCODER.inverse_transform(
            [prediction]
        )[0]

        return issue_type, confidence

    except Exception as e:

        print("[ERROR] Classification failed")
        print(str(e))

        return "Unknown", 0


# =========================
# LOAD MODEL ON STARTUP
# =========================

load_model()

# =========================
# ROOT ROUTE
# =========================

@app.route("/", methods=["GET"])
def home():

    return jsonify({
        "success": True,
        "service": "Nagarvaani AI API",
        "status": "running",
        "model_loaded": CLASSIFIER is not None
    })


# =========================
# HEALTH CHECK
# =========================

@app.route("/health", methods=["GET"])
def health():

    return jsonify({
        "status": "ok" if CLASSIFIER else "error",
        "model_loaded": CLASSIFIER is not None,
        "classes": CLASSES
    })


# =========================
# INFO
# =========================

@app.route("/info", methods=["GET"])
def info():

    return jsonify({
        "name": "Nagarvaani Civic Issue Classifier",
        "version": "4.0",
        "classes": CLASSES,
        "endpoints": [
            "/",
            "/health",
            "/info",
            "/detect"
        ]
    })


# =========================
# DETECT ISSUE
# =========================

@app.route("/detect", methods=["POST"])
def detect():

    try:

        if "image" not in request.files:

            return jsonify({
                "success": False,
                "error": "No image uploaded"
            }), 400

        file = request.files["image"]

        if file.filename == "":

            return jsonify({
                "success": False,
                "error": "Empty filename"
            }), 400

        ext = (
            file.filename.rsplit(".", 1)[1].lower()
            if "." in file.filename
            else ""
        )

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

            issue_type, confidence = classify_image(
                str(filepath)
            )

            return jsonify({
                "success": True,
                "issueType": issue_type,
                "detectedObject": issue_type,
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

        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


# =========================
# START SERVER
# =========================

if __name__ == "__main__":

    port = int(
        os.environ.get("PORT", 8000)
    )

    app.run(
        host="0.0.0.0",
        port=port,
        debug=False,
        threaded=True
    )
```
