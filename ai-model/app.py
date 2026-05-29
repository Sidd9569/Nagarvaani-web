"""
Flask API for Civic Issue Classification
Uses trained Random Forest model on color features
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import json
import pickle
import numpy as np
from pathlib import Path
from PIL import Image
from werkzeug.utils import secure_filename
import traceback

app = Flask(__name__)
CORS(app)

# Configuration
BASE_DIR = Path(__file__).parent
MODELS_DIR = BASE_DIR / "models"
UPLOAD_DIR = BASE_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

ALLOWED_EXTENSIONS = {'jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'}

# Load trained model and encoder
CLASSIFIER = None
LABEL_ENCODER = None
CLASSES = []

def load_model():
    """Load trained model and encoder"""
    global CLASSIFIER, LABEL_ENCODER, CLASSES
    
    model_path = MODELS_DIR / "classifier.pkl"
    encoder_path = MODELS_DIR / "encoder.pkl"
    
    if not model_path.exists() or not encoder_path.exists():
        print("[WARNING] Trained model not found. Please run: python train_classifier.py")
        return False
    
    try:
        with open(model_path, 'rb') as f:
            CLASSIFIER = pickle.load(f)
        with open(encoder_path, 'rb') as f:
            LABEL_ENCODER = pickle.load(f)
        CLASSES = list(LABEL_ENCODER.classes_)
        print(f"✓ Model loaded: {len(CLASSES)} classes")
        return True
    except Exception as e:
        print(f"[ERROR] Failed to load model: {e}")
        return False

def extract_color_features(image_array):
    """Extract color features from image"""
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

def classify_image(image_path):
    """Classify image using trained model"""
    if CLASSIFIER is None:
        return "Unknown", 0
    
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
        print(f"[ERROR] Classification error: {e}")
        return "Unknown", 0

@app.route('/health', methods=['GET'])
def health():
    """Health check"""
    model_loaded = CLASSIFIER is not None
    return jsonify({
        "status": "ok" if model_loaded else "error",
        "model_loaded": model_loaded,
        "classifier_type": "Random Forest (Color Features)",
        "classes": CLASSES
    }), 200

@app.route('/detect', methods=['POST'])
def detect():
    """Detect issue from image"""
    
    try:
        # Get image
        if 'image' not in request.files:
            return jsonify({"success": False, "error": "No image provided"}), 400
        
        file = request.files['image']
        
        if file.filename == '':
            return jsonify({"success": False, "error": "Empty filename"}), 400
        
        ext = file.filename.rsplit('.', 1)[1].lower() if '.' in file.filename else None
        if ext not in ALLOWED_EXTENSIONS:
            return jsonify({
                "success": False, 
                "error": f"File type not allowed. Use: {', '.join(ALLOWED_EXTENSIONS)}"
            }), 400
        
        # Save temporarily
        filename = secure_filename(file.filename)
        filepath = UPLOAD_DIR / filename
        file.save(filepath)
        
        try:
            # Classify using trained model
            if CLASSIFIER is None:
                return jsonify({
                    "success": False,
                    "error": "Model not loaded. Train model first: python train_classifier.py"
                }), 500
            
            issue_type, confidence = classify_image(str(filepath))
            
            return jsonify({
                "success": True,
                "issueType": issue_type,
                "confidence": confidence,
                "detectedObject": issue_type,
                "source": "model"
            }), 200
        
        finally:
            # Cleanup
            try:
                os.remove(filepath)
            except:
                pass
    
    except Exception as e:
        print(f"[ERROR] {e}")
        print(traceback.format_exc())
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/info', methods=['GET'])
def info():
    """API info"""
    return jsonify({
        "name": "Civic Issue Classifier",
        "version": "4.0.0 (Model-Based)",
        "classifier_type": "Random Forest (Color Features)",
        "model_loaded": CLASSIFIER is not None,
        "classes": CLASSES,
        "description": "Classifies civic issues using trained ML model on image content",
        "endpoints": {
            "/health": "Health check",
            "/detect": "Classify single image (POST)",
            "/info": "This info",
            "/train": "Training instructions"
        }
    }), 200

@app.route('/train', methods=['GET'])
def train_info():
    """Training instructions"""
    return jsonify({
        "message": "To train the classifier with new images:",
        "steps": [
            "1. Add images to temp_images/ folder",
            "2. Name them with the issue type:",
            "   - pothole_1.jpg, pothole_2.jpg",
            "   - electrical_fault_1.webp",
            "   - garbage_1.jpg",
            "   - manhole_1.jpg",
            "   - broken_streetlight_1.jpg",
            "3. Run: python train_classifier.py",
            "4. Restart this API: python app.py"
        ],
        "supported_formats": list(ALLOWED_EXTENSIONS),
        "current_classes": CLASSES
    }), 200

@app.errorhandler(404)
def not_found(e):
    return jsonify({
        "error": "Endpoint not found",
        "available": ["/health", "/detect", "/info", "/train"]
    }), 404

if __name__ == '__main__':
    print("\n" + "="*50)
    print("CIVIC ISSUE CLASSIFIER API v4.0")
    print("Random Forest Model (Color Features)")
    print("="*50)
    
    # Load model
    if load_model():
        print("\n✓ Model ready!")
        print(f"  Classes: {CLASSES}")
    else:
        print("\n[WARNING] Model not loaded!")
        print("  Run: python train_classifier.py")
    
    print("\n[STARTING] Server on http://localhost:8000")
    print("  • POST /detect - Classify image")
    print("  • GET /health - Health check")
    print("  • GET /info - API info")
    print("="*50 + "\n")
    
    app.run(host='0.0.0.0', port=8000, debug=False, threaded=True)
