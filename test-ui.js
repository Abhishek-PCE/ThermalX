const fs = require('fs');

global.document = {
    elements: {},
    getElementById: function(id) {
        if (!this.elements[id]) {
            this.elements[id] = { textContent: '', innerHTML: '', style: {} };
        }
        return this.elements[id];
    },
    querySelectorAll: () => []
};

global.window = {
    MapModule: {
        renderHistoricalDetections: () => {},
        fitMapToHistoricalDetections: () => {},
        clearHistoricalDetections: () => {},
        clearIndustrialLayer: () => {},
        renderIndustrialFacilities: () => {}
    },
    ThermalXProcessing: {
        processIndustrialProximity: (h, f) => ({ facilities: f, nearestFacility: f[0] })
    },
    ThermalXClassification: {
        evaluateIndustrialContext: () => null
    }
};

global.currentHotspotContextId = null;
global.isNaN = isNaN;
global.Number = Number;
global.String = String;

// We just need a few basic methods mocked from app.js to test our modified lines.
let appCode = fs.readFileSync('js/app.js', 'utf8');
// Stub out fetch API
appCode = appCode.replace('fetchNearbyIndustrialFacilities(', 'Promise.resolve([]).then(');

try {
    eval(appCode);
} catch (e) {
    console.error("Eval error", e);
}

const testEvent = {
    eventId: "TX-001",
    latitude: 25.5941,
    longitude: 85.1376,
    detections: [],
    detectionCount: 8,
    uniqueDays: 5,
    firstDetection: "2026-09-10",
    lastDetection: "2026-09-14",
    persistenceScore: 62,
    recurrenceRate: 0.62,
    averageFRP: 145.5,
    averageBrightness: 328.4,
    confidence: 85
};

try {
    showHotspotDetails(testEvent);
    console.log("Event ID:", document.elements['event-id'].textContent);
    console.log("Detection Count:", document.elements['history-detection-count'].textContent);
    console.log("Unique Days:", document.elements['history-unique-days'].textContent);
    console.log("Recurrence Rate:", document.elements['history-recurrence-rate'].textContent);
    console.log("Average FRP:", document.elements['event-frp'].textContent);
    console.log("Average Brightness:", document.elements['event-brightness'].textContent);
    console.log("First Date:", document.elements['history-first-date'].textContent);
    console.log("Persistence:", document.elements['history-persistence-score'].textContent);
} catch (e) {
    console.error(e);
}
