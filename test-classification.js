const fs = require('fs');

global.window = {};
global.document = {
    getElementById: () => ({ textContent: '', style: {}, addEventListener: () => {}, classList: { add: () => {}, remove: () => {} } }),
    querySelector: () => null,
    addEventListener: () => {}
};
global.L = { layerGroup: () => ({}), featureGroup: () => ({}), divIcon: () => ({}) };

try {
    eval(fs.readFileSync('js/classification.js', 'utf8'));

    const testCases = [
        {
            name: "Very Close",
            context: {
                nearestFacility: { name: "Close Factory", type: "factory", distanceFromHotspot: 1.2 },
                facilities: [{ name: "Close Factory" }]
            }
        },
        {
            name: "Moderate",
            context: {
                nearestFacility: { name: "Med Plant", type: "power_plant", distanceFromHotspot: 3.5 },
                facilities: [{ name: "Med Plant" }]
            }
        },
        {
            name: "Far",
            context: {
                nearestFacility: { name: "Far Mine", type: "mine", distanceFromHotspot: 8.0 },
                facilities: [{ name: "Far Mine" }]
            }
        },
        {
            name: "No Facility",
            context: {
                nearestFacility: null,
                facilities: []
            }
        },
        {
            name: "Invalid Distance",
            context: {
                nearestFacility: { name: "Bad Math", type: "factory", distanceFromHotspot: -4 },
                facilities: [{ name: "Bad Math" }]
            }
        },
        {
            name: "Missing Distance",
            context: {
                nearestFacility: { name: "Null Math", type: "factory", distanceFromHotspot: null },
                facilities: [{ name: "Null Math" }]
            }
        }
    ];

    testCases.forEach(tc => {
        console.log(`\nTesting: ${tc.name}`);
        const result = window.ThermalXClassification.evaluateIndustrialContext(tc.context);
        console.log(`Category: ${result.category}`);
        console.log(`Score: ${result.score}`);
        console.log(`Evidence: ${result.evidence[0].description}`);
    });

} catch (e) {
    console.error("TEST FAILED:", e);
}
