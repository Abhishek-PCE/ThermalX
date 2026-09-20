const fs = require('fs');

let code = fs.readFileSync('js/app.js', 'utf8');

// Patch ID creation
code = code.replace(
    'const hotspotId = hotspot.id ||',
    'const hotspotId = hotspot.eventId || hotspot.id ||'
);

// Patch Brightness
code = code.replace(
    'const brightnessVal = hotspot.brightness !== undefined ? hotspot.brightness : (hotspot.bright_ti4 !== undefined ? hotspot.bright_ti4 : null);',
    'const brightnessVal = hotspot.averageBrightness !== undefined ? hotspot.averageBrightness : (hotspot.brightness !== undefined ? hotspot.brightness : (hotspot.bright_ti4 !== undefined ? hotspot.bright_ti4 : null));'
);

// Patch FRP
code = code.replace(
    'const frpVal = hotspot.frp !== undefined ? hotspot.frp : null;',
    'const frpVal = hotspot.averageFRP !== undefined ? hotspot.averageFRP : (hotspot.frp !== undefined ? hotspot.frp : null);'
);

// Insert UI updates for detection count, unique days, recurrence
code = code.replace(
    "setElementText('event-brightness', formatThermalValue(brightnessVal, 'K'));",
    `setElementText('event-brightness', formatThermalValue(brightnessVal, 'K'));
        setElementText('history-detection-count', hotspot.detectionCount !== undefined ? hotspot.detectionCount : (hotspot.detections ? hotspot.detections.length : "N/A"));
        setElementText('history-unique-days', hotspot.uniqueDays !== undefined ? hotspot.uniqueDays : "N/A");
        setElementText('history-recurrence-rate', hotspot.recurrenceRate !== undefined ? \`\${(hotspot.recurrenceRate * 100).toFixed(0)}%\` : "N/A");`
);

// Patch renderEventHistory
code = code.replace(
    `if (event.persistence && event.persistence.firstDetection) {
        setElementText('history-first-date', formatDateString(event.persistence.firstDetection));
        setElementText('history-last-date', formatDateString(event.persistence.lastDetection));`,
    `if (event.firstDetection) {
        setElementText('history-first-date', formatDateString(event.firstDetection));
        setElementText('history-last-date', formatDateString(event.lastDetection));
    } else if (event.persistence && event.persistence.firstDetection) {
        setElementText('history-first-date', formatDateString(event.persistence.firstDetection));
        setElementText('history-last-date', formatDateString(event.persistence.lastDetection));`
);

// Patch renderPersistence
code = code.replace(
    `// If Role 5 generated persistenceData during classification`,
    `if (event.persistenceScore !== undefined) {
        score = event.persistenceScore;
        category = "EVALUATED";
        if (score > 80) category = "VERY HIGH";
        else if (score > 50) category = "HIGH";
        else if (score > 20) category = "MODERATE";
        else category = "LOW";
        evidence = \`\${event.uniqueDays || 'Multiple'} unique days\`;
    }
    // If Role 5 generated persistenceData during classification`
);

fs.writeFileSync('js/app.js', code);
console.log("app.js patched.");
