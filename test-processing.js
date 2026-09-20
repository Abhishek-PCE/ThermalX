// ============================================================================
// DAY 5 ROLE 6: INTEGRATION, TESTING & DEPLOYMENT LEAD
// AUTOMATED TEST SUITE FOR THERMAL EVENT CLUSTERING
// ============================================================================

// ------------------------------------------------------------
// 1. SETUP ENVIRONMENT
// We mock Turf.js and minimal DOM to test processing.js in Node.js
// ------------------------------------------------------------
global.turf = {
    distance: function(pt1, pt2, options) {
        // Simple Haversine distance mock for Turf.distance
        const lat1 = pt1.geometry.coordinates[1];
        const lon1 = pt1.geometry.coordinates[0];
        const lat2 = pt2.geometry.coordinates[1];
        const lon2 = pt2.geometry.coordinates[0];
        const R = 6371; // km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    },
    point: function(coords) {
        return { geometry: { coordinates: coords } };
    }
};

global.window = { turf: global.turf };

const fs = require('fs');
let processingCode = fs.readFileSync('js/processing.js', 'utf8');

// Evaluate the processing module
try {
    eval(processingCode);
} catch (e) {
    console.error("Error evaluating processing.js", e);
    process.exit(1);
}

const processor = window.ThermalXProcessing;
let testsPassed = 0;
let testsFailed = 0;

function assert(condition, message) {
    if (condition) {
        console.log("✅ PASS:", message);
        testsPassed++;
    } else {
        console.error("❌ FAIL:", message);
        testsFailed++;
    }
}

console.log("\n--- STARTING ROLE 6 DAY 5 TESTS ---\n");

// ============================================================================
// TEST 1: EMPTY HOTSPOT ARRAY
// ============================================================================
try {
    const emptyResult = processor.processHistoricalDetections([]);
    assert(Array.isArray(emptyResult) && emptyResult.length === 0, "Empty hotspot array should return empty event array without crashing.");
} catch (e) {
    assert(false, "Empty hotspot array crashed: " + e.message);
}

// ============================================================================
// TEST 2: ONE VALID HOTSPOT
// ============================================================================
const oneHotspot = [{
    id: "H1", latitude: 20.0, longitude: 80.0, date: "2026-09-10", brightness: 300, frp: 10, confidence: 100
}];
try {
    const oneResult = processor.processHistoricalDetections(oneHotspot);
    assert(oneResult.length === 1, "One valid hotspot returns one thermal event.");
    assert(oneResult[0].detectionCount === 1, "Single hotspot event has detectionCount = 1.");
    assert(oneResult[0].uniqueDays === 1, "Single hotspot event has uniqueDays = 1.");
    assert(oneResult[0].persistenceScore === 100, "Single hotspot event has persistenceScore = 100% (1 unique day / 1 analysed day).");
} catch (e) {
    assert(false, "Single hotspot test crashed: " + e.message);
}

// ============================================================================
// TEST 3: MULTIPLE DETECTIONS AT THE SAME LOCATION
// ============================================================================
const multipleSameLocation = [
    { id: "H1", latitude: 20.0, longitude: 80.0, date: "2026-09-10T10:00:00Z", brightness: 300, frp: 10, confidence: 100 },
    { id: "H2", latitude: 20.0, longitude: 80.0, date: "2026-09-10T11:00:00Z", brightness: 310, frp: 12, confidence: 90 },
    { id: "H3", latitude: 20.0001, longitude: 80.0001, date: "2026-09-10T12:00:00Z", brightness: 320, frp: 14, confidence: 80 }
];
try {
    const sameLocResult = processor.processHistoricalDetections(multipleSameLocation);
    assert(sameLocResult.length === 1, "Multiple extremely close detections grouped into 1 thermal event.");
    assert(sameLocResult[0].detectionCount === 3, "detectionCount correctly calculated as 3.");
    assert(sameLocResult[0].uniqueDays === 1, "uniqueDays correctly calculated as 1 since they occur on the same day.");
    assert(sameLocResult[0].persistenceScore === 100, "Persistence should be 100%.");
    assert(Math.round(sameLocResult[0].averageFRP) === 12, "Average FRP should be correctly calculated ((10+12+14)/3).");
} catch (e) {
    assert(false, "Multiple same location test crashed: " + e.message);
}

// ============================================================================
// TEST 4: SAME LOCATION ACROSS MULTIPLE DAYS (TEMPORAL GROUPING)
// ============================================================================
const sameLocationMultiDay = [
    { id: "H1", latitude: 20.0, longitude: 80.0, date: "2026-09-10", brightness: 300, frp: 10, confidence: 100 },
    { id: "H2", latitude: 20.0, longitude: 80.0, date: "2026-09-12", brightness: 310, frp: 12, confidence: 90 },
    { id: "H3", latitude: 20.0, longitude: 80.0, date: "2026-09-14", brightness: 320, frp: 14, confidence: 80 }
];
try {
    const multiDayResult = processor.processHistoricalDetections(sameLocationMultiDay);
    assert(multiDayResult.length === 1, "Same location across multiple days grouped into 1 thermal event.");
    assert(multiDayResult[0].detectionCount === 3, "detectionCount is 3.");
    assert(multiDayResult[0].uniqueDays === 3, "uniqueDays is 3.");
    assert(multiDayResult[0].persistenceScore === 60, "Persistence is 60%.");
} catch (e) {
    assert(false, "Multi day test crashed: " + e.message);
}

// ============================================================================
// TEST 5: TWO GEOGRAPHICALLY SEPARATE EVENTS
// ============================================================================
const separateEvents = [
    { id: "A1", latitude: 20.0, longitude: 80.0, date: "2026-09-10", brightness: 300, frp: 10, confidence: 100 },
    { id: "A2", latitude: 20.01, longitude: 80.01, date: "2026-09-11", brightness: 300, frp: 10, confidence: 100 },
    { id: "B1", latitude: 25.0, longitude: 85.0, date: "2026-09-10", brightness: 300, frp: 10, confidence: 100 },
    { id: "B2", latitude: 25.0, longitude: 85.0, date: "2026-09-12", brightness: 300, frp: 10, confidence: 100 }
];
try {
    const separateResult = processor.processHistoricalDetections(separateEvents);
    assert(separateResult.length === 2, "Geographically separate hotspots grouped into exactly 2 events.");
} catch (e) {
    assert(false, "Separate events test crashed: " + e.message);
}

// ============================================================================
// TEST 6, 7 & 8: INVALID COORDINATES, DUPLICATES, UNSORTED
// ============================================================================
const messyData = [
    { id: "C3", latitude: 20.0, longitude: 80.0, date: "2026-09-15", brightness: 300, frp: 10, confidence: 100 }, 
    { id: "C1", latitude: 20.0, longitude: 80.0, date: "2026-09-10", brightness: 300, frp: 10, confidence: 100 },
    { id: "C2", latitude: 20.0, longitude: 80.0, date: "2026-09-10", brightness: 300, frp: 10, confidence: 100 }, 
    { id: "BAD1", latitude: null, longitude: 80.0, date: "2026-09-11", brightness: 300, frp: 10, confidence: 100 }, 
    { id: "BAD2", latitude: 900, longitude: 80.0, date: "2026-09-12", brightness: 300, frp: 10, confidence: 100 } 
];
try {
    const messyResult = processor.processHistoricalDetections(messyData);
    assert(messyResult.length === 1, "Messy data should output exactly 1 valid event after cleaning.");
    assert(messyResult[0].firstDetection === "2026-09-10", "firstDetection handles unsorted properly.");
    assert(messyResult[0].lastDetection === "2026-09-15", "lastDetection handles unsorted properly.");
    assert(messyResult[0].detectionCount === 2, "Duplicate dropped, count is 2 (C1 and C3).");
} catch (e) {
    assert(false, "Messy data test crashed: " + e.message);
}

console.log("\n--- TEST SUMMARY ---");
console.log(`Passed: ${testsPassed}`);
console.log(`Failed: ${testsFailed}`);
if (testsFailed > 0) {
    process.exit(1);
} else {
    console.log("ALL DAY 5 INTEGRATION TESTS PASSED!");
}
