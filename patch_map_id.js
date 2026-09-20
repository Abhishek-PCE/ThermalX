const fs = require('fs');
let mapJs = fs.readFileSync('js/map.js', 'utf8');

const oldMarker1 = `marker = L.marker([hotspot.latitude, hotspot.longitude], { icon: eventIcon });`;
const newMarker1 = `marker = L.marker([hotspot.latitude, hotspot.longitude], { icon: eventIcon, hotspotId: hotspot.id });`;

const oldMarker2 = `marker = L.marker([hotspot.latitude, hotspot.longitude]);`;
const newMarker2 = `marker = L.marker([hotspot.latitude, hotspot.longitude], { hotspotId: hotspot.id });`;

mapJs = mapJs.replace(oldMarker1, newMarker1).replace(oldMarker2, newMarker2);
fs.writeFileSync('js/map.js', mapJs);
console.log("Patched marker IDs in map.js");
