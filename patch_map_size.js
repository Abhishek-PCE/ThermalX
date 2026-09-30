const fs = require('fs');
let mapJs = fs.readFileSync('js/map.js', 'utf8');

const oldInit = `    function initMap(containerId = 'map') {
        // Default center (e.g., India) and zoom
        const defaultCenter = [20.5937, 78.9629];
        const defaultZoom = 5;

        // Initialize the map object
        map = L.map(containerId).setView(defaultCenter, defaultZoom);`;

const newInit = `    function initMap(containerId = 'map') {
        // Default center (e.g., India) and zoom
        const defaultCenter = [20.5937, 78.9629];
        const defaultZoom = 5;

        // Initialize the map object
        map = L.map(containerId).setView(defaultCenter, defaultZoom);
        
        // Ensure map renders properly in flex/grid layouts
        setTimeout(() => {
            if (map) map.invalidateSize();
        }, 100);
        setTimeout(() => {
            if (map) map.invalidateSize();
        }, 1000);`;

mapJs = mapJs.replace(oldInit, newInit);
fs.writeFileSync('js/map.js', mapJs);
console.log("Patched map.invalidateSize()");
