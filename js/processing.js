/**
 * ThermalX - Day 1 Role 4
 * Data Processing & Data Quality
 * 
 * This file handles transforming raw NASA FIRMS data into a clean, 
 * validated, and standardized format that can be used by the rest 
 * of the ThermalX frontend (Map, Dashboard, etc.).
 */

// ============================================================================
// MOCK TEST DATA
// ============================================================================

// TEST DATA: This is mock data mimicking raw NASA FIRMS output.
// It is used for testing the processing pipeline before the real API is integrated.
const TEST_RAW_HOTSPOTS = [
    {
        latitude: "23.4567", // Note: String representation
        longitude: "87.1234",
        brightness: 320.5,
        frp: "45.2",
        confidence: "nominal",
        acq_date: "2026-09-15", // Note: Different field name
        satellite: "VIIRS"
    },
    {
        latitude: 23.45672, // Duplicate of above due to rounding
        longitude: 87.12341,
        brightness: 310.2,
        frp: 40.1,
        confidence: "nominal",
        acq_date: "2026-09-15",
        satellite: "VIIRS"
    },
    {
        latitude: -100, // Invalid latitude (out of bounds)
        longitude: 87.1234,
        brightness: 300,
        frp: 20,
        confidence: "low",
        acq_date: "2026-09-15",
        satellite: "MODIS"
    },
    {
        latitude: 24.1234,
        longitude: 88.5678,
        brightness: 330.1,
        // frp missing, which is okay
        confidence: "high",
        acq_date: "2026-09-15",
        satellite: "VIIRS"
    }
];

// ============================================================================
// CORE PROCESSING FUNCTIONS
// ============================================================================

/**
 * Validates a single normalized hotspot object.
 * 
 * Why it exists: To ensure that no malformed data reaches the map or dashboard,
 * which could cause errors or misleading visualizations.
 * 
 * @param {Object} hotspot - The normalized hotspot object.
 * @returns {boolean} - True if valid, false if invalid.
 */
function validateHotspot(hotspot) {
    // Latitude must exist, be numeric, and be between -90 and 90
    if (typeof hotspot.latitude !== 'number' || isNaN(hotspot.latitude)) return false;
    if (hotspot.latitude < -90 || hotspot.latitude > 90) return false;

    // Longitude must exist, be numeric, and be between -180 and 180
    if (typeof hotspot.longitude !== 'number' || isNaN(hotspot.longitude)) return false;
    if (hotspot.longitude < -180 || hotspot.longitude > 180) return false;

    // A date must exist (we need to know when it happened)
    if (!hotspot.date) return false;

    // If it passes all critical checks, it's valid
    return true;
}

/**
 * Normalizes a raw hotspot record into the standardized ThermalX format.
 * 
 * Why it exists: NASA FIRMS data can come in different formats (CSV, JSON) 
 * and field names might vary (e.g., 'acq_date' vs 'date', strings instead of numbers).
 * Keeping one common structure makes it easier for the map, dashboard and analysis modules 
 * to use hotspot data consistently.
 * 
 * @param {Object} raw - The raw hotspot object.
 * @returns {Object} - The standardized hotspot object.
 */
