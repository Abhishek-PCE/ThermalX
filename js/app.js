/**
 * ThermalX - Day 1 Role 1
 * Frontend Foundation & UI Interactions
 */

// Import the fetch functions from our newly created api.js module.
import { fetchFIRMSData, fetchNearbyIndustrialFacilities, getHotspotsForClustering } from './api.js';

document.addEventListener('DOMContentLoaded', () => {
    console.log("ThermalX application initialized.");
    initUI();
});

// Track the currently selected hotspot to prevent race conditions from async API responses
let currentHotspotContextId = null;

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
async function showHotspotDetails(hotspot) {
    // If no hotspot was passed (or passed null), return to empty state
    if (!hotspot) {
        clearHotspotDetails();
        return;
    }

    try {
        // Switch the right panel view to show the populated data state
        setPanelState('event-state-data');

        // 1. BASIC INFORMATION & IDENTIFIERS
        const hotspotId = hotspot.eventId || hotspot.id || (hotspot.latitude && hotspot.longitude ? `TX-${Math.abs(hotspot.latitude).toFixed(2)}-${Math.abs(hotspot.longitude).toFixed(2)}` : "TX-UNKNOWN");
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
        const brightnessVal = hotspot.averageBrightness !== undefined ? hotspot.averageBrightness : (hotspot.brightness !== undefined ? hotspot.brightness : (hotspot.bright_ti4 !== undefined ? hotspot.bright_ti4 : null));
        setElementText('event-brightness', formatThermalValue(brightnessVal, 'K'));
        setElementText('history-detection-count', hotspot.detectionCount !== undefined ? hotspot.detectionCount : (hotspot.detections ? hotspot.detections.length : "N/A"));
        setElementText('history-unique-days', hotspot.uniqueDays !== undefined ? hotspot.uniqueDays : "N/A");
        setElementText('history-recurrence-rate', hotspot.recurrenceRate !== undefined ? `${(hotspot.recurrenceRate * 100).toFixed(0)}%` : "N/A");

        // Fire Radiative Power (FRP) in MegaWatts (e.g., 12.4 MW)
        const frpVal = hotspot.averageFRP !== undefined ? hotspot.averageFRP : (hotspot.frp !== undefined ? hotspot.frp : null);
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

        // ==========================================
        // DAY 3 ROLE 1: Render Event History Section
        // ==========================================
        renderEventHistory(hotspot);

        // ==========================================
        // DAY 3 ROLE 2: Render Historical Map Markers
        // ==========================================
        if (window.MapModule && typeof window.MapModule.renderHistoricalDetections === 'function') {
            if (hotspot.detections && hotspot.detections.length > 0) {
                window.MapModule.renderHistoricalDetections(hotspot.detections);
                
                // Optionally fit the map to show all historical markers
                if (typeof window.MapModule.fitMapToHistoricalDetections === 'function') {
                    window.MapModule.fitMapToHistoricalDetections();
                }
            } else {
                // If there are no historical detections (e.g. standard day 1 point), clear any existing ones
                if (typeof window.MapModule.clearHistoricalDetections === 'function') {
                    window.MapModule.clearHistoricalDetections();
                }
            }
        }

        // ==========================================
        // DAY 4 ROLE 2: Render Industrial Facilities
        // ==========================================
        if (window.MapModule && typeof window.MapModule.clearIndustrialLayer === 'function') {
            window.MapModule.clearIndustrialLayer(); // Clear previous
        }

        if (hotspot.latitude !== undefined && hotspot.longitude !== undefined) {
            // Tell the user we are searching...
            setElementText('event-facility', "Searching OpenStreetMap...");
            
            // Set current context tracking ID to prevent race conditions
            const fetchContextId = hotspot.id || `${hotspot.latitude}-${hotspot.longitude}`;
            currentHotspotContextId = fetchContextId;
            
            // Call Role 3's API function
            fetchNearbyIndustrialFacilities(hotspot.latitude, hotspot.longitude)
                .then(async rawFacilities => {
                    // Abort if the user selected a different hotspot while we were fetching
                    if (currentHotspotContextId !== fetchContextId) {
                        console.log("OSM request completed, but a different hotspot is now selected. Discarding old results.");
                        return;
                    }

                    let processedContext = { facilities: [] };
                    
                    // ==========================================
                    // DAY 4 ROLE 4: Process Industrial Proximity
                    // ==========================================
                    if (window.ThermalXProcessing && typeof window.ThermalXProcessing.processIndustrialProximity === 'function') {
                        // Enriches facilities with distance (km) and identifies the nearest one
                        processedContext = window.ThermalXProcessing.processIndustrialProximity(hotspot, rawFacilities);
                    } else {
                        // Fallback if Role 4 is not available
                        processedContext.facilities = rawFacilities;
                    }

                    if (window.MapModule && typeof window.MapModule.renderIndustrialFacilities === 'function') {
                        // Pass the ENRICHED facilities to Role 2 (Map) so it can display distances in popups
                        window.MapModule.renderIndustrialFacilities(processedContext.facilities);
                    }
                    
                    // Update UI with the nearest facility data
                    if (processedContext.nearestFacility) {
                        const nearest = processedContext.nearestFacility;
                        const distText = nearest.distanceFromHotspot !== undefined 
                            ? `${nearest.distanceFromHotspot.toFixed(2)} km` 
                            : "Distance unknown";
                        setElementText('event-facility', `${nearest.name} (${nearest.type})`);
                        setElementText('event-distance', distText);
                    } else {
                        setElementText('event-facility', "No nearby industrial facilities.");
                        setElementText('event-distance', "—");
                    }

                    // ==========================================
                    // DAY 8: MACHINE LEARNING CLASSIFICATION
                    // ==========================================
                    if (window.ThermalXClassification && typeof window.ThermalXClassification.runMLClassification === 'function') {
                        setElementText('event-classification', 'Loading ML...');
                        document.getElementById('event-classification').className = 'tx-badge tx-badge-pending';
                        
                        // Fetch ML prediction
                        const mlResult = await window.ThermalXClassification.runMLClassification(hotspot, processedContext);
                        
                        if (mlResult) {
                            // Update Classification Badge
                            updateClassification(mlResult.category, mlResult.probability * 100);
                            
                            // Update Probability Texts
                            setElementText('event-probability', `${(mlResult.probability * 100).toFixed(1)}%`);
                            
                            let probsHTML = "";
                            for (const [cls, prob] of Object.entries(mlResult.probabilities)) {
                                const percent = (prob * 100).toFixed(1);
                                const fillClass = 'fill-' + cls.toLowerCase();
                                probsHTML += `
                                <div class="tx-prob-row">
                                    <div class="tx-prob-label">${cls}</div>
                                    <div class="tx-prob-bar-bg">
                                        <div class="tx-prob-bar-fill ${fillClass}" style="width: ${percent}%"></div>
                                    </div>
                                    <div class="tx-prob-val">${percent}%</div>
                                </div>`;
                            }
                            const probsList = document.getElementById('event-probabilities-list');
                            if (probsList) probsList.innerHTML = probsHTML;
                            
                            // Update Evidence
                            setElementText('event-evidence', mlResult.evidence);
                            
                            // Attach the mlResult to the hotspot object so the map can use it
                            hotspot.classification = mlResult;
                            
                            // Re-render the map popup with the ML classification if the map module supports it
                            if (window.MapModule && typeof window.MapModule.renderHotspots === 'function') {
                                // Just visual update of the popup if it's currently open
                                const popup = document.querySelector('.leaflet-popup-content');
                                if (popup) {
                                    const titleEl = popup.querySelector('h4');
                                    if (titleEl && titleEl.textContent.includes(hotspot.eventId || hotspot.id)) {
                                       const catEl = popup.querySelector('.popup-category');
                                       if(catEl) catEl.textContent = mlResult.category;
                                    }
                                }
                            }
                        }
                    }
                    // ==========================================================
                    // DAY 4 ROLE 1: Render Facility Cards in Dashboard
                    // ==========================================================
                    renderIndustrialFacilitiesUI(processedContext.facilities);

                })
                .catch(err => {
                    console.error("Failed to fetch industrial context:", err);
                    setElementText('event-facility', "Data unavailable.");
                    
                    // Show error state in the UI panel
                    const container = document.getElementById('industrial-facilities-container');
                    if (container) {
                        container.innerHTML = '<div style="color: #ef4444; font-size: 0.85rem;">Industrial facility data is currently unavailable.</div>';
                    }
                });
        }

    } catch (err) {
        console.error("Error in showHotspotDetails():", err);
        showError("Failed to display hotspot details. Please select another hotspot.");
    }
}

