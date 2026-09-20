from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import joblib
import pandas as pd
import numpy as np

# Create the FastAPI app instance
app = FastAPI(
    title="ThermalX ML Classification API",
    description="Random Forest ML service for classifying thermal events based on FIRMS and OSM data.",
    version="1.0.0"
)

# Enable CORS so the local JavaScript frontend can call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to the frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load the trained Random Forest model from disk at startup
MODEL_PATH = "ml/model/thermal_classifier.joblib"
try:
    model = joblib.load(MODEL_PATH)
    print(f"Model successfully loaded from {MODEL_PATH}")
except Exception as e:
    print(f"Warning: Failed to load ML model from {MODEL_PATH}. Error: {e}")
    model = None

# Define the exact feature names the model expects, in order
FEATURE_COLUMNS = [
    "persistence_score",
    "detection_count",
    "average_frp",
    "average_confidence",
    "industrial_distance_km",
    "nearby_industrial_facility_count"
]

# Define the Pydantic schema for the incoming POST request
class ThermalEventFeatures(BaseModel):
    persistence_score: float = Field(..., description="Persistence score 0-100")
    detection_count: int = Field(..., description="Number of individual hotspot detections")
    average_frp: float = Field(..., description="Average Fire Radiative Power")
    average_confidence: float = Field(..., description="Average satellite confidence 0-100")
    industrial_distance_km: float = Field(..., description="Distance to nearest industrial facility in km")
    nearby_industrial_facility_count: int = Field(..., description="Number of industrial facilities nearby")

@app.post("/predict")
def predict_thermal_event(features: ThermalEventFeatures):
    """
    Receives engineered features from the frontend and returns the Random Forest classification.
    """
    # Ensure the model was actually loaded
    if model is None:
        raise HTTPException(status_code=503, detail="ML model is currently unavailable.")
    
    try:
        # Convert the Pydantic model into a dictionary
        input_data = features.dict()
        
        # Build the exact feature array in the correct order for the ML model
        # Fill missing numeric values with 0 safely
        feature_vector = [[input_data.get(col, 0) for col in FEATURE_COLUMNS]]
        
        # Convert to Pandas DataFrame to avoid scikit-learn warnings about lacking feature names
        X = pd.DataFrame(feature_vector, columns=FEATURE_COLUMNS)
        
        # Get the highest probability prediction class
        prediction = model.predict(X)[0]
        
        # Get the probability distributions for all classes
        prob_array = model.predict_proba(X)[0]
        
        # Map the probabilities to their class names
        class_probabilities = {
            class_name: float(round(prob_array[i], 3)) 
            for i, class_name in enumerate(model.classes_)
        }
        
        # Find the highest probability value for the top prediction
        top_probability = float(round(max(prob_array), 3))
        
        # Extract feature importances to send back for UI explainability
        importances = {
            name: float(round(imp, 3))
            for name, imp in zip(FEATURE_COLUMNS, model.feature_importances_)
        }
        
        # Return the structured JSON response
        return {
            "prediction": prediction,
            "probability": top_probability,
            "probabilities": class_probabilities,
            "features": importances,
            "model": "Random Forest"
        }
        
    except Exception as e:
        # If anything goes wrong during prediction, return a clean 500 error
        raise HTTPException(status_code=500, detail=str(e))

