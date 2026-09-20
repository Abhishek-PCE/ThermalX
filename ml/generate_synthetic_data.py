import pandas as pd
import numpy as np
import os

# Ensure the output directory exists
os.makedirs("data/training", exist_ok=True)

# Generate synthetic data
np.random.seed(42)
n_samples = 800

# We want 4 classes: Industrial, Wildfire, Agricultural, Other
# (Unknown will be handled as low probability for all classes at inference)
labels = np.random.choice(["Industrial", "Wildfire", "Agricultural", "Other"], size=n_samples, p=[0.25, 0.25, 0.25, 0.25])

data = {
    "persistence_score": [],
    "detection_count": [],
    "average_frp": [],
    "average_confidence": [],
    "industrial_distance_km": [],
    "nearby_industrial_facility_count": [],
    "label": labels
}

for label in labels:
    if label == "Industrial":
        # High persistence, low to moderate FRP, very close to industrial facilities
        data["persistence_score"].append(np.random.normal(85, 10))
        data["detection_count"].append(np.random.normal(25, 10))
        data["average_frp"].append(np.random.normal(50, 20))
        data["average_confidence"].append(np.random.normal(85, 10))
        data["industrial_distance_km"].append(np.random.exponential(1.5))
        data["nearby_industrial_facility_count"].append(np.random.poisson(5))
    elif label == "Wildfire":
        # Low persistence, very high FRP, far from industrial facilities
        data["persistence_score"].append(np.random.normal(20, 15))
        data["detection_count"].append(np.random.normal(5, 3))
        data["average_frp"].append(np.random.normal(200, 80))
        data["average_confidence"].append(np.random.normal(90, 10))
        data["industrial_distance_km"].append(np.random.normal(25, 10))
        data["nearby_industrial_facility_count"].append(np.random.poisson(0.1))
    elif label == "Agricultural":
        # Moderate persistence, low FRP, moderate distance to industrial
        data["persistence_score"].append(np.random.normal(40, 15))
        data["detection_count"].append(np.random.normal(3, 2))
        data["average_frp"].append(np.random.normal(30, 15))
        data["average_confidence"].append(np.random.normal(70, 15))
        data["industrial_distance_km"].append(np.random.normal(15, 8))
        data["nearby_industrial_facility_count"].append(np.random.poisson(0.5))
    else: # Other
        # Random noise
        data["persistence_score"].append(np.random.uniform(0, 100))
        data["detection_count"].append(np.random.uniform(1, 10))
        data["average_frp"].append(np.random.uniform(10, 150))
        data["average_confidence"].append(np.random.uniform(50, 100))
        data["industrial_distance_km"].append(np.random.uniform(0, 50))
        data["nearby_industrial_facility_count"].append(np.random.poisson(1))

df = pd.DataFrame(data)

# Clean up values
df["persistence_score"] = df["persistence_score"].clip(0, 100).round(1)
df["detection_count"] = df["detection_count"].clip(1, 100).astype(int)
df["average_frp"] = df["average_frp"].clip(1, 500).round(1)
df["average_confidence"] = df["average_confidence"].clip(0, 100).round(1)
df["industrial_distance_km"] = df["industrial_distance_km"].clip(0.1, 100).round(2)

df.to_csv("data/training/thermal_events.csv", index=False)
print("Synthetic dataset generated at data/training/thermal_events.csv")
