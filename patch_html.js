const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');

// Replace "HOTSPOT DETAILS" with "THERMAL EVENT"
html = html.replace('<h2>HOTSPOT DETAILS</h2>', '<h2>THERMAL EVENT</h2>');
html = html.replace('aria-label="Hotspot Details Panel"', 'aria-label="Thermal Event Panel"');
html = html.replace('Select a thermal hotspot on the map to view detailed satellite and thermal intelligence.', 'Choose an event from the map to view its history, persistence, and detection details.');
html = html.replace('No hotspot selected', 'Select a thermal event');
html = html.replace('<span class="tx-card-label">HOTSPOT ID</span>', '<span class="tx-card-label">EVENT ID</span>');

// Add Average Brightness and Average FRP
html = html.replace('<span class="tx-label">Brightness</span>', '<span class="tx-label">Average Brightness</span>');
html = html.replace('<span class="tx-label">FRP (Power)</span>', '<span class="tx-label">Average FRP</span>');

// Add Detection Count and Unique Days to EVENT HISTORY grid
html = html.replace(
    '<div class="tx-data-grid">',
    `<div class="tx-data-grid">
                            <div class="tx-data-item">
                                <span class="tx-label">Detection Count</span>
                                <span class="tx-value" id="history-detection-count">—</span>
                            </div>
                            <div class="tx-data-item">
                                <span class="tx-label">Unique Days</span>
                                <span class="tx-value" id="history-unique-days">—</span>
                            </div>
                            <div class="tx-data-item">
                                <span class="tx-label">Recurrence Rate</span>
                                <span class="tx-value" id="history-recurrence-rate">—</span>
                            </div>`
);

fs.writeFileSync('index.html', html);
console.log("index.html patched.");
