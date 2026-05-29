"""
Quick setup and testing script
Verifies TensorFlow and model dependencies
"""

import sys
import os
from pathlib import Path

print("\n" + "="*50)
print("TESTING SETUP")
print("="*50)

# Test imports
print("\n[1/3] Checking imports...")

try:
    import tensorflow as tf
    print(f"  ✓ TensorFlow {tf.__version__}")
except ImportError as e:
    print(f"  ✗ TensorFlow: {e}")
    print("     Run: pip install tensorflow")

try:
    import flask
    print(f"  ✓ Flask")
except ImportError as e:
    print(f"  ✗ Flask: {e}")
    print("     Run: pip install flask flask-cors")

try:
    import numpy as np
    from PIL import Image
    from sklearn.preprocessing import LabelEncoder
    print(f"  ✓ Required packages (numpy, PIL, sklearn)")
except ImportError as e:
    print(f"  ✗ Missing packages: {e}")

# Check GPU
print("\n[2/3] Checking GPU support...")
try:
    import tensorflow as tf
    gpus = tf.config.list_physical_devices('GPU')
    if gpus:
        print(f"  ✓ GPU detected: {len(gpus)} device(s)")
    else:
        print(f"  ℹ No GPU. Using CPU (slower training)")
except:
    print(f"  ℹ CPU mode")

# Check model files
print("\n[3/3] Checking model files...")
base_dir = Path(__file__).parent
models_dir = base_dir / "models"

if models_dir.exists():
    has_model = (models_dir / "classifier.h5").exists()
    has_encoder = (models_dir / "encoder.pkl").exists()
    has_classes = (models_dir / "classes.json").exists()
    
    if has_model and has_encoder and has_classes:
        print(f"  ✓ Trained model found!")
    else:
        print(f"  ✗ Incomplete model")
        print(f"     - classifier.h5: {has_model}")
        print(f"     - encoder.pkl: {has_encoder}")
        print(f"     - classes.json: {has_classes}")
        print(f"     Run: python train_classifier.py")
else:
    print(f"  ℹ No models directory. Run: python train_classifier.py")

print("\n" + "="*50)
print("SETUP CHECK COMPLETE")
print("="*50 + "\n")
