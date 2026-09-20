import os
import joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from feature_engineering import load_and_preprocess_data, FEATURE_COLUMNS

# Define where to save the trained model
MODEL_PATH = "ml/model/thermal_classifier.joblib"

def train_model():
    """
    Trains the Random Forest model on the synthetic dataset and saves it to disk.
    """
    print("Loading and preprocessing data...")
    # Load the processed feature matrix and target labels
    X, y = load_and_preprocess_data()
    
    print(f"Splitting dataset into training and testing sets ({len(X)} total samples)...")
    # Split data: 80% for training, 20% for testing. Random state ensures reproducibility.
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    print("Initializing Random Forest Classifier...")
    # Initialize the Random Forest with 200 trees and balanced class weights to handle any class imbalance
    clf = RandomForestClassifier(n_estimators=200, random_state=42, class_weight="balanced")
    
    print("Training model...")
    # Train the model using the training data
    clf.fit(X_train, y_train)
    
    print("Extracting feature importances...")
    # Extract the relative importance of each feature in the model's decision making
    importances = clf.feature_importances_
    for name, importance in zip(FEATURE_COLUMNS, importances):
        print(f"  {name}: {importance:.4f}")
        
    print("Saving model to disk...")
    # Ensure the model directory exists
    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    
    # Save the trained model using joblib so the FastAPI service can load it later
    joblib.dump(clf, MODEL_PATH)
    
    print(f"Model successfully saved to {MODEL_PATH}")

if __name__ == "__main__":
    train_model()

