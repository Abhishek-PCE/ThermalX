# ThermalX Classification Architecture
**Role 5 — Classification Logic Engineer**

This document outlines the classification architecture designed for the ThermalX MVP (SIH26162). 

> **IMPORTANT**: ThermalX uses an explainable rule-based classification approach for the MVP instead of a trained machine-learning model. Classification results are decision-support estimates and require human verification.

## 1. Role 5 Responsibilities
Role 5 is responsible for evaluating cleaned hotspot data (provided by Role 4) and determining the most likely source of the thermal event based on heuristic rules, context, and persistence. The classification engine is a pure logic module that does not handle UI, DOM manipulation, or API data fetching.

## 2. Classification Categories
ThermalX categorizes thermal hotspots into five distinct types:
- **INDUSTRIAL:** High-persistence stationary heat sources such as factory flares or continuous industrial processes.
- **WILDFIRE:** Active forest or natural land fires, typically characterized by cluster expansion and movement.
- **AGRICULTURAL:** Short-duration fires in farmland contexts, typically indicating seasonal crop burning.
- **OTHER:** Thermal events that do not cleanly fit the patterns above.
- **UNKNOWN:** Events lacking sufficient data to make a reliable decision, requiring review.

## 3. Input Features (Expected)
The classifier is designed to accept an input feature object containing both immediate and future data points.

**Available Now (Role 4):**
- `latitude` (Number)
- `longitude` (Number)
- `brightness` (Number, optional)
- `frp` (Number, optional)
- `confidence` (String/Number)
- `date` (String)

**Expected Future Additions (Days 2-8):**
- `persistence`: `{ score, detectionCount, uniqueDays }`
- `industrialContext`: `{ nearestFacility, distance, relevance }`
- `landContext`: `{ type }`
- `cluster`: `{ isExpanding, size }`

## 4. Output Structure & Explainability Approach
A core requirement for ThermalX is explainability. Every classification result returns a transparent decision structure:

```json
{
    "category": "Industrial",
    "confidence": 90,
    "scores": {
        "industrial": 90,
        "wildfire": 0,
        "agriculture": 0,
        "other": 0
    },
    "evidence": [
        "Proximity to facility (0.5km)",
        "High persistence score (85)"
    ],
    "reasons": [
        "Data matches industrial stationary source pattern."
    ],
    "priority": "High",
    "requiresHumanVerification": true
}
```
*   **Evidence** describes the raw metrics that triggered a score.
*   **Reasons** explain the overall logic for the chosen category.
*   **Scores** display the internal points given to each category, revealing the algorithm's thought process.

## 5. Classification Indicators
Current prototype indicators used in the logic:
- **Industrial:** Distance to nearest facility ≤ 2.0km; Persistence score ≥ 70.
- **Wildfire:** Detected in "forest" context; Part of an expanding cluster.
- **Agricultural:** Detected in "farmland" context.

## 6. Current Limitations
- **No Machine Learning:** The MVP relies strictly on hardcoded rules (heuristics), not AI.
- **Data Dependency:** The engine relies heavily on future context (OSM data, persistence algorithms) being passed in from other roles. If context is missing, the engine defaults to `Unknown`.
- **Heuristic Confidence:** The confidence score represents rule-based scoring strength, not statistical or scientific certainty.

## 7. Future Scoring Engine
For Days 2-8, the classification engine will evolve into a weighted scoring system, rather than simple presence checks. For example, the Industrial score might be calculated as:
`(Persistence × 0.35) + (Industrial Proximity × 0.30) + (FRP × 0.20) + (Confidence × 0.15)`
The current code architecture fully supports transitioning to this weighted math without needing structural rewrites.

