const fs = require('fs');
let appJs = fs.readFileSync('js/app.js', 'utf8');

const oldStateFunc = `function setPanelState(stateId) {
    const states = ['event-state-empty', 'event-state-loading', 'event-state-error', 'event-state-data'];
    states.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = (id === stateId) ? 'flex' : 'none';
    });
}`;

const newStateFunc = `function setPanelState(stateId) {
    const states = ['event-state-empty', 'event-state-loading', 'event-state-error', 'event-state-data'];
    states.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = (id === stateId) ? 'flex' : 'none';
    });
    
    // UI Redesign: Slide panel in and out
    const panel = document.getElementById('event-panel');
    if (panel) {
        if (stateId === 'event-state-empty') {
            panel.classList.remove('active');
        } else {
            panel.classList.add('active');
        }
    }
}`;

if (appJs.includes(oldStateFunc)) {
    appJs = appJs.replace(oldStateFunc, newStateFunc);
    
    // Add event listener for close button if it exists
    appJs += `\n\n// Added during UI Redesign for the close button
document.addEventListener('DOMContentLoaded', () => {
    const closeBtn = document.getElementById('btn-close-details');
    if (closeBtn) {
        closeBtn.addEventListener('click', clearHotspotDetails);
    }
});`;

    fs.writeFileSync('js/app.js', appJs);
    console.log("Successfully patched panel slide-in logic.");
} else {
    console.log("Could not find setPanelState to patch.");
}
