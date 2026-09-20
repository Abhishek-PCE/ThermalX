const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');

html = html.replace('<!-- ==================== HOTSPOT DETAILS PANEL ==================== -->', '<!-- ==================== THERMAL EVENT PANEL ==================== -->');
html = html.replace('This sidebar panel displays detailed information about a selected thermal hotspot.', 'This sidebar panel displays detailed information about a selected thermal event (a cluster of hotspots over time).');

fs.writeFileSync('index.html', html);
