const fs = require('fs');
global.window = {};
global.turf = {
    point: (coords) => coords,
    distance: (p1, p2, options) => {
        return Math.abs(p1[0] - p2[0]) * 100;
    }
};

eval(fs.readFileSync('js/processing.js', 'utf8'));

const testHotspots = [
    { id: "A1", latitude: 20.0, longitude: 80.0, date: "2026-09-10", frp: 10, brightness: 300, confidence: 90 },
    { id: "A2", latitude: 20.0, longitude: 80.0, date: "2026-09-10", frp: 20, brightness: 320, confidence: 95 },
    { id: "A3", latitude: 20.0, longitude: 80.0, date: "2026-09-11", frp: 15, brightness: 310, confidence: 85 },
    { id: "B1", latitude: 40.0, longitude: 100.0, date: "2026-09-15", frp: 5, brightness: 290, confidence: 50 },
];

const events = window.ThermalXProcessing.processHistoricalDetections(testHotspots);
console.log(events);
