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
    marker: () => ({ bindPopup: () => ({ addTo: () => {} }), addTo: () => {} }),
    map: () => ({ setView: () => ({}), fitBounds: () => {} }),
    tileLayer: () => ({ addTo: () => {} }),
    control: { layers: () => ({ addTo: () => {} }) },
    divIcon: () => ({})
};
try {
    eval(fs.readFileSync('js/map.js', 'utf8'));
    console.log("Modules loaded.");
    window.MapModule.initMap('test');
    console.log("Map initialized.");

    const facilities = [
        { id: '1', name: 'Test Factory', type: 'Factory', latitude: 10, longitude: 20 },
        { id: '2', name: 'Test Plant', type: 'Power Plant', latitude: 11, longitude: 21, distanceFromHotspot: 1.5 },
        { id: '3', name: 'Invalid', latitude: null, longitude: null }
    ];

    const rendered = window.MapModule.renderIndustrialFacilities(facilities);
    console.log(`Rendered ${rendered} facilities. (Expected 2)`);
    
    window.MapModule.clearIndustrialLayer();
    console.log("Layer cleared.");

    console.log("SUCCESS");
} catch(e) {
    console.error(e);
}
