const fs = require('fs');

global.window = {};
eval(fs.readFileSync('js/classification.js', 'utf8'));

const testEventNormal = {
    eventId: "TX-001",
    persistenceScore: 65.5,
    detectionCount: 8,
    frp: 42.5,
    confidence: 87,
    industrialContext: {
        nearestFacility: { distanceFromHotspot: 1.2 }
    }
};

const testEventNoFacility = {
    eventId: "TX-002",
    persistenceScore: 30,
    detectionCount: 2,
    frp: 10,
    confidence: 50
    // no industrialContext
};

const testEventMissingFRP = {
    eventId: "TX-003",
    persistenceScore: 100,
    detectionCount: 5,
    confidence: 90,
    industrialContext: { distance: 3.5 },
    detections: [
        { frp: null },
        { frp: undefined },
        { frp: "invalid" }
    ]
};

const testEventMixedFRP = {
    eventId: "TX-004",
    persistenceScore: 10,
    detectionCount: 3,
    confidence: 50,
    detections: [
        { frp: 20 },
        { frp: 40 },
        { frp: null },
        { frp: "invalid" },
        { frp: 60 }
    ]
};

const testEventMissingConfidence = {
    eventId: "TX-005",
    persistenceScore: 10,
    detectionCount: 3,
    frp: 15,
    detections: [
        { confidence: null },
        { confidence: undefined }
    ]
};

const testEventCategoricalConfidence = {
    eventId: "TX-006",
    persistenceScore: 10,
    detectionCount: 3,
    frp: 15,
    detections: [
        { confidence: 'high' },
        { confidence: 'nominal' }
    ]
};

console.log("TEST 1 - Normal:", window.ThermalXClassification.createEvidenceObject(testEventNormal));
console.log("TEST 2 - No Facility:", window.ThermalXClassification.createEvidenceObject(testEventNoFacility));
console.log("TEST 3 - Missing FRP:", window.ThermalXClassification.createEvidenceObject(testEventMissingFRP));
console.log("TEST 4 - Mixed FRP:", window.ThermalXClassification.createEvidenceObject(testEventMixedFRP));
console.log("TEST 5 - Missing Confidence:", window.ThermalXClassification.createEvidenceObject(testEventMissingConfidence));
console.log("TEST 6 - Categorical Confidence:", window.ThermalXClassification.createEvidenceObject(testEventCategoricalConfidence));

