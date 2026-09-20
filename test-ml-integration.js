const fs = require('fs');

// Mock DOM
global.document = {
    getElementById: (id) => {
        if (!global.mockDOM[id]) {
            global.mockDOM[id] = { textContent: '', className: '', innerHTML: '' };
        }
        return global.mockDOM[id];
    },
    querySelector: () => null
};
global.mockDOM = {};

global.window = {
    ThermalXUI: {},
    MapModule: {},
    ThermalXProcessing: {},
    ThermalXClassification: {}
};

// Mock fetch for the ML API
global.fetch = async (url, options) => {
    return {
        ok: true,
        json: async () => ({
            prediction: "Industrial",
            probability: 0.95,
            probabilities: { "Industrial": 0.95, "Wildfire": 0.05 },
            features: { "persistence_score": 0.5 },
            model: "Random Forest Mock"
        })
    };
};

try {
    // Load scripts
    eval(fs.readFileSync('js/api.js', 'utf8').replace(/export /g, '').replace(/import.*/g, ''));
    eval(fs.readFileSync('js/classification.js', 'utf8').replace(/import.*/g, ''));
    eval(fs.readFileSync('js/app.js', 'utf8').replace(/import.*/g, ''));

    // Test runMLClassification directly
    async function runTest() {
        const dummyHotspot = { 
            eventId: "TX-999", 
            persistenceScore: 90, 
            detectionCount: 15, 
            averageFRP: 100, 
            confidence: 95 
        };
        const dummyContext = { nearestDistanceKm: 1.2, facilities: [1,2,3] };
        
        console.log("Testing ML pipeline execution...");
        const result = await window.ThermalXClassification.runMLClassification(dummyHotspot, dummyContext);
        console.log("ML Result:", result.category, result.probability);
        if (result.category !== "Industrial") throw new Error("Expected Industrial");
        console.log("Test Passed!");
    }
    
    runTest();
} catch (e) {
    console.error(e);
}