// ============================================================================
// DAY 3 ROLE 1: EVENT HISTORY & TIMELINE FUNCTIONS
// ============================================================================

/**
 * Updates the event history panel with information from the selected thermal event.
 * Reuses the output of Role 4's processing and Role 5's classification.
 */
function renderEventHistory(event) {
    if (event.firstDetection) {
        setElementText('history-first-date', formatDateString(event.firstDetection));
        setElementText('history-last-date', formatDateString(event.lastDetection));
    } else if (event.persistence && event.persistence.firstDetection) {
        setElementText('history-first-date', formatDateString(event.persistence.firstDetection));
        setElementText('history-last-date', formatDateString(event.persistence.lastDetection));
    } else {
        // Fallback if it's a raw detection without persistence metadata
        const singleDate = formatDateString(event.date || event.acq_date);
        setElementText('history-first-date', singleDate);
        setElementText('history-last-date', singleDate);
    }

    renderPersistence(event);
    renderDetectionTimeline(event.detections || [event]);
}

/**
 * Updates the persistence card and its label using Role 5's data.
 */
function renderPersistence(event) {
    let score = "0";
    let category = "LOW";
    let evidence = "1 observation";

    if (event.persistenceScore !== undefined) {
        score = event.persistenceScore;
        category = "EVALUATED";
        if (score > 80) category = "VERY HIGH";
        else if (score > 50) category = "HIGH";
        else if (score > 20) category = "MODERATE";
        else category = "LOW";
        evidence = `${event.uniqueDays || 'Multiple'} unique days`;
    }
    // If Role 5 generated persistenceData during classification
    if (event.persistenceData) {
        score = event.persistenceData.persistenceScore;
        category = event.persistenceData.persistenceCategory;
        evidence = event.persistenceData.evidence;
    } 
    // Fallback if only Role 4's raw persistence metadata is available
    else if (event.persistence && event.persistence.score !== undefined) {
        score = event.persistence.score;
        category = "EVALUATED";
        evidence = `${event.persistence.uniqueDays} days detected`;
    }

    setElementText('history-persistence-score', `${score}%`);
    setElementText('history-persistence-category', category);
    setElementText('history-persistence-evidence', evidence);
}

