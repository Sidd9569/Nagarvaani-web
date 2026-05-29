"""
Train civic issue classifier from images in temp_images folder
Automatically learns issue types from image filenames
"""

import os
import json
import numpy as np
from pathlib import Path
from PIL import Image
import pickle

# Machine Learning
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers, models, preprocessing
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.callbacks import EarlyStopping

# Setup paths
BASE_DIR = Path(__file__).parent
TEMP_IMAGES_DIR = BASE_DIR / "temp_images"
MODELS_DIR = BASE_DIR / "models"
MODELS_DIR.mkdir(exist_ok=True)

# Issue type mapping from filenames
ISSUE_TYPE_MAP = {
    "pothole": "Pothole",
    "pothole_mark": "Pothole",
    "pothole mark": "Pothole",
    "garbage": "Garbage",
    "trash": "Garbage",
    "litter": "Garbage",
    "streetlight": "Broken Streetlight",
    "street_light": "Broken Streetlight",
    "street light": "Broken Streetlight",
    "broken": "Broken Streetlight",
    "broken_light": "Broken Streetlight",
    "broken light": "Broken Streetlight",
    "light": "Broken Streetlight",
    "manhole": "Manhole",
    "manhole_cover": "Manhole",
    "manhole cover": "Manhole",
    "electric": "Electric Fault",
    "electrical": "Electric Fault",
    "electrical_fault": "Electric Fault",
    "wire": "Electric Fault",
    "cable": "Electric Fault",
    "power_line": "Electric Fault",
    "power line": "Electric Fault",
    "damage": "Pothole",
    "road_damage": "Pothole",
    "road damage": "Pothole",
}

def get_issue_type_from_filename(filename):
    """Extract issue type from image filename"""
    filename_lower = filename.lower()
    for key, issue_type in ISSUE_TYPE_MAP.items():
        if key in filename_lower:
            return issue_type
    return "Unknown"

def load_and_prepare_images():
    """Load images and extract labels from filenames"""
    images = []
    labels = []
    valid_extensions = ('.jpg', '.jpeg', '.png', '.webp', '.gif')
    
    print("[LOADING] Reading training images...")
    
    for image_file in os.listdir(TEMP_IMAGES_DIR):
        if not image_file.lower().endswith(valid_extensions):
            continue
            
        file_path = TEMP_IMAGES_DIR / image_file
        
        try:
            # Load image
            img = Image.open(file_path).convert('RGB')
            img = img.resize((224, 224))  # MobileNetV2 input size
            img_array = np.array(img) / 255.0  # Normalize to 0-1
            
            # Get label from filename
            label = get_issue_type_from_filename(image_file)
            
            images.append(img_array)
            labels.append(label)
            
            print(f"  ✓ {image_file} -> {label}")
            
        except Exception as e:
            print(f"  ✗ Failed to load {image_file}: {e}")
    
    if not images:
        print("[ERROR] No images found in temp_images folder!")
        return None, None, None
    
    X = np.array(images)
    y = np.array(labels)
    
    # Encode labels
    label_encoder = LabelEncoder()
    y_encoded = label_encoder.fit_transform(y)
    
    print(f"\n[DATASET] Loaded {len(images)} images")
    print(f"[CLASSES] {len(label_encoder.classes_)} issue types found:")
    for idx, issue_type in enumerate(label_encoder.classes_):
        count = np.sum(y == issue_type)
        print(f"  - {issue_type}: {count} images")
    
    return X, y_encoded, label_encoder

def build_model(num_classes):
    """Build classification model using transfer learning"""
    
    print("\n[MODEL] Building MobileNetV2-based classifier...")
    
    # Load pre-trained MobileNetV2
    base_model = MobileNetV2(
        input_shape=(224, 224, 3),
        include_top=False,
        weights='imagenet'
    )
    
    # Freeze base model layers
    base_model.trainable = False
    
    # Add custom top layers
    model = models.Sequential([
        base_model,
        layers.GlobalAveragePooling2D(),
        layers.Dense(256, activation='relu'),
        layers.Dropout(0.5),
        layers.Dense(128, activation='relu'),
        layers.Dropout(0.3),
        layers.Dense(num_classes, activation='softmax')
    ])
    
    model.compile(
        optimizer=Adam(learning_rate=0.001),
        loss='sparse_categorical_crossentropy',
        metrics=['accuracy']
    )
    
    print(f"[MODEL] Total parameters: {model.count_params():,}")
    return model

def train_model(X, y, label_encoder):
    """Train the classification model"""
    
    print("\n[TRAINING] Preparing data...")
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    # Add validation split
    X_train, X_val, y_train, y_val = train_test_split(
        X_train, y_train, test_size=0.2, random_state=42, stratify=y_train
    )
    
    print(f"  Training set: {len(X_train)} images")
    print(f"  Validation set: {len(X_val)} images")
    print(f"  Test set: {len(X_test)} images")
    
    # Build model
    model = build_model(len(label_encoder.classes_))
    
    # Train with callbacks
    print("\n[TRAINING] Starting training...")
    early_stopping = EarlyStopping(
        monitor='val_loss',
        patience=5,
        restore_best_weights=True
    )
    
    history = model.fit(
        X_train, y_train,
        validation_data=(X_val, y_val),
        epochs=20,
        batch_size=4,
        callbacks=[early_stopping],
        verbose=1
    )
    
    # Evaluate
    print("\n[EVALUATION] Testing model...")
    test_loss, test_accuracy = model.evaluate(X_test, y_test, verbose=0)
    print(f"  Test Accuracy: {test_accuracy*100:.2f}%")
    print(f"  Test Loss: {test_loss:.4f}")
    
    return model, history

def save_model_and_metadata(model, label_encoder):
    """Save model and metadata"""
    
    print("\n[SAVING] Storing model...")
    
    # Save model
    model_path = MODELS_DIR / "civic_issue_classifier.h5"
    model.save(model_path)
    print(f"  ✓ Model saved to {model_path}")
    
    # Save label encoder
    encoder_path = MODELS_DIR / "label_encoder.pkl"
    with open(encoder_path, 'wb') as f:
        pickle.dump(label_encoder, f)
    print(f"  ✓ Label encoder saved to {encoder_path}")
    
    # Save class info
    class_info = {
        "classes": label_encoder.classes_.tolist(),
        "num_classes": len(label_encoder.classes_)
    }
    
    info_path = MODELS_DIR / "model_info.json"
    with open(info_path, 'w') as f:
        json.dump(class_info, f, indent=2)
    print(f"  ✓ Metadata saved to {info_path}")
    
    print("\n[SUCCESS] Model training complete!")
    print(f"  Classes: {', '.join(class_info['classes'])}")

def main():
    print("="*60)
    print("CIVIC ISSUE CLASSIFIER - TRAINING SYSTEM")
    print("="*60)
    
    # Load images
    X, y, label_encoder = load_and_prepare_images()
    if X is None:
        return
    
    # Train model
    model, history = train_model(X, y, label_encoder)
    
    # Save model
    save_model_and_metadata(model, label_encoder)
    
    print("\n" + "="*60)
    print("NEXT STEPS:")
    print("1. Start the Flask API: python app.py")
    print("2. Upload images in the report to auto-classify")
    print("="*60)

if __name__ == "__main__":
    main()
