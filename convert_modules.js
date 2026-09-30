const fs = require('fs');

// 1. Convert api.js
let apiJs = fs.readFileSync('js/api.js', 'utf8');
apiJs = apiJs.replace(/export async function/g, 'async function');

const exportBlock = `
// Expose API functions globally for local file:// usage
window.ThermalXAPI = {
    fetchFIRMSData,
    fetchHistoricalFirmsData,
    fetchNearbyIndustrialFacilities,
    getHotspotsForClustering
};
`;
if (!apiJs.includes('window.ThermalXAPI')) {
    apiJs += exportBlock;
}
fs.writeFileSync('js/api.js', apiJs);

// 2. Convert app.js
let appJs = fs.readFileSync('js/app.js', 'utf8');
appJs = appJs.replace(/import \{.*\} from '.\/api.js';/g, '');

// Replace function calls
appJs = appJs.replace(/fetchFIRMSData\(/g, 'window.ThermalXAPI.fetchFIRMSData(');
appJs = appJs.replace(/fetchNearbyIndustrialFacilities\(/g, 'window.ThermalXAPI.fetchNearbyIndustrialFacilities(');
appJs = appJs.replace(/getHotspotsForClustering\(/g, 'window.ThermalXAPI.getHotspotsForClustering(');

fs.writeFileSync('js/app.js', appJs);

// 3. Convert index.html
let html = fs.readFileSync('index.html', 'utf8');
html = html.replace('<script type="module" src="js/app.js"></script>', '<script src="js/app.js"></script>');

// Make sure js/api.js is in the HTML
if (!html.includes('<script src="js/api.js"></script>')) {
    html = html.replace('<script src="js/processing.js"></script>', '<script src="js/api.js"></script>\n    <script src="js/processing.js"></script>');
}
fs.writeFileSync('index.html', html);

console.log("Converted ES6 modules to global scripts");
