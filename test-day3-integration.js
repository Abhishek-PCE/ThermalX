const fs = require('fs');

global.window = {};
global.document = {
    getElementById: () => ({ textContent: '', style: {}, addEventListener: () => {}, classList: { add: () => {}, remove: () => {} } }),
    querySelector: () => null,
    addEventListener: () => {}
};
global.L = {
    layerGroup: () => ({ addTo: () => {}, clearLayers: () => {} }),
    featureGroup: () => ({ addTo: () => {}, clearLayers: () => {}, getBounds: () => ({ isValid: () => true }) }),
    circleMarker: () => ({ bindPopup: () => ({ addTo: () => {} }) }),
    map: () => ({ setView: () => ({}), fitBounds: () => {} }),
    tileLayer: () => ({ addTo: () => {} }),
    control: { layers: () => ({ addTo: () => {} }) }
};
global.turf = { 
    distance: () => 1.5,
    point: () => ({})
}; // mock turf explicitly
global.window.turf = global.turf;

try {
    eval(fs.readFileSync('js/processing.js', 'utf8'));
    eval(fs.readFileSync('js/classification.js', 'utf8'));
    eval(fs.readFileSync('js/map.js', 'utf8'));

    const rawData = [
        // Event 1 (valid)
        { latitude: 10.0, longitude: 20.0, date: '2026-09-10', frp: 10, brightness: 300, confidence: 90 },
        { latitude: 10.0001, longitude: 20.0, date: '2026-09-11', frp: 12, brightness: 310, confidence: 85 },
        { latitude: 10.0, longitude: 20.0001, date: '2026-09-12', frp: 11, brightness: 305, confidence: 80 },
        { latitude: 10.0, longitude: 20.0, date: '2026-09-13', frp: 10, brightness: 300, confidence: 75 },
        { latitude: 10.0, longitude: 20.0, date: '2026-09-14', frp: 9, brightness: 295, confidence: 90 },
        { latitude: 10.0, longitude: 20.0, date: '2026-09-14T12:00:00Z', frp: 9.5, brightness: 298, confidence: 88 },
        // Invalid
        { latitude: null, longitude: undefined, date: '2026-09-12' }
    ];

    console.log("\n--- TEST 1: Role 4 Data Processing ---");
    const processedEvents = window.ThermalXProcessing.processHistoricalDetections(rawData);
    const event1 = processedEvents[0];
    console.log(`Event 1 unique days: ${event1.persistence.uniqueDays} (Expected: 5)`);
    console.log(`Event 1 total detections: ${event1.persistence.detectionCount} (Expected: 6)`);
    
    console.log("\n--- TEST 2: Role 5 Classification ---");
    const classifiedEvent = window.ThermalXClassification.classifyHotspot(event1);
    console.log(`Event 1 Persistence Score: ${classifiedEvent.persistenceData.persistenceScore}% (Expected: ~71.43%)`);
    console.log(`Event 1 Category: ${classifiedEvent.persistenceData.persistenceCategory} (Expected: HIGH)`);

    console.log("\n--- TEST 3: Role 2 Map Integration ---");
    window.MapModule.initMap('map-id');
    const validRenderCount = window.MapModule.renderHistoricalDetections(event1.detections);
    console.log(`Rendered historical markers: ${validRenderCount} (Expected: 6)`);
    window.MapModule.clearHistoricalDetections();
    console.log("Cleared historical markers.");

    console.log("\nALL TESTS PASSED.");
} catch (e) {
    console.error("TEST FAILED:", e);
}
