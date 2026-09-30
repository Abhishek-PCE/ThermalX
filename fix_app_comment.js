const fs = require('fs');
let appJs = fs.readFileSync('js/app.js', 'utf8');

const badString = '// DAY 5 ROLE 3: Use the new clustering integration function\\n            const apiHotspots = await window.ThermalXAPI.getHotspotsForClustering(true);';
const goodString = '// DAY 5 ROLE 3: Use the new clustering integration function\n            const apiHotspots = await window.ThermalXAPI.getHotspotsForClustering(true);';

if (appJs.includes(badString)) {
    appJs = appJs.replace(badString, goodString);
    fs.writeFileSync('js/app.js', appJs);
    console.log("Fixed the commented out fetch call!");
} else {
    console.log("Could not find the bad string");
}
