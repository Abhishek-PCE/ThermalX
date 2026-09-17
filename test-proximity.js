const fs = require('fs');

global.window = {};
global.turf = { 
    distance: (p1, p2) => {
        // Mock distance: simply latitude diff * 111
        const latDiff = Math.abs(p1.geometry.coordinates[1] - p2.geometry.coordinates[1]);
        return latDiff * 111.0;
    },
    point: (coords) => ({ type: 'Feature', geometry: { type: 'Point', coordinates: coords } })
}; // mock turf explicitly
global.window.turf = global.turf;

try {
    eval(fs.readFileSync('js/processing.js', 'utf8'));

    const hotspot = { id: 'HS-1', latitude: 10.0, longitude: 20.0 };
    const rawFacilities = [
        { id: '1', name: 'Far Factory', type: 'Factory', latitude: 10.1, longitude: 20.0 }, // ~11 km
        { id: '2', name: 'Near Power Plant', type: 'Power Plant', latitude: 10.01, longitude: 20.0 }, // ~1.11 km
        { id: '3', name: 'Medium Refinery', type: 'Refinery', latitude: 10.03, longitude: 20.0 }, // ~3.33 km
        { id: '4', latitude: null, longitude: null } // invalid
    ];

    console.log("Processing industrial proximity...");
    const result = window.ThermalXProcessing.processIndustrialProximity(hotspot, rawFacilities);
    
    console.log(`Processed ${result.facilities.length} facilities.`);
    console.log(`Nearest Facility: ${result.nearestFacility.name} (${result.nearestDistanceKm.toFixed(2)} km)`);
    console.log(`Proximity Level: ${result.proximityLevel}`);

    // Verify sort order
    console.log(`Sorted order: ${result.facilities.map(f => f.name).join(', ')}`);

} catch (e) {
    console.error("TEST FAILED:", e);
}
