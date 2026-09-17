/**
 * ThermalX - Day 1 & Day 2 Role 4
 * Data Processing Engineer
 * 
 * This module cleans, validates, and standardizes raw NASA FIRMS hotspot data.
 * It acts as a pipeline between Role 3 (API Fetching) and the rest of the application
 * (Map, UI, Classification).
 */

// ============================================================================
// PROCESSING STATISTICS
// ============================================================================
// Stores metrics for the most recent processing run. Useful for debugging and Role 6 testing.
let processingStats = {
    totalReceived: 0,
    validRecords: 0,
    invalidCoordinates: 0,
    missingRequiredFields: 0,
    duplicatesRemoved: 0
};

/**
 * Resets the processing statistics before a new run.
 */
function resetStatistics() {
    processingStats = {
        totalReceived: 0,
        validRecords: 0,
        invalidCoordinates: 0,
        missingRequiredFields: 0,
        duplicatesRemoved: 0
    };
}

// ============================================================================
// VALIDATION FUNCTIONS (Day 1 Foundation & Day 2 Strict)
// ============================================================================

/**
 * Validates whether the given latitude and longitude represent a valid geographic coordinate.
 * 
 * @param {number} latitude 
 * @param {number} longitude 
 * @returns {boolean} True if coordinates are valid.
 */
function isValidCoordinate(latitude, longitude) {
    if (latitude == null || longitude == null) return false;
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return false;
    if (latitude < -90 || latitude > 90) return false;
    if (longitude < -180 || longitude > 180) return false;
    return true;
}

/**
 * Checks if the raw record contains all essential fields for ThermalX.
 * 
 * @param {Object} record - The raw hotspot record.
 * @returns {boolean} True if all required fields are present.
 */
function hasRequiredFields(record) {
    if (!record) return false;
    
    // Check for essential properties (accounting for possible FIRMS name variations)
    const hasLat = record.latitude !== undefined && record.latitude !== null;
    const hasLon = record.longitude !== undefined && record.longitude !== null;
    const hasBrightness = record.brightness !== undefined && record.brightness !== null;
    const hasFrp = record.frp !== undefined && record.frp !== null;
    const hasConfidence = record.confidence !== undefined && record.confidence !== null;
    const hasDate = (record.acq_date || record.date || record.timestamp) !== undefined && 
                    (record.acq_date || record.date || record.timestamp) !== null;

    return hasLat && hasLon && hasBrightness && hasFrp && hasConfidence && hasDate;
}

// ============================================================================
// DUPLICATE DETECTION (Day 2)
// ============================================================================

/**
 * Creates a unique, deterministic key for a hotspot based on location and time.
 * We round to 2 decimal places to catch very close points (same fire) on the same day.
 * 
 * @param {number} latitude 
 * @param {number} longitude 
 * @param {string} date 
 * @returns {string} The unique key string.
 */
function createHotspotKey(latitude, longitude, date) {
    const roundLat = latitude.toFixed(2);
    const roundLon = longitude.toFixed(2);
    return `${roundLat}_${roundLon}_${date}`;
}

/**
 * Checks if a key already exists in the provided Set.
 * 
 * @param {string} key - The unique hotspot key.
 * @param {Set} seenKeys - Set of previously seen keys.
 * @returns {boolean} True if the hotspot is a duplicate.
 */
function isDuplicateHotspot(key, seenKeys) {
    return seenKeys.has(key);
}

// ============================================================================
// HOTSPOT NORMALIZATION & FACTORY (Day 1 & Day 2)
// ============================================================================

/**
 * Safely converts a value to a finite number.
 * Returns null if the conversion fails or results in NaN/Infinity.
 * 
 * @param {any} val - The value to convert.
 * @returns {number|null} The finite number or null.
 */
function safeToNumber(val) {
    if (val === null || val === undefined || val === "") return null;
    const num = Number(val);
    if (Number.isFinite(num)) {
        return num;
    }
    return null;
}

/**
 * Converts a valid raw record into the standardized ThermalX hotspot structure.
 * This satisfies the Day 1 requirement for a predictable hotspot factory.
 * 
 * @param {Object} raw - The raw hotspot object.
 * @returns {Object} Clean, normalized hotspot object.
 */