function normalizeHotspot(raw) {
    // Generate a simple unique ID for this session if one isn't provided
    const generateId = () => `TX-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Create the standardized object
    return {
        id: raw.id || generateId(),
        // Convert strings to numbers for coordinates
        latitude: parseFloat(raw.latitude),
        longitude: parseFloat(raw.longitude),
        
        // Brightness and FRP are optional but should be numbers if they exist
        brightness: raw.brightness !== undefined ? parseFloat(raw.brightness) : null,
        frp: raw.frp !== undefined ? parseFloat(raw.frp) : null,
        
        // Preserve confidence exactly as provided by FIRMS
        confidence: raw.confidence || "unknown",
        
        // Map common date fields to our standard 'date' field
        date: raw.acq_date || raw.date || raw.timestamp || null,
        
        // Preserve satellite information if available
        satellite: raw.satellite || raw.instrument || "unknown"
    };
}

/**
 * Removes duplicate hotspots based on proximity and time.
 * 
 * Why it exists: Satellites often detect the same fire multiple times in one pass,
 * or different satellites detect the same fire. We don't want to clutter the map
 * with multiple overlapping points for the exact same event.
 * 
 * @param {Array} hotspots - Array of validated, normalized hotspots.
 * @returns {Array} - Array of unique hotspots.
 */
function removeDuplicates(hotspots) {
    const uniqueMap = new Map();

    hotspots.forEach(hotspot => {
        // Round the coordinates to 2 decimal places (approx 1.1km precision).
        // This ensures that tiny floating-point differences do not cause 
        // the same hotspot to be treated as multiple different records.
        const roundLat = hotspot.latitude.toFixed(2);
        const roundLon = hotspot.longitude.toFixed(2);
        
        // Create a unique key combining location and date
        const key = `${roundLat}_${roundLon}_${hotspot.date}`;

        // If we haven't seen this exact location/date combo, keep it.
        // In the future (Day 2+), we might keep the one with highest FRP instead of just the first one.
        if (!uniqueMap.has(key)) {
            uniqueMap.set(key, hotspot);
        }
    });

    // Convert the Map values back to a clean array
    return Array.from(uniqueMap.values());
}

/**
 * Main processing pipeline for raw NASA FIRMS data.
 * 
 * Why it exists: This is the primary function that Role 3 (API) or Role 6 (Integration)
 * will call. It orchestrates the entire cleaning and structuring process.
 * 
 * @param {Array} rawHotspots - The raw array of data objects.
 * @returns {Array} - The clean, validated, duplicate-free array of hotspot objects.
 */
function processHotspots(rawHotspots) {
    if (!Array.isArray(rawHotspots)) {
        console.error("processHotspots expected an array, got:", typeof rawHotspots);
        return [];
    }

    // Step 1: Normalize all raw records into our standard format
    const normalized = rawHotspots.map(normalizeHotspot);

    // Step 2: Filter out any records that fail strict validation rules
    const validated = normalized.filter(validateHotspot);

    // Step 3: Remove obvious duplicates based on spatial/temporal rounding
    const cleanUnique = removeDuplicates(validated);

    console.log(`Processed Hotspots: Started with ${rawHotspots.length}, finished with ${cleanUnique.length}`);
    return cleanUnique;
}

// ============================================================================
// LOCAL STORAGE MANAGEMENT
// ============================================================================

const STORAGE_KEY = "thermalx_hotspots";

/**
 * Saves processed hotspots to browser localStorage.
 * 
 * Why it exists: To persist data between page reloads without needing a backend database.
 * This is useful for the Day 1 prototype.
 * 
 * @param {Array} hotspots - The clean array of hotspot objects.
 */
function saveHotspots(hotspots) {
    try {
        const jsonString = JSON.stringify(hotspots);
        localStorage.setItem(STORAGE_KEY, jsonString);
        console.log(`Saved ${hotspots.length} hotspots to localStorage.`);
    } catch (error) {
        console.error("Failed to save hotspots to localStorage:", error);
    }
}

/**
 * Loads processed hotspots from browser localStorage.
 * 
 * Why it exists: Allows the dashboard to load immediately with the last known data,
 * providing a faster user experience before the next API fetch completes.
 * 
 * @returns {Array} - The retrieved array of hotspots, or empty array if none found.
 */
function loadHotspots() {
    try {
        const jsonString = localStorage.getItem(STORAGE_KEY);
        if (jsonString) {
            const data = JSON.parse(jsonString);
            console.log(`Loaded ${data.length} hotspots from localStorage.`);
            return data;
        }
    } catch (error) {
        console.error("Failed to load hotspots from localStorage:", error);
    }
    return []; // Return empty array if nothing is saved or parsing fails
}

// ============================================================================
// EXPOSE API FOR OTHER ROLES
// ============================================================================

window.ThermalXProcessing = {
    processHotspots,
    validateHotspot,
    normalizeHotspot,
    removeDuplicates,
    saveHotspots,
    loadHotspots,
    TEST_RAW_HOTSPOTS // Exported for easy testing from console or other modules
};

