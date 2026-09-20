import joblib
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score
from feature_engineering import load_and_preprocess_data
from sklearn.model_selection import train_test_split
from train_model import MODEL_PATH

def evaluate_model():
    """
    Evaluates the trained Random Forest model on the test dataset.
    """
    print("Loading data...")
    # Load the processed dataset
    X, y = load_and_preprocess_data()
    
    # Split the dataset identically to how it was split during training (same random_state)
    _, X_test, _, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    print(f"Loading trained model from {MODEL_PATH}...")
    try:
        # Load the saved Random Forest model
        clf = joblib.load(MODEL_PATH)
    except FileNotFoundError:
        print("Model file not found. Please run train_model.py first.")
        return
        
    print("Generating predictions on test set...")
    # Predict the classes for the test features
    y_pred = clf.predict(X_test)
    
    print("\n" + "="*50)
    print("MODEL EVALUATION REPORT")
    print("="*50)
    
    # Calculate overall accuracy
    acc = accuracy_score(y_test, y_pred)
    print(f"\nOverall Accuracy: {acc:.4f}\n")
    
    print("Per-Class Classification Report:")
    # Generate detailed precision, recall, and f1-score for each class
    print(classification_report(y_test, y_pred))
    
    print("Confusion Matrix:")
    # Generate a confusion matrix to see exactly which classes are confused with each other
    print(confusion_matrix(y_test, y_pred))
    
    print("\nNote: This model is trained on a SYNTHETIC DEMO dataset.")
    print("Performance metrics do not represent real-world accuracy.")
    print("="*50 + "\n")

if __name__ == "__main__":
    evaluate_model()

