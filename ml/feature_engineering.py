import pandas as pd
import os

# Define the exact order of features expected by the model
FEATURE_COLUMNS = [
    "persistence_score",
    "detection_count",
    "average_frp",
    "average_confidence",
    "industrial_distance_km",
    "nearby_industrial_facility_count"
]

def load_and_preprocess_data(csv_path="data/training/thermal_events.csv"):
    """
    Loads the training dataset, handles missing values, and splits into features (X) and labels (y).
    """
    # Load the CSV data into a Pandas DataFrame
    df = pd.read_csv(csv_path)
    
    # Fill any missing numeric values with 0 so the model doesn't crash
    df.fillna(0, inplace=True)
    
    # Extract only the required feature columns to ensure consistency
    X = df[FEATURE_COLUMNS]
    
    # Extract the target label column
    y = df["label"]
    
    # Return the processed feature matrix and labels
    return X, y