/**
 * Creates the visual detection timeline from the event's historical detections.
 * @param {Array} detections - Array of historical detections for this event.
 */
function renderDetectionTimeline(detections) {
    const container = document.getElementById('history-timeline-content');
    if (!container) return;

    if (!Array.isArray(detections) || detections.length === 0) {
        container.innerHTML = '<div style="color: #888; font-size: 0.85rem; font-style: italic;">No historical detections available.</div>';
        return;
    }

    // Generate timeline HTML
    let timelineHTML = '';
    
    // Sort chronologically if needed (Role 4 already sorts them, but we ensure it here)
    const sortedDetections = [...detections].sort((a, b) => {
        const dateA = new Date(a.date || a.acq_date || 0);
        const dateB = new Date(b.date || b.acq_date || 0);
        return dateA - dateB;
    });

    sortedDetections.forEach(det => {
        const dateStr = formatDateString(det.date || det.acq_date);
        const frp = formatThermalValue(det.frp, 'MW');
        const bright = formatThermalValue(det.brightness, 'K');
        const sat = det.satellite || 'Unknown';
        
        timelineHTML += `
            <div class="tx-timeline-item">
                <div class="tx-timeline-date">${dateStr}</div>
                <div class="tx-timeline-details">
                    FRP: ${frp} | Brightness: ${bright} | Sat: ${sat}
                </div>
            </div>
        `;
    });

    container.innerHTML = timelineHTML;
}

