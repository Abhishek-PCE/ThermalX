# ThermalX — SIH26162

## 1. Project Overview
ThermalX is a web application designed to detect, analyze, classify, and visualize thermal hotspots to help authorities distinguish between industrial stationary sources and wildfires. 

## 2. SIH Problem Statement
**SIH26162**: AI-Based Detection and Classification of Industrial Fires and Persistent Thermal Sources Using NASA FIRMS, OSM & Satellite Data.

## 3. Architecture
The architecture flows from data ingestion through processing into a Machine Learning pipeline:
`NASA FIRMS + OSM -> Data Integration -> Processing -> Thermal Event Generation -> ML Feature Vector -> FastAPI -> Random Forest Classifier -> Leaflet Dashboard`.

## 4. Technology Stack
- **Frontend**: HTML5, CSS3, Vanilla JavaScript, Leaflet.js, Turf.js
- **ML Backend**: Python, FastAPI, Uvicorn, Scikit-Learn, Pandas, NumPy, Joblib

## 5. Data Sources
- **NASA FIRMS**: Provides real-time thermal hotspot detections (FRP, brightness, confidence).
- **OpenStreetMap / Overpass API**: Provides proximity to known industrial infrastructure.

## 6. ML Approach
We upgraded from rule-based heuristics to a Machine Learning classification system. Thermal events are represented as structured feature vectors and evaluated by a pre-trained ML model exposed via a REST API.

## 7. Feature List
The Random Forest classifier uses the following extracted features:
1. `persistence_score`: Percentage of days active
2. `detection_count`: Number of individual hotspot detections
3. `average_frp`: Average Fire Radiative Power (intensity)
4. `average_confidence`: Satellite confidence score
5. `industrial_distance_km`: Spatial distance to nearest OSM industrial facility
6. `nearby_industrial_facility_count`: Density of nearby infrastructure

## 8. Random Forest Explanation
A Random Forest Classifier operates by constructing a multitude of decision trees during training and outputting the class that is the mode of the classes. It handles non-linear relationships well (like high FRP + high industrial proximity = Industrial) and provides transparent feature importance metrics.

## 9. Training Process
Since real-world labeled data for FIRMS classifications isn't available by default, the model is trained on a **SYNTHETIC DEMO DATASET** (`data/training/thermal_events.csv`). 
To train the model:
`python ml/train_model.py`

## 10. Evaluation Metrics
The model is evaluated on Accuracy, Precision, Recall, and F1-Score using a test split. Note that because the training data is synthetic, these metrics evaluate the model's ability to learn the synthetic patterns, not real-world performance.
To evaluate:
`python ml/evaluate_model.py`

## 11. API Setup
Create and activate a Python virtual environment:
```bash
python -m venv .venv
source .venv/bin/activate
pip install -r api/requirements.txt
```

## 12. Frontend Setup
No build tools are required for the frontend. Simply serve the directory using any static file server (e.g. VS Code Live Server, or Python's `http.server`).

## 13. How to Run ML Service
Ensure your virtual environment is active, then start the FastAPI application:
```bash
uvicorn api.main:app --reload
```
The API documentation will be available at `http://127.0.0.1:8000/docs`.

## 14. How to Run ThermalX
1. Start the ML service (see above).
2. Open `index.html` in your browser.
3. Click on a thermal event on the map to see the ML classification result.

## 15. Demo Mode
If the NASA FIRMS or OSM APIs are offline, ThermalX automatically falls back to `demo-data.json`. If the ML API is offline, the frontend falls back to a simulated "Unknown (API Offline)" prediction to ensure the UI does not crash.

## 16. Limitations
1. FIRMS detects thermal anomalies, not definitive source identities.
2. Industrial proximity is contextual evidence, not proof.
3. Persistence is a feature, not proof of industrial activity.
4. Model quality depends on labelled training data.
5. Performance metrics depend on dataset quality and representativeness.

## 17. Human Verification Statement
Predictions require human verification for operational decisions. ThermalX is a decision-support tool. A classification of "Industrial" or "Wildfire" is a probabilistic suggestion and requires human review before action is taken.
