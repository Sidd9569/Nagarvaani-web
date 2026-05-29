"""
Simple and Reliable Image Classifier using sklearn
Works well with small datasets (8 images) - uses color features
"""

import os
import json
import numpy as np
from pathlib import Path
from PIL import Image
import pickle

try:
    from sklearn.preprocessing import LabelEncoder
    from sklearn.ensemble import RandomForestClassifier
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False
    print("sklearn not installed. Run: pip install scikit-learn")

# Setup paths
BASE_DIR = Path(__file__).parent
TEMP_IMAGES_DIR = BASE_DIR / "temp_images"
MODELS_DIR = BASE_DIR / "models"
MODELS_DIR.mkdir(exist_ok=True)

# Mapping of image filename keywords to issue types
ISSUE_KEYWORDS = {
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

def extract_issue_type(filename):
    """Extract issue type from image filename"""
    filename_lower = filename.lower()
    
    for keyword, issue_type in ISSUE_KEYWORDS.items():
        if keyword in filename_lower:
            return issue_type
    
    return None

def extract_color_features(image_array):
    """Extract simple color statistics from image
    Works well for distinguishing different civic issues
    """
    # image_array is shape (224, 224, 3) with values 0-1
    
    features = []
    
    # 1. Overall average RGB (3 features)
    features.extend(np.mean(image_array, axis=(0, 1)))
    
    # 2. Standard deviation of RGB (3 features)
    features.extend(np.std(image_array, axis=(0, 1)))
    
    # 3. Min and Max of each channel (6 features)
    features.extend(np.min(image_array, axis=(0, 1)))
    features.extend(np.max(image_array, axis=(0, 1)))
    
    # 4. Divide image into 4 quadrants - average color (12 features)
    h, w = image_array.shape[:2]
    h2, w2 = h // 2, w // 2
    
    for i in range(2):
        for j in range(2):
            quad = image_array[i*h2:(i+1)*h2, j*w2:(j+1)*w2]
            features.extend(np.mean(quad, axis=(0, 1)))
    
    # Total: 3 + 3 + 6 + 12 = 24 features
    return np.array(features, dtype=np.float32)

def load_training_images():
    """Load and prepare training images"""
    print("\n[1/3] LOADING IMAGES FROM temp_images/")
    print("-" * 50)
    
    images_features = []
    labels = []
    
    valid_extensions = ('.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp')
    
    if not TEMP_IMAGES_DIR.exists():
        print(f"ERROR: {TEMP_IMAGES_DIR} folder not found!")
        return None, None
    
    image_count = 0
    for filename in sorted(os.listdir(TEMP_IMAGES_DIR)):
        if not any(filename.lower().endswith(ext) for ext in valid_extensions):
            continue
        
        filepath = TEMP_IMAGES_DIR / filename
        issue_type = extract_issue_type(filename)
        
        if issue_type is None:
            print(f"  ⚠ {filename} - Unknown issue type (skipping)")
            continue
        
        try:
            # Load image
            img = Image.open(filepath).convert('RGB')
            img = img.resize((224, 224))
            img_array = np.array(img, dtype=np.float32) / 255.0
            
            # Extract features instead of storing raw image
            features = extract_color_features(img_array)
            
            images_features.append(features)
            labels.append(issue_type)
            image_count += 1
            
            print(f"  ✓ {filename:35} -> {issue_type}")
        
        except Exception as e:
            print(f"  ✗ {filename:35} - Error: {str(e)}")
    
    if image_count == 0:
        print("\nERROR: No valid training images found!")
        return None, None
    
    print(f"\n✓ Loaded {image_count} images")
    
    X = np.array(images_features)
    y = np.array(labels)
    
    # Show class distribution
    unique_classes = np.unique(y)
    print(f"✓ Found {len(unique_classes)} issue types:")
    for issue_type in unique_classes:
        count = np.sum(y == issue_type)
        print(f"    • {issue_type}: {count} images")
    
    return X, y

def train_classifier(X, y):
    """Train Random Forest classifier"""
    print("\n[2/3] TRAINING CLASSIFIER")
    print("-" * 50)
    
    # Encode labels
    label_encoder = LabelEncoder()
    y_encoded = label_encoder.fit_transform(y)
    
    print(f"✓ Classes: {list(label_encoder.classes_)}")
    
    # Train classifier with appropriate parameters for small dataset
    clf = RandomForestClassifier(
        n_estimators=50,
        max_depth=10,
        min_samples_split=2,
        min_samples_leaf=1,
        random_state=42
    )
    clf.fit(X, y_encoded)
    
    # Check accuracy on training data
    accuracy = clf.score(X, y_encoded)
    print(f"✓ Training Accuracy: {accuracy*100:.1f}%")
    print(f"✓ Model trained successfully")
    
    return clf, label_encoder

def save_model(clf, label_encoder):
    """Save trained model and label encoder"""
    print("\n[3/3] SAVING MODEL")
    print("-" * 50)
    
    # Save model
    model_path = MODELS_DIR / "classifier.pkl"
    with open(model_path, 'wb') as f:
        pickle.dump(clf, f)
    print(f"✓ Model saved to {model_path}")
    
    # Save encoder
    encoder_path = MODELS_DIR / "encoder.pkl"
    with open(encoder_path, 'wb') as f:
        pickle.dump(label_encoder, f)
    print(f"✓ Encoder saved to {encoder_path}")
    
    # Save classes as JSON
    classes_path = MODELS_DIR / "classes.json"
    classes_data = {
        "classes": list(label_encoder.classes_),
        "num_classes": len(label_encoder.classes_),
        "model_type": "Random Forest (Color Features)"
    }
    with open(classes_path, 'w') as f:
        json.dump(classes_data, f, indent=2)
    print(f"✓ Classes saved to {classes_path}")
    
    print(f"\n✓ MODEL TRAINING COMPLETE")
    return True

if __name__ == "__main__":
    print("\n" + "="*50)
    print("TRAINING CIVIC ISSUE CLASSIFIER")
    print("="*50)
    
    # Load images
    X, y = load_training_images()
    if X is None or y is None:
        print("\nERROR: Could not load training images")
        exit(1)
    
    # Train model
    if not SKLEARN_AVAILABLE:
        print("\nERROR: scikit-learn not installed")
        exit(1)
    
    clf, label_encoder = train_classifier(X, y)
    
    # Save model
    save_model(clf, label_encoder)
    
    print("\n" + "="*50)
    print("✓ TRAINING COMPLETE - Ready to use!")
    print("="*50)
    print("\nNext: Run 'python app.py' to start the API")
