# ThermalX Day 3 Role 4 - Final Report

## 1. Files Created
None. (Extended existing files as requested)

## 2. Files Modified
- `index.html`: Added Turf.js CDN `<script>` tag.
- `js/processing.js`: Appended Day 3 spatial/temporal processing logic.
- `js/app.js`: Updated integration pipeline to run `processHistoricalDetections` instead of `processHotspotData`.

## 3. Functions Created/Updated
- `calculateDistanceKm()`: Wraps Turf.js distance logic.
- `getDateKey()`: Normalizes dates for unique calendar day sets.
- `groupNearbyDetections()`: Core spatial clustering.
- `buildThermalEvent()`: Generates persistence metadata.
- `processHistoricalDetections()`: Master pipeline for Day 3.

## 4. How Turf.js is being used
Loaded via unpkg CDN in `index.html`. `calculateDistanceKm` builds two `turf.point` features (using `[longitude, latitude]` order) and calls `turf.distance(pointA, pointB, { units: "kilometers" })`. Includes a safe fallback if Turf fails to load.

## 5. How nearby detections are grouped
Detections are sorted chronologically, then iterated. Each detection's distance is compared against the first detection of existing groups. If `distance <= DEFAULT_GROUPING_RADIUS_KM` (2.0km prototype value), it is added to the group; otherwise, a new group is formed.

## 6. How unique days are calculated
A `Set` is used in `buildThermalEvent` to store normalized `YYYY-MM-DD` strings (`getDateKey`). The final `uniqueDays` count is exactly `Set.size`, ensuring multiple same-day satellite passes don't artificially inflate the persistence score.

## 7. How event IDs are generated
Generated using a math random string matching the project's existing ID convention, formatted as `TX-EV-[RANDOM_6_CHARS]`.

## 8. Example processed event structure
```json
{
  "id": "TX-EV-Y9VSV2",
  "latitude": 25.002,
  "longitude": 85.002,
  "brightness": 310,
  "frp": 20,
  "confidence": "high",
  "date": "2026-06-03",
  "satellite": "unknown",
  "persistence": {
    "detectionCount": 4,
    "uniqueDays": 3,
    "firstDetection": "2026-06-01",
    "lastDetection": "2026-06-03"
  }
}
```

## 9. Tests Performed
- **Node.js Mock Testing**: Manually supplied overlapping, close, and distant points. Verified duplicates were removed, close points formed a single event with correct `uniqueDays`/`detectionCount`, and distant points formed isolated events.
- **Integration Test**: Verified `app.js` can flawlessly route API data through the new pipeline.

## 10. Problems or Assumptions
- Assumed `2.0km` as a reasonable prototype heuristic for `DEFAULT_GROUPING_RADIUS_KM`.
- Assumed Turf.js could be safely added via unpkg.com CDN without violating CSP.

## 11. Notes for Role 5 (Classification)
The `persistence` object on every hotspot now provides exact counts (`uniqueDays`, `detectionCount`) and bounds (`firstDetection`, `lastDetection`). You no longer need to worry about multiple same-day detections skewing your score; use `uniqueDays` for measuring duration reliably.

## 12. Notes for Role 6 (Integration)
The pipeline now groups overlapping hotspots, meaning the map will render fewer markers (only one marker per persistent event instead of 10 stacked markers for 10 historical passes). The UI will naturally display the persistence data since it falls under the `persistence` key the UI expects.