// ============================================================================
// DAY 4 ROLE 1: INDUSTRIAL FACILITY UI
// ============================================================================

/**
 * ------------------------------------------------------------
 * FACILITY INFORMATION PANEL
 * ------------------------------------------------------------
 * Updates the industrial-context section of the dashboard whenever
 * a user selects a thermal hotspot. Creates dynamic facility cards.
 *
 * Input:
 * - facilities: nearby industrial facilities supplied by the
 *   data-processing/API layer (already sorted by distance from Role 4)
 *
 * Output:
 * - Updates the facility panel in the DOM.
 * ------------------------------------------------------------
 */
function renderIndustrialFacilitiesUI(facilities) {
    const container = document.getElementById('industrial-facilities-container');
    if (!container) return; // Fail safely if the panel doesn't exist

    // Empty state handling
    if (!Array.isArray(facilities) || facilities.length === 0) {
        container.innerHTML = '<div style="color: #888; font-size: 0.85rem; font-style: italic;">No nearby industrial facilities found.</div>';
        return;
    }

    // Generate HTML for the facility cards
    let html = '';

    facilities.forEach(facility => {
        // Fallbacks for missing data, ensuring we don't crash or display "undefined"
        const name = facility.name || "Unknown Facility";
        const type = facility.type ? facility.type.toUpperCase() : "UNKNOWN";
        
        // Handle distance: if missing, hide it gracefully
        let distHTML = '';
        if (facility.distanceFromHotspot !== undefined && facility.distanceFromHotspot !== null) {
            // Role 4 calculates it as a number in km
            const dist = parseFloat(facility.distanceFromHotspot).toFixed(2);
            distHTML = `
                <div class="tx-facility-item">
                    <span class="tx-facility-label">Distance</span>
                    <span class="tx-facility-value tx-facility-value-highlight">${dist} km</span>
                </div>
            `;
        } else {
            distHTML = `
                <div class="tx-facility-item">
                    <span class="tx-facility-label">Distance</span>
                    <span class="tx-facility-value">Unavailable</span>
                </div>
            `;
        }

        // Handle coordinates safely
        const latText = facility.latitude ? parseFloat(facility.latitude).toFixed(3) : "?";
        const lngText = facility.longitude ? parseFloat(facility.longitude).toFixed(3) : "?";

        // Assign a heuristic icon based on type string for better UX
        let icon = '🏭';
        const typeLower = type.toLowerCase();
        if (typeLower.includes('power')) icon = '⚡';
        else if (typeLower.includes('refinery') || typeLower.includes('oil') || typeLower.includes('gas')) icon = '🛢';
        else if (typeLower.includes('mine')) icon = '⛏';

        html += `
            <div class="tx-facility-card">
                <div class="tx-facility-header">
                    <span class="tx-facility-icon">${icon}</span>
                    <span class="tx-facility-name" title="${name}">${name}</span>
                </div>
                <div class="tx-facility-body">
                    <div class="tx-facility-item">
                        <span class="tx-facility-label">Type</span>
                        <span class="tx-facility-value">${type}</span>
                    </div>
                    ${distHTML}
                    <div class="tx-facility-item">
                        <span class="tx-facility-label">Lat</span>
                        <span class="tx-facility-value">${latText}</span>
                    </div>
                    <div class="tx-facility-item">
                        <span class="tx-facility-label">Lng</span>
                        <span class="tx-facility-value">${lngText}</span>
                    </div>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
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
    
    // Clear the active context tracking so pending API requests don't mistakenly render
    currentHotspotContextId = null;

    const elementsToClear = [
        'event-id', 'event-status', 'event-priority', 'event-classification',
        'event-confidence', 'event-quality', 'event-brightness', 'event-frp',
        'event-average-frp', 'event-lat', 'event-lng', 'event-location',
        'event-facility', 'event-distance', 'event-date', 'event-time',
        'event-satellite', 'event-persistence', 'event-evidence',
        // Day 3 Role 1 fields
        'history-first-date', 'history-last-date', 'history-persistence-score',
        'history-persistence-category', 'history-persistence-evidence'
    ];

    elementsToClear.forEach(id => {
        setElementText(id, '—');
    });

    // Clear the timeline container
    const timelineContainer = document.getElementById('history-timeline-content');
    if (timelineContainer) {
        timelineContainer.innerHTML = '<div style="color: #888; font-size: 0.85rem; font-style: italic;">No historical detections available.</div>';
    }

    // ==========================================
    // DAY 3 ROLE 2: Clear Historical Map Markers
    // ==========================================
    if (window.MapModule && typeof window.MapModule.clearHistoricalDetections === 'function') {
        window.MapModule.clearHistoricalDetections();
    }

    // ==========================================
    // DAY 4 ROLE 2: Clear Industrial Map Markers
    // ==========================================
    if (window.MapModule && typeof window.MapModule.clearIndustrialLayer === 'function') {
        window.MapModule.clearIndustrialLayer();
    }

    // ==========================================
    // DAY 4 ROLE 1: Clear Industrial Facilities UI
    // ==========================================
    const facilitiesContainer = document.getElementById('industrial-facilities-container');
    if (facilitiesContainer) {
        facilitiesContainer.innerHTML = '<div style="color: #888; font-size: 0.85rem; font-style: italic;">No hotspot selected.</div>';
    }
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
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; border-bottom: 1px solid #DCE4EF; padding-bottom: 6px;">
                <span style="font-weight: 700; color: var(--tx-critical-red, #E53935); font-size: 0.9rem;">🔥 Thermal Event</span>
                <span style="font-family: monospace; font-size: 0.75rem; color: var(--tx-text-secondary, #52627A);">${id}</span>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; font-size: 0.8rem; margin-bottom: 8px;">
                <div>
                    <span style="color: var(--tx-text-muted, #7A899E); font-size: 0.7rem; display: block;">FRP POWER</span>
                    <strong style="color: var(--tx-thermal-orange, #FF6B35); font-family: monospace;">${frp}</strong>
                </div>
                <div>
                    <span style="color: var(--tx-text-muted, #7A899E); font-size: 0.7rem; display: block;">BRIGHTNESS</span>
                    <strong style="color: var(--tx-thermal-orange, #FF6B35); font-family: monospace;">${brightness}</strong>
                </div>
                <div>
                    <span style="color: var(--tx-text-muted, #7A899E); font-size: 0.7rem; display: block;">CONFIDENCE</span>
                    <span style="color: var(--tx-text-primary, #10213A); font-weight: 600;">${confidence}</span>
                </div>
                <div>
                    <span style="color: var(--tx-text-muted, #7A899E); font-size: 0.7rem; display: block;">CLASS</span>
                    <span class="popup-category" style="color: var(--tx-brand-blue, #1769E0); font-weight: 600;">${classification}</span>
                </div>
            </div>
            <div style="font-size: 0.75rem; color: var(--tx-text-secondary, #52627A); border-top: 1px solid #DCE4EF; padding-top: 6px; display: flex; flex-direction: column; gap: 2px;">
                <div><strong>Location:</strong> <span style="font-family: monospace; color: var(--tx-text-primary, #10213A);">${lat}, ${lng}</span></div>
                <div><strong>Detected:</strong> ${date}</div>
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
            
            // Call the imported fetchFIRMSData function (Role 3) and wait for it to finish.
            // DAY 5 ROLE 3: Use the new clustering integration function\n            const apiHotspots = await getHotspotsForClustering(true); // Fetch and merge data for clustering
            
            // Pass the API data through Role 4 Data Processing pipeline (Integration)
            let cleanHotspots = [];
            if (window.ThermalXProcessing && typeof window.ThermalXProcessing.processHistoricalDetections === 'function') {
                // Day 3: Group historical detections into persistent events
                cleanHotspots = window.ThermalXProcessing.processHistoricalDetections(apiHotspots);
            } else if (window.ThermalXProcessing && typeof window.ThermalXProcessing.processHotspotData === 'function') {
                cleanHotspots = window.ThermalXProcessing.processHotspotData(apiHotspots);
            } else {
                console.warn("[Integration] Role 4 Processing module missing. Using raw API data directly.");
                cleanHotspots = apiHotspots;
            }

            if (cleanHotspots.length === 0) {
                throw new Error("No valid thermal hotspots were found after processing.");
            }

            
            // Update the status text to tell the user the data loaded successfully, including the count.
            testStatusMessage.textContent = `Success! Loaded ${cleanHotspots.length} records. Check the console.`;
            
            // Change the text color to green to indicate success.
            testStatusMessage.style.color = "#34d399";
            
            // Hide the loading spinner now that we have data.
            if (window.ThermalXUI) window.ThermalXUI.hideLoading();

            // Log the final standardized data to the browser console so the developer can inspect it.
            console.log("Data successfully loaded and processed:", cleanHotspots);
            
            // Render the fetched hotspots on the map via Role 2 MapModule
            if (window.MapModule && typeof window.MapModule.renderHotspots === 'function') {
                window.MapModule.renderHotspots(cleanHotspots);
            }

            // Update the statistics cards in the UI if possible.
            if (window.ThermalXUI) {
                window.ThermalXUI.updateStatistics({ total: cleanHotspots.length });
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

// UI REDESIGN OVERRIDE
const originalSetPanelState = setPanelState;
setPanelState = function(stateId) {
    const states = ['event-state-empty', 'event-state-loading', 'event-state-error', 'event-state-data'];
    states.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = (id === stateId) ? 'flex' : 'none';
    });
    
    // Slide panel in and out
    const panel = document.getElementById('event-panel');
    if (panel) {
        if (stateId === 'event-state-empty') {
            panel.classList.remove('active');
        } else {
            panel.classList.add('active');
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const closeBtn = document.getElementById('btn-close-details');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            if (window.clearHotspotDetails) window.clearHotspotDetails();
        });
    }
});

// UI REDESIGN: Populate Recent Hotspots Table
function renderHotspotsTable(hotspots) {
    const tbody = document.getElementById('hotspot-table-body');
    if (!tbody) return;
    
    if (!hotspots || hotspots.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding: 20px; color: var(--tx-text-muted);">No hotspots loaded.</td></tr>';
        return;
    }

    // Sort by recent first (highest ID or latest date)
    const sorted = [...hotspots].slice(0, 50); // Show top 50
    
    let html = '';
    sorted.forEach(h => {
        const id = h.id || "TX-UNKNOWN";
        const date = h.date || h.acq_date || "-";
        const time = h.time || h.acq_time || "-";
        const lat = h.latitude ? h.latitude.toFixed(4) : "-";
        const lng = h.longitude ? h.longitude.toFixed(4) : "-";
        const frp = h.averageFRP ? h.averageFRP.toFixed(1) : (h.frp || "-");
        const conf = h.confidence || "-";
        const pScore = h.persistenceScore !== undefined ? h.persistenceScore + "%" : "-";
        
        let clsName = "Pending";
        let clsColor = "tx-badge-pending";
        if (h.classification && h.classification.category) {
            clsName = h.classification.category;
            clsColor = 'tx-badge-' + clsName.toLowerCase();
        }
        
        // Truncate location if needed, or keep simple
        const loc = \`\${lat}, \${lng}\`;

        html += \`
            <tr onclick="if(window.MapModule && window.MapModule.flyToHotspot) window.MapModule.flyToHotspot('\${id}');">
                <td class="tx-cell-id">\${id}</td>
                <td>\${date} \${time}</td>
                <td style="font-family: var(--tx-font-mono);">\${loc}</td>
                <td style="color: var(--tx-thermal-orange); font-weight: 600;">\${frp}</td>
                <td>\${conf}</td>
                <td><span class="tx-badge \${clsColor}" style="font-size: 10px; padding: 2px 6px;">\${clsName}</span></td>
                <td>\${pScore}</td>
                <td class="tx-cell-action">➔</td>
            </tr>
        \`;
    });
    
    tbody.innerHTML = html;
}

// Intercept the data load to also render the table
const originalRenderHotspots = window.MapModule ? window.MapModule.renderHotspots : null;
if (window.MapModule && originalRenderHotspots) {
    window.MapModule.renderHotspots = function(hotspots) {
        originalRenderHotspots.call(window.MapModule, hotspots);
        renderHotspotsTable(hotspots);
    };
}
