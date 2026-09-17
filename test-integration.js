const fs = require('fs');

global.window = {};
global.document = {
    getElementById: (id) => ({ 
        textContent: '', 
        innerHTML: '',
        style: {}, 
        addEventListener: () => {}, 
        classList: { add: () => {}, remove: () => {} } 
    }),
    querySelector: () => null,
    addEventListener: () => {}
};
global.L = { 
    layerGroup: () => ({ addTo: () => {}, clearLayers: () => {} }), 
    featureGroup: () => ({ addTo: () => {}, clearLayers: () => {}, addLayer: () => {} }), 
    divIcon: () => ({}),
    map: () => ({ setView: () => {}, addLayer: () => {} }),
    control: { layers: () => ({ addTo: () => {} }) },
    tileLayer: () => ({ addTo: () => {} }),
    marker: () => ({ bindPopup: () => ({ addTo: () => {} }) }),
    circleMarker: () => ({ bindPopup: () => ({ addTo: () => {} }) })
};

// Mock turf
global.turf = {
    point: (coords) => coords,
    distance: (p1, p2, options) => {
        return Math.abs(p1[0] - p2[0]) * 100;
    }
};

try {
    eval(fs.readFileSync('js/processing.js', 'utf8'));
    eval(fs.readFileSync('js/classification.js', 'utf8'));
    eval(fs.readFileSync('js/map.js', 'utf8'));
    eval(fs.readFileSync('js/api.js', 'utf8').replace(/export /g, ''));
    eval(fs.readFileSync('js/app.js', 'utf8').replace(/import.*?['"];/g, ''));
    
    console.log("Modules loaded successfully.");
    
    // Simulate flow
    const hotspot = { id: 'test-1', latitude: 20, longitude: 80, date: '2026-09-17' };
    
    const rawFacilities = [
        { id: 1, name: 'Fac 1', type: 'Factory', latitude: 20, longitude: 80.01 },
        { id: 2, name: 'Fac 2', type: 'Mine', latitude: 20, longitude: 80.05 }
    ];
    
    const processedContext = window.ThermalXProcessing.processIndustrialProximity(hotspot, rawFacilities);
    console.log(`Nearest Facility: ${processedContext.nearestFacility.name} at ${processedContext.nearestDistanceKm} km`);
    
    const classification = window.ThermalXClassification.evaluateIndustrialContext(processedContext);
    console.log(`Classification: ${classification.category} - ${classification.score}`);
    
    const renderedCount = window.MapModule.renderIndustrialFacilities(processedContext.facilities);
    console.log(`Rendered Facilities on map: ${renderedCount}`);
    
    renderIndustrialFacilitiesUI(processedContext.facilities);
    console.log("UI updated.");
    
    console.log("INTEGRATION TEST PASSED");

} catch (e) {
    console.error("TEST FAILED:", e);
}