function cleanHotspotRecord(raw) {
    const lat = safeToNumber(raw.latitude);
    const lon = safeToNumber(raw.longitude);
    const date = raw.acq_date || raw.date || raw.timestamp;
    
    // Generate an ID if not provided by the API
    const generateId = () => `TX-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const cleanObj = {
        id: raw.id || generateId(),
        latitude: lat,
        longitude: lon,
        brightness: safeToNumber(raw.brightness),
        frp: safeToNumber(raw.frp),
        confidence: String(raw.confidence), // Preserve as a standardized string
        date: String(date),
        satellite: raw.satellite || raw.instrument || "unknown"
    };
    
    // Retain Day/Night flag if it exists, as it could be useful later
    if (raw.daynight) cleanObj.daynight = String(raw.daynight);
    if (raw.version) cleanObj.version = String(raw.version);

    return cleanObj;
}

// ALIAS for Day 1 Prompt requirement ("createHotspot(data)")
const createHotspot = cleanHotspotRecord;

// ============================================================================
// MAIN DATA PROCESSING PIPELINE (Day 2)
// ============================================================================

/**
 * The core processing pipeline. Takes raw FIRMS data and returns clean, usable hotspots.
 * 
 * @param {Array} rawHotspots - Array of raw data objects from the API.
 * @returns {Array} Array of standardized, valid hotspot objects.
 */
function processHotspotData(rawHotspots) {
    resetStatistics();

    // 1. Array check
    if (!Array.isArray(rawHotspots)) {
        console.error("[Data Processing] Input is not an array. Safely returning empty array.");
        return [];
    }

    processingStats.totalReceived = rawHotspots.length;
    const cleanHotspots = [];
    const seenKeys = new Set();

    for (const raw of rawHotspots) {
        // 2. Validate essential fields existence
        if (!hasRequiredFields(raw)) {
            processingStats.missingRequiredFields++;
            continue; // Skip this record
        }

        // 3. Normalize numeric values for coordinates
        const lat = safeToNumber(raw.latitude);
        const lon = safeToNumber(raw.longitude);

        // 4. Validate Coordinates
        if (!isValidCoordinate(lat, lon)) {
            processingStats.invalidCoordinates++;
            continue; // Skip this record
        }

        // 5. Generate duplicate key and check for duplicates
        // Date mapping logic
        const rawDate = raw.acq_date || raw.date || raw.timestamp;
        const key = createHotspotKey(lat, lon, rawDate);

        if (isDuplicateHotspot(key, seenKeys)) {
            processingStats.duplicatesRemoved++;
            continue; // Skip duplicate
        }

        // Mark as seen
        seenKeys.add(key);

        // 6. Clean the record (secondary normalization) and push to valid array
        const cleanRecord = cleanHotspotRecord(raw);
        
        // Final sanity check on numeric fields after cleanHotspotRecord
        if (cleanRecord.brightness === null || cleanRecord.frp === null) {
             processingStats.missingRequiredFields++;
             continue;
        }

        cleanHotspots.push(cleanRecord);
    }

    processingStats.validRecords = cleanHotspots.length;
    
    // 7. Log statistics
    console.log("[Data Processing] Pipeline complete.");
    console.table(processingStats);

    return cleanHotspots;
}

// ============================================================================
// LOCAL STORAGE MANAGEMENT (From original day 1 implementation)
// ============================================================================

const STORAGE_KEY = "thermalx_hotspots";

function saveHotspots(hotspots) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(hotspots));
        console.log(`Saved ${hotspots.length} hotspots to localStorage.`);
    } catch (error) {
        console.error("Failed to save hotspots to localStorage:", error);
    }
}

function loadHotspots() {
    try {
        const jsonString = localStorage.getItem(STORAGE_KEY);
        if (jsonString) return JSON.parse(jsonString);
    } catch (error) {
        console.error("Failed to load hotspots from localStorage:", error);
    }
    return [];
}

// ============================================================================
// MOCK TEST DATA
// ============================================================================
// Used for testing the pipeline according to the 14 requirements.
const TEST_RAW_HOTSPOTS = [
    // TEST 1: Valid hotspot
    { id: "T1", latitude: 23.1, longitude: 87.2, brightness: 310, frp: 20, confidence: "high", acq_date: "2026-09-15" },
    // TEST 2: Invalid latitude
    { id: "T2", latitude: 150, longitude: 87.2, brightness: 310, frp: 20, confidence: "high", acq_date: "2026-09-15" },
    // TEST 3: Invalid longitude
    { id: "T3", latitude: 23.1, longitude: -200, brightness: 310, frp: 20, confidence: "high", acq_date: "2026-09-15" },
    // TEST 4: Missing latitude
    { id: "T4", longitude: 87.2, brightness: 310, frp: 20, confidence: "high", acq_date: "2026-09-15" },
    // TEST 5: Missing longitude
    { id: "T5", latitude: 23.1, brightness: 310, frp: 20, confidence: "high", acq_date: "2026-09-15" },
    // TEST 6: Missing FRP
    { id: "T6", latitude: 23.1, longitude: 87.2, brightness: 310, confidence: "high", acq_date: "2026-09-15" },
    // TEST 7: Missing brightness
    { id: "T7", latitude: 23.1, longitude: 87.2, frp: 20, confidence: "high", acq_date: "2026-09-15" },
    // TEST 8: Missing confidence
    { id: "T8", latitude: 23.1, longitude: 87.2, brightness: 310, frp: 20, acq_date: "2026-09-15" },
    // TEST 9: Missing date
    { id: "T9", latitude: 23.1, longitude: 87.2, brightness: 310, frp: 20, confidence: "high" },
    // TEST 10: Duplicate record (same location, same date as T1)
    { id: "T10", latitude: 23.1, longitude: 87.2, brightness: 320, frp: 25, confidence: "nominal", acq_date: "2026-09-15" },
    // TEST 11: Numeric values represented as strings (Should be VALID)
    { id: "T11", latitude: "24.5", longitude: "88.1", brightness: "330", frp: "45.5", confidence: "nominal", acq_date: "2026-09-16" },
    // TEST 13: Malformed record (garbage data)
    { id: "T13", latitude: "abc", longitude: null, brightness: Infinity, frp: NaN, confidence: {}, acq_date: [] },
    // TEST 14: Multiple valid records (just another valid record to prove multiple flow through)
    { id: "T14", latitude: 25.0, longitude: 89.0, brightness: 340, frp: 50, confidence: "high", acq_date: "2026-09-17" }
];

// ============================================================================
// DAY 3: SPATIAL & TEMPORAL PROCESSING (Role 4)
// ============================================================================

// A prototype heuristic radius (in kilometers) for grouping detections.
// Not scientifically validated, just for MVP demonstration.
const DEFAULT_GROUPING_RADIUS_KM = 2.0;

/**
 * ------------------------------------------------------------
 * Calculate geographic distance between two FIRMS detections.
 *
 * WHY:
 * Satellite detections of the same source may have slightly
 * different coordinates on different days.
 *
 * HOW:
 * Turf.js calculates the real geographic distance between
 * the two longitude/latitude points.
 * 
 * IMPORTANT:
 * Turf/GeoJSON uses [longitude, latitude].
 * Do not reverse this order.
 * ------------------------------------------------------------
 * @param {Object} hotspotA 
 * @param {Object} hotspotB 
 * @returns {number} distance in kilometers
 */
function calculateDistanceKm(hotspotA, hotspotB) {
    if (typeof window.turf === 'undefined') {
        console.warn("Turf.js not found. Using fallback zero distance.");
        return 0; // Fallback if Turf fails to load
    }
    
    const pointA = turf.point([hotspotA.longitude, hotspotA.latitude]);
    const pointB = turf.point([hotspotB.longitude, hotspotB.latitude]);
    
    return turf.distance(pointA, pointB, { units: "kilometers" });
}

/**
 * ------------------------------------------------------------
 * Generate a consistent date string for unique day counting.
 * 
 * WHY:
 * We need to count calendar days, not just raw timestamps,
 * to prevent multiple satellite passes on the same day from
 * inflating the persistence score.
 * ------------------------------------------------------------
 */
function getDateKey(dateString) {
    if (!dateString) return "unknown";
    return String(dateString).split('T')[0]; // Extract YYYY-MM-DD
}

/**
 * ------------------------------------------------------------
 * Group nearby historical detections into persistent Thermal Events.
 * 
 * WHAT:
 * Takes an array of clean historical detections and groups them
 * into "Events" based on spatial proximity (radius).
 * 
 * HOW:
 * 1. Sort detections chronologically.
 * 2. Loop through detections. For each one, see if it falls within
 *    the radius of an existing event group.
 * 3. If yes, add it to the group. If no, start a new group.
 * ------------------------------------------------------------
 */
function groupNearbyDetections(detections, radiusKm = DEFAULT_GROUPING_RADIUS_KM) {
    if (!detections || detections.length === 0) return [];

    // 1. Sort chronologically
    // We sort the array so the oldest detections are processed first.
    // This allows us to properly calculate firstDetection and lastDetection.
    const sortedDetections = [...detections].sort((a, b) => {
        return new Date(a.date) - new Date(b.date);
    });

    const groups = [];

    // 2. Spatial grouping
    for (const detection of sortedDetections) {
        let addedToGroup = false;

        // Try to match with an existing group
        for (const group of groups) {
            // Compare against the group's "center" (the first detection)
            const dist = calculateDistanceKm(detection, group.detections[0]);
            
            if (dist <= radiusKm) {
                group.detections.push(detection);
                addedToGroup = true;
                break;
            }
        }

        // 3. Create a new group if no match
        if (!addedToGroup) {
            groups.push({
                eventId: `TX-EV-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
                detections: [detection]
            });
        }
    }

    return groups;
}

