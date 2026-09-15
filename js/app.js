/**
 * ThermalX - Day 1 Role 1
 * Frontend Foundation & UI Interactions
 */

// Import the fetch function from our newly created api.js module.
import { fetchFIRMSData } from './api.js';

document.addEventListener('DOMContentLoaded', () => {
    console.log("ThermalX application initialized.");
    initUI();
});

function initUI() {
    // Mobile menu toggle
    const menuBtn = document.getElementById('mobile-menu-btn');
    const nav = document.getElementById('main-nav');
    
    if (menuBtn && nav) {
        menuBtn.addEventListener('click', () => {
            nav.classList.toggle('active');
        });
    }

    // Filter reset button
    const btnReset = document.getElementById('btn-reset-filters');
    if (btnReset) {
        btnReset.addEventListener('click', resetFilters);
    }

    // Hotspot details close / deselect button
    // When the user clicks the '✕' button in the panel header, deselect the hotspot.
    const btnClose = document.getElementById('btn-close-details');
    if (btnClose) {
        btnClose.addEventListener('click', () => {
            clearHotspotDetails();
        });
    }
}

// ============================================================================
// UI STATE MANAGEMENT
// ============================================================================

/**
 * Switches the active state of the event panel
 * @param {string} stateId - 'event-state-empty', 'event-state-loading', 'event-state-error', 'event-state-data'
 */
function setPanelState(stateId) {
    const states = ['event-state-empty', 'event-state-loading', 'event-state-error', 'event-state-data'];
    
    states.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            if (id === stateId) {
                el.classList.add('active');
            } else {
                el.classList.remove('active');
            }
        }
    });
}

function showLoading() {
    setPanelState('event-state-loading');
}

function hideLoading() {
    // Reverts to empty state, displayEvent should be called to show data
    setPanelState('event-state-empty');
}

function showError(message) {
    setPanelState('event-state-error');
    const msgEl = document.getElementById('event-error-message');
    if (msgEl && message) {
        msgEl.textContent = message;
    }
}

// ============================================================================
// HELPER FORMATTING FUNCTIONS
// These small utility functions ensure clean, readable text
// and gracefully handle missing or unexpected values (no undefined or NaN).
// ============================================================================

/**
 * Safely updates an element's textContent by ID if the element exists in the DOM.
 * @param {string} id - HTML element ID
 * @param {string} text - Text content to set
 */
function setElementText(id, text) {
    const el = document.getElementById(id);
    if (el) {
        el.textContent = (text !== undefined && text !== null && text !== "") ? text : "Not available";
    }
}

/**
 * Safely formats a geographic coordinate (latitude or longitude).
 * If the value is missing or not a valid number, returns "Not available".
 * Example: formatCoordinate(21.1458, 'lat') => "21.1458° N"
 */
function formatCoordinate(val, type) {
    if (val === undefined || val === null || val === "" || isNaN(Number(val))) {
        return "Not available";
    }
    const num = Number(val);
    const direction = type === 'lat' ? (num >= 0 ? 'N' : 'S') : (num >= 0 ? 'E' : 'W');
    return `${Math.abs(num).toFixed(4)}° ${direction}`;
}

/**
 * Formats a thermal numeric value with units (e.g., Kelvin or MegaWatts).
 * Handles missing values by returning "Not available" instead of NaN or 0.
 * Example: formatThermalValue(345.1, 'K') => "345.1 K"
 */
function formatThermalValue(val, unit) {
    if (val === undefined || val === null || val === "" || isNaN(Number(val))) {
        return "Not available";
    }
    const num = Number(val);
    return `${num.toFixed(1)} ${unit}`;
}

/**
 * Extracts a clean date string (YYYY-MM-DD) from date field.
 * Handles ISO strings like "2026-09-14T08:30:00Z" or "2026-09-14".
 */
function formatDateString(dateVal) {
    if (!dateVal || dateVal === "unknown") return "Not available";
    if (typeof dateVal === 'string' && dateVal.includes('T')) {
        return dateVal.split('T')[0];
    }
    return String(dateVal);
}

/**
 * Extracts a clean time string (HH:MM UTC) if available.
 * Can extract from an ISO date string or an explicit time property.
 */
