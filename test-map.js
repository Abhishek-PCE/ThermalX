const fs = require('fs');
global.window = {};
global.document = {
    addEventListener: () => {}
};
global.L = { 
    layerGroup: () => ({ addTo: () => {}, clearLayers: () => {}, getBounds: () => ({}) }), 
    featureGroup: () => ({ addTo: () => {}, clearLayers: () => {}, addLayer: () => {} }), 
    divIcon: (opts) => ({ type: 'divIcon', options: opts }),
    map: () => ({ setView: () => {}, addLayer: () => {}, fitBounds: () => {} }),
    control: { layers: () => ({ addTo: () => {} }) },
    tileLayer: () => ({ addTo: () => {} }),
    marker: (coords, opts) => {
        let _icon = opts ? opts.icon : null;
        let _popup = "";
        return { 
            addTo: () => {}, 
            bindPopup: (html) => { _popup = html; }, 
            on: () => {},
            setIcon: (icon) => { _icon = icon; },
            options: { icon: _icon },
            getPopup: () => _popup
        };
    },
    circleMarker: () => ({ bindPopup: () => ({ addTo: () => {} }) })
};

eval(fs.readFileSync('js/map.js', 'utf8'));

const testHotspots = [
    { eventId: "TX-001", latitude: 20.0, longitude: 80.0, detectionCount: 5, frp: 10, brightness: 300, confidence: 90, uniqueDays: 3, persistenceScore: 50, firstDetection: "2026-09-10", lastDetection: "2026-09-15" }
];

window.MapModule.renderHotspots(testHotspots);
console.log("Map rendered successfully.");