/**
 * ------------------------------------------------------------
 * Build final metadata for a thermal event group.
 * 
 * WHAT:
 * Calculates unique days, detection counts, and dates.
 * This information will be consumed by Role 5 (Classification).
 * ------------------------------------------------------------
 */
function buildThermalEvent(group) {
    const detections = group.detections;
    
    // Arrays were sorted chronologically in the previous step
    const firstDetection = detections[0].date;
    const lastDetection = detections[detections.length - 1].date;
    const detectionCount = detections.length;

    // Calculate unique calendar days using a Set
    const uniqueDaysSet = new Set();
    for (const d of detections) {
        uniqueDaysSet.add(getDateKey(d.date));
    }
    const uniqueDays = uniqueDaysSet.size;

    // Use the latest detection as the representative state for UI
    const latest = detections[detections.length - 1];

    return {
        id: group.eventId,
        latitude: latest.latitude,
        longitude: latest.longitude,
        brightness: latest.brightness,
        frp: latest.frp,
        confidence: latest.confidence,
        date: latest.date,
        satellite: latest.satellite,
        
        // Persistence metadata added for Role 5 to use later
        persistence: {
            detectionCount: detectionCount,
            uniqueDays: uniqueDays,
            firstDetection: firstDetection,
            lastDetection: lastDetection
        }
    };
}