function formatTimeString(dateVal, timeVal) {
    if (timeVal !== undefined && timeVal !== null && timeVal !== "" && timeVal !== "unknown") {
        return `${timeVal} UTC`;
    }
    if (typeof dateVal === 'string' && dateVal.includes('T')) {
        const parts = dateVal.split('T');
        if (parts[1]) {
            const timePart = parts[1].replace('Z', '').split(':');
            if (timePart.length >= 2) {
                return `${timePart[0]}:${timePart[1]} UTC`;
            }
        }
    }
    return "Not available";
}

/**
 * Formats confidence rating into human-friendly text.
 * Numeric confidence -> "85%"
 * Text confidence -> "Nominal" / "High" / "Low"
 */
function formatConfidence(conf) {
    if (conf === undefined || conf === null || conf === "" || conf === "unknown") {
        return "Not available";
    }
    if (!isNaN(Number(conf))) {
        return `${Number(conf)}%`;
    }
    const str = String(conf).trim();
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

// ============================================================================
// DATA DISPLAY — HOTSPOT INFORMATION PANEL
// ============================================================================

/*
 * Function: showHotspotDetails()
 * Purpose:
 * Displays the information of the hotspot selected by the user.
 *
 * Input:
 * hotspot - object containing hotspot information (from NASA FIRMS or internal model)
 *
 * What this section does:
 * 1. Switches the panel from empty state to the populated data state.
 * 2. Populates all cards: Summary, Thermal Data, Location, Detection, and Classification.
 * 3. Gracefully substitutes "Not available" for any missing or undefined fields.
 * 4. Shows "Classification: Pending" when Role 5 classification has not yet run.
 *
 * Why it is needed:
 * When a user or SIH evaluator clicks a marker on the map, they need clear,
 * structured, and readable information about that thermal event.
 *
 * How it connects to the rest of the application:
 * Role 2's Leaflet marker click handler calls this function passing the clicked hotspot object.
 */
function showHotspotDetails(hotspot) {
    // If no hotspot was passed (or passed null), return to empty state
    if (!hotspot) {
        clearHotspotDetails();
        return;
    }

    try {
        // Switch the right panel view to show the populated data state
        setPanelState('event-state-data');

        // 1. BASIC INFORMATION & IDENTIFIERS
        const hotspotId = hotspot.id || (hotspot.latitude && hotspot.longitude ? `TX-${Math.abs(hotspot.latitude).toFixed(2)}-${Math.abs(hotspot.longitude).toFixed(2)}` : "TX-UNKNOWN");
        setElementText('event-id', hotspotId);

        // Status badge: "Detected" by default
        setElementText('event-status', hotspot.status || "Detected");

        // Priority badge: defaults to "Normal" or from hotspot.priority
        updatePriority(hotspot.priority || "Normal");

        // Classification: Role 5 handles classification logic.
        // If classification data is present, show it; otherwise show "Pending".
        if (hotspot.classification && hotspot.classification.category && hotspot.classification.category !== "Unknown") {
            updateClassification(hotspot.classification.category, hotspot.classification.confidence);
            setElementText('event-evidence', hotspot.classification.evidence || "Rule-based classification evaluated.");
        } else {
            updateClassification("Pending", undefined);
            setElementText('event-evidence', "Classification pending Role 5 analysis.");
        }

        // 2. THERMAL INFORMATION
        // Brightness in Kelvin (e.g., 345.1 K)
        const brightnessVal = hotspot.brightness !== undefined ? hotspot.brightness : (hotspot.bright_ti4 !== undefined ? hotspot.bright_ti4 : null);
        setElementText('event-brightness', formatThermalValue(brightnessVal, 'K'));

        // Fire Radiative Power (FRP) in MegaWatts (e.g., 12.4 MW)
        const frpVal = hotspot.frp !== undefined ? hotspot.frp : null;
        setElementText('event-frp', formatThermalValue(frpVal, 'MW'));
        setElementText('event-average-frp', formatThermalValue(frpVal, 'MW')); // Backwards compatibility mirror

        // Confidence (e.g., "85%" or "High")
        setElementText('event-confidence', formatConfidence(hotspot.confidence));

        // Quality / Status indicator
        const isHighConfidence = hotspot.confidence && (!isNaN(Number(hotspot.confidence)) ? Number(hotspot.confidence) >= 80 : String(hotspot.confidence).toLowerCase() === 'high');
        setElementText('event-quality', isHighConfidence ? "High Quality" : "Standard Quality");

        // 3. GEOGRAPHIC / LOCATION INFORMATION
        const latText = formatCoordinate(hotspot.latitude, 'lat');
        const lngText = formatCoordinate(hotspot.longitude, 'lng');
        setElementText('event-lat', latText);
        setElementText('event-lng', lngText);

        // Combined coordinates string (e.g., "21.1458, 79.0882")
        const coordsText = (hotspot.latitude !== undefined && hotspot.longitude !== undefined && !isNaN(Number(hotspot.latitude)) && !isNaN(Number(hotspot.longitude)))
            ? `${Number(hotspot.latitude).toFixed(4)}, ${Number(hotspot.longitude).toFixed(4)}`
            : "Not available";
        setElementText('event-location', coordsText);

        // Industrial proximity / facility (from GIS context if available)
        if (hotspot.industrialContext && hotspot.industrialContext.nearestFacility) {
            setElementText('event-facility', hotspot.industrialContext.nearestFacility);
            const dist = hotspot.industrialContext.distance !== undefined ? `${hotspot.industrialContext.distance} km` : "Not available";
            setElementText('event-distance', dist);
        } else {
            setElementText('event-facility', "Not available");
            setElementText('event-distance', "Not available");
        }

        // 4. DETECTION INFORMATION
        // Date (YYYY-MM-DD)
        const dateText = formatDateString(hotspot.date || hotspot.acq_date);
        setElementText('event-date', dateText);

        // Time (HH:MM UTC)
        const timeText = formatTimeString(hotspot.date || hotspot.acq_date, hotspot.time || hotspot.acq_time);
        setElementText('event-time', timeText);

        // Satellite Name (e.g. "Aqua", "Terra", "Suomi NPP", "VIIRS")
        setElementText('event-satellite', hotspot.satellite && hotspot.satellite !== "unknown" ? hotspot.satellite : "Not available");

        // Persistence Information (if available from historical analysis)
        if (hotspot.persistence && hotspot.persistence.score !== undefined) {
            setElementText('event-persistence', `${hotspot.persistence.score}/100`);
            setElementText('event-detection-count', hotspot.persistence.detectionCount || "1");
        } else {
            setElementText('event-persistence', "1 observation");
        }

    } catch (err) {
        console.error("Error in showHotspotDetails():", err);
        showError("Failed to display hotspot details. Please select another hotspot.");
    }
}

/*
 * Function: clearHotspotDetails()
 * Purpose:
 * Clears all values from the hotspot details panel and switches back to
 * the empty state ("No hotspot selected").
 *
 * Why it is needed:
 * Allows the user to reset or dismiss the active selection cleanly.
 */
function clearHotspotDetails() {
    setPanelState('event-state-empty');

    const elementsToClear = [
        'event-id', 'event-status', 'event-priority', 'event-classification',
        'event-confidence', 'event-quality', 'event-brightness', 'event-frp',
        'event-average-frp', 'event-lat', 'event-lng', 'event-location',
        'event-facility', 'event-distance', 'event-date', 'event-time',
        'event-satellite', 'event-persistence', 'event-evidence'
    ];

    elementsToClear.forEach(id => {
        setElementText(id, '—');
    });
}

// Aliases for backwards compatibility with Day 1 code
const clearEventDetails = clearHotspotDetails;
const displayEvent = showHotspotDetails;

/*
 * Function: updateClassification()
 * Purpose:
 * Updates the visual classification badge and confidence score.
 * Shows "Pending" if category is missing or unknown.
 */
function updateClassification(category, confidence) {
    const elClass = document.getElementById('event-classification');
    const elConf = document.getElementById('event-confidence');

    if (elClass) {
        const cat = (category && category !== '—' && category !== 'unknown') ? category : 'Pending';
        elClass.textContent = cat;
        
        // Reset classes and apply category-specific styling
        elClass.className = 'tx-badge';
        if (cat === 'Pending') {
            elClass.classList.add('tx-badge-pending');
        } else {
            elClass.classList.add(`tx-badge-${cat.toLowerCase()}`);
        }
    }

    if (elConf && confidence !== undefined) {
        elConf.textContent = formatConfidence(confidence);
    }
}

/*
 * Function: updatePriority()
 * Purpose:
 * Updates the visual priority badge with appropriate styling classes.
 */
function updatePriority(priority) {
    const el = document.getElementById('event-priority');
    if (el) {
        const prio = priority || 'Normal';
        el.textContent = prio;
        el.className = 'tx-badge';
        el.classList.add(`tx-priority-${prio.toLowerCase()}`);
    }
}

/*
 * Function: createHotspotPopupHTML()
 * Purpose:
 * Formats a clean, dark-themed HTML string for the Leaflet popup attached to
 * each map marker.
 *
 * Input:
 * hotspot - The hotspot object to display
 *
 * Returns:
 * Formatted HTML string ready for Leaflet's marker.bindPopup()
 */
function createHotspotPopupHTML(hotspot) {
    if (!hotspot) return "<div>No data available</div>";

    const id = hotspot.id || "TX-HOTSPOT";
    const lat = hotspot.latitude !== undefined ? formatCoordinate(hotspot.latitude, 'lat') : "Not available";
    const lng = hotspot.longitude !== undefined ? formatCoordinate(hotspot.longitude, 'lng') : "Not available";
    const frp = formatThermalValue(hotspot.frp, 'MW');
    const brightness = formatThermalValue(hotspot.brightness !== undefined ? hotspot.brightness : hotspot.bright_ti4, 'K');
    const confidence = formatConfidence(hotspot.confidence);
    const date = formatDateString(hotspot.date || hotspot.acq_date);
    const time = formatTimeString(hotspot.date || hotspot.acq_date, hotspot.time || hotspot.acq_time);
    const satellite = hotspot.satellite && hotspot.satellite !== "unknown" ? hotspot.satellite : "Not available";
    const classification = (hotspot.classification && hotspot.classification.category && hotspot.classification.category !== "Unknown") 
        ? hotspot.classification.category 
        : "Pending";

    return `
        <div style="font-family: var(--tx-font-primary, sans-serif); min-width: 220px; padding: 4px 2px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; border-bottom: 1px solid #334155; padding-bottom: 6px;">
                <span style="font-weight: 700; color: #f87171; font-size: 0.9rem;">🔥 Thermal Hotspot</span>
                <span style="font-family: monospace; font-size: 0.75rem; color: #94a3b8;">${id}</span>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; font-size: 0.8rem; margin-bottom: 8px;">
                <div>
                    <span style="color: #94a3b8; font-size: 0.7rem; display: block;">FRP POWER</span>
                    <strong style="color: #fbbf24; font-family: monospace;">${frp}</strong>
                </div>
                <div>
                    <span style="color: #94a3b8; font-size: 0.7rem; display: block;">BRIGHTNESS</span>
                    <strong style="color: #fbbf24; font-family: monospace;">${brightness}</strong>
                </div>
                <div>
                    <span style="color: #94a3b8; font-size: 0.7rem; display: block;">CONFIDENCE</span>
                    <span style="color: #e2e8f0;">${confidence}</span>
                </div>
                <div>
                    <span style="color: #94a3b8; font-size: 0.7rem; display: block;">CLASS</span>
                    <span style="color: #fbbf24;">${classification}</span>
                </div>
            </div>
            <div style="font-size: 0.75rem; color: #94a3b8; border-top: 1px solid #334155; padding-top: 6px; display: flex; flex-direction: column; gap: 2px;">
                <div><strong>Location:</strong> <span style="font-family: monospace; color: #e2e8f0;">${lat}, ${lng}</span></div>
                <div><strong>Detected:</strong> ${date} (${time})</div>
                <div><strong>Satellite:</strong> ${satellite}</div>
            </div>
            <div style="margin-top: 8px; text-align: center; font-size: 0.7rem; color: #64748b; font-style: italic;">
                Click marker to view complete details in sidebar →
            </div>
        </div>
    `;
}

/**
 * Updates the top statistics cards
 * @param {Object} stats - Object containing the values
 */
function updateStatistics(stats) {
    if (!stats) return;

    if (stats.total !== undefined) document.getElementById('total-events').textContent = stats.total;
    if (stats.persistent !== undefined) document.getElementById('persistent-sources').textContent = stats.persistent;
    if (stats.industrial !== undefined) document.getElementById('industrial-sources').textContent = stats.industrial;
    if (stats.highPriority !== undefined) document.getElementById('high-priority').textContent = stats.highPriority;
}

// ============================================================================
// FILTERING
// ============================================================================

/**
 * Resets all filter inputs to their default states
 */
function resetFilters() {
    document.getElementById('filter-search').value = '';
    document.getElementById('filter-date-from').value = '';
    document.getElementById('filter-date-to').value = '';
    document.getElementById('filter-classification').value = 'all';
    document.getElementById('filter-persistence').value = 'all';
    document.getElementById('filter-confidence').value = 'all';
    
    applyFilters();
}

/**
 * Gathers filter values (To be implemented by other roles for actual filtering logic)
 */
function applyFilters() {
    const filters = {
        search: document.getElementById('filter-search').value,
        dateFrom: document.getElementById('filter-date-from').value,
        dateTo: document.getElementById('filter-date-to').value,
        classification: document.getElementById('filter-classification').value,
        persistence: document.getElementById('filter-persistence').value,
        confidence: document.getElementById('filter-confidence').value
    };

    console.log('Filters Applied:', filters);
}

// ============================================================================
// EXPOSE API FOR OTHER ROLES (ROLE 2, ROLE 3, ROLE 5, ROLE 6)
// ============================================================================
window.ThermalXUI = {
    showHotspotDetails,
    displayEvent: showHotspotDetails, // Backwards compatibility with Day 1
    clearHotspotDetails,
    clearEventDetails: clearHotspotDetails, // Backwards compatibility with Day 1
    createHotspotPopupHTML,
    updateStatistics,
    updateClassification,
    updatePriority,
    showLoading,
    hideLoading,
    showError
};

// Also expose directly on the global window object so Role 2 or any other role
// can simply call window.showHotspotDetails(hotspot)
window.showHotspotDetails = showHotspotDetails;
window.clearHotspotDetails = clearHotspotDetails;

// ============================================================================
// DAY 1 ROLE 3 TEST INTEGRATION
// ============================================================================

// Find the test button element from the HTML document using its ID.
const btnTestFetch = document.getElementById('btn-test-fetch');

// Find the status message element from the HTML document using its ID.
const testStatusMessage = document.getElementById('test-status-message');

// Check if the button actually exists on the page before adding an event listener.
if (btnTestFetch) {
    
    // Add a click event listener to the button. When clicked, it runs this asynchronous function.
    btnTestFetch.addEventListener('click', async () => {
        
        // Update the status text to tell the user we are loading data.
        testStatusMessage.textContent = "Loading NASA FIRMS data...";
        
        // Change the text color to yellow/orange to indicate a pending state.
        testStatusMessage.style.color = "#fbbf24";

        // Show the central loading spinner in the UI by calling the exposed Role 1 function.
        if (window.ThermalXUI) window.ThermalXUI.showLoading();
        
        // Start a try block to handle any errors that might occur during data fetching.
        try {
            
            // Call the imported fetchFIRMSData function and wait for it to finish.
            const hotspots = await fetchFIRMSData(true); // Using true for demo/fallback mode
            
            // Update the status text to tell the user the data loaded successfully, including the count.
            testStatusMessage.textContent = `Success! Loaded ${hotspots.length} records. Check the console.`;
            
            // Change the text color to green to indicate success.
            testStatusMessage.style.color = "#34d399";
            
            // Hide the loading spinner now that we have data.
            if (window.ThermalXUI) window.ThermalXUI.hideLoading();

            // Log the final standardized data to the browser console so the developer can inspect it.
            console.log("Data successfully loaded into app.js:", hotspots);
            
            // Render the fetched hotspots on the map via Role 2 MapModule
            if (window.MapModule && typeof window.MapModule.renderHotspots === 'function') {
                window.MapModule.renderHotspots(hotspots);
            }

            // Update the statistics cards in the UI if possible.
            if (window.ThermalXUI) {
                window.ThermalXUI.updateStatistics({ total: hotspots.length });
            }

        // Catch any errors that were thrown by the fetch process.
        } catch (error) {
            
            // Update the status text to tell the user something went wrong.
            testStatusMessage.textContent = error.message || "Error loading data. Check console.";
            
            // Change the text color to red to indicate an error.
            testStatusMessage.style.color = "#f87171";
            
            // Show the error state in the main UI panel.
            if (window.ThermalXUI) window.ThermalXUI.showError();

            // Log the error detail to the console.
            console.error("Test integration failed:", error);
            
        // Close the catch block.
        }
        
    // Close the async function and event listener.
    });
    
// Close the if statement.
}
