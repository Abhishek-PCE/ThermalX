/**
 * ThermalX - Day 1 Role 1
 * Frontend Foundation & UI Interactions
 */

// Import the fetch function from our newly created api.js module.
import { fetchFirmsData } from './api.js';

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

function showError() {
    setPanelState('event-state-error');
}

// ============================================================================
// DATA DISPLAY
// ============================================================================

/**
 * Clears the event details panel and shows the empty state
 */
function clearEventDetails() {
    setPanelState('event-state-empty');
    
    // Reset specific fields just in case
    const elements = [
        'event-id', 'event-priority', 'event-classification', 'event-confidence',
        'event-id', 'event-location', 'event-brightness', 'event-priority', 'event-classification', 'event-confidence',
        'event-persistence', 'event-detection-count', 'event-first-detection',
        'event-last-detection', 'event-average-frp', 'event-facility',
        'event-distance', 'event-evidence'
    ];
    
    elements.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = '—';
    });
}

/**
 * Updates the visual classification badge
 */
function updateClassification(category, confidence) {
    const elClass = document.getElementById('event-classification');
    const elConf = document.getElementById('event-confidence');
    
    if (elClass) {
        elClass.textContent = category || '—';
        // Add dynamic styling here in the future if needed based on category
    }
    
    if (elConf) {
        elConf.textContent = confidence !== undefined ? `${confidence}%` : '—';
    }
}

/**
 * Updates the visual priority badge
 */
function updatePriority(priority) {
    const el = document.getElementById('event-priority');
    if (el) {
        el.textContent = priority || '—';
        // Remove existing priority classes
        el.className = 'tx-badge'; 
        if (priority) {
            el.classList.add(`tx-priority-${priority.toLowerCase()}`);
        }
    }
}

/**
 * Populates the event details panel with a selected event object
 * Expected event structure provided in specifications.
 */
function displayEvent(event) {
    if (!event) {
        clearEventDetails();
        return;
    }

    setPanelState('event-state-data');

    // Basic Info
    document.getElementById('event-id').textContent = event.id || '—';
    const elLoc = document.getElementById('event-location');
    if (elLoc) elLoc.textContent = (event.latitude !== undefined && event.longitude !== undefined) ? `${event.latitude}, ${event.longitude}` : '—';
    const elBri = document.getElementById('event-brightness');
    if (elBri) elBri.textContent = event.brightness !== undefined ? event.brightness : '—';
    document.getElementById('event-average-frp').textContent = event.frp !== undefined ? event.frp : '—';
    
    // Persistence
    if (event.persistence) {
        document.getElementById('event-persistence').textContent = event.persistence.score !== undefined ? `${event.persistence.score}/100` : '—';
        document.getElementById('event-detection-count').textContent = event.persistence.detectionCount !== undefined ? event.persistence.detectionCount : '—';
        
        // These fields might come from historical data processing
        document.getElementById('event-first-detection').textContent = event.date || '—'; 
        document.getElementById('event-last-detection').textContent = event.date || '—';
    }

    // Industrial Context
    if (event.industrialContext) {
        document.getElementById('event-facility').textContent = event.industrialContext.nearestFacility || '—';
        document.getElementById('event-distance').textContent = event.industrialContext.distance !== undefined ? `${event.industrialContext.distance}km` : '—';
    }

    // Classification & Priority
    if (event.classification) {
        updateClassification(event.classification.category, event.classification.confidence);
    } else {
        updateClassification('—', undefined);
    }

    updatePriority(event.priority);
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
    
    // Here Role 2/4 can listen and re-render map points without filters
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
    // Role 3/4 integration point for filtering active hotspots
}

// ============================================================================
// EXPOSE API FOR OTHER ROLES
// ============================================================================
window.ThermalXUI = {
    displayEvent,
    clearEventDetails,
    updateStatistics,
    updateClassification,
    updatePriority,
    showLoading,
    hideLoading,
    showError
};

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
        testStatusMessage.textContent = "Loading demo data...";
        
        // Change the text color to yellow/orange to indicate a pending state.
        testStatusMessage.style.color = "#fbbf24";
        
        // Start a try block to handle any errors that might occur during data fetching.
        try {
            
            // Call the imported fetchFirmsData function and wait for it to finish.
            const hotspots = await fetchFirmsData();
            
            // Update the status text to tell the user the data loaded successfully, including the count.
            testStatusMessage.textContent = `Success! Loaded ${hotspots.length} demo records. Check the console.`;
            
            // Change the text color to green to indicate success.
            testStatusMessage.style.color = "#34d399";
            
            // Log the final standardized data to the browser console so the developer can inspect it.
            console.log("Data successfully loaded into app.js:", hotspots);
            
        // Catch any errors that were thrown by the fetch process.
        } catch (error) {
            
            // Update the status text to tell the user something went wrong.
            testStatusMessage.textContent = "Error loading data. Check console.";
            
            // Change the text color to red to indicate an error.
            testStatusMessage.style.color = "#f87171";
            
            // Log the error detail to the console.
            console.error("Test integration failed:", error);
            
        // Close the catch block.
        }
        
    // Close the async function and event listener.
    });
    
// Close the if statement.
}