/**
 * ------------------------------------------------------------
 * MAIN PIPELINE FOR DAY 3 HISTORICAL PROCESSING
 * 
 * WHAT:
 * Orchestrates the entire Day 3 workflow.
 * Cleans -> Sorts -> Groups Spatially -> Builds Event Metadata
 * ------------------------------------------------------------
 */
function processHistoricalDetections(rawHistoricalDetections) {
    if (!rawHistoricalDetections || rawHistoricalDetections.length === 0) return [];

    // 1. Clean the raw data using Day 2 logic
    const cleanDetections = processHotspotData(rawHistoricalDetections);
    
    // 2. Group spatially
    const grouped = groupNearbyDetections(cleanDetections, DEFAULT_GROUPING_RADIUS_KM);
    
    // 3. Build final thermal events with persistence metadata
    const thermalEvents = grouped.map(group => buildThermalEvent(group));
    
    console.log(`[Day 3] Processed ${cleanDetections.length} detections into ${thermalEvents.length} persistent thermal events.`);
    
    return thermalEvents;
}


// ============================================================================
// EXPOSE API FOR OTHER ROLES
// ============================================================================

window.ThermalXProcessing = {
    isValidCoordinate,
    hasRequiredFields,
    createHotspotKey,
    isDuplicateHotspot,
    cleanHotspotRecord,
    createHotspot, // Exported for Day 1 API integration
    processHotspotData,
    saveHotspots,
    loadHotspots,
    
    // Day 3 Spatial/Temporal Exports
    DEFAULT_GROUPING_RADIUS_KM,
    calculateDistanceKm,
    getDateKey,
    groupNearbyDetections,
    buildThermalEvent,
    processHistoricalDetections,
    
    processingStats,
    TEST_RAW_HOTSPOTS
};
