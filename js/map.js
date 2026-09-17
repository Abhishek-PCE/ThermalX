/**
 * Role 2: GIS & Map Developer
 * ThermalX - Satellite-based Thermal Hotspot Classifier
 * 
 * This module initializes and manages the Leaflet map engine,
 * layers, and markers for the dashboard.
 */

// Create a globally accessible module for the map
window.MapModule = (function() {
    let map = null;
    let markersLayer = null;
    let historicalLayer = null; // Day 3: Separate layer for event history
    let industrialLayer = null; // Day 4: Separate layer for OSM industrial context

    /**
     * Initializes the Leaflet map and base layers.
     * @param {string} containerId - The HTML ID of the map container.
     * @returns {L.Map} The initialized map instance.
     */
    function initMap(containerId = 'map') {
        // Default center (e.g., India) and zoom
        const defaultCenter = [20.5937, 78.9629];
        const defaultZoom = 5;

        // Initialize the map object
        map = L.map(containerId).setView(defaultCenter, defaultZoom);

        // Define Base Layers
        const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        });

        const openTopoLayer = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
            maxZoom: 17,
            attribution: 'Map data: © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: © <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
        });

        const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            maxZoom: 19,
            attribution: 'Tiles © Esri — Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
        });

        // Add the default layer
        osmLayer.addTo(map);

        // Layer control setup
        const baseMaps = {
            "OpenStreetMap": osmLayer,
            "OpenTopoMap": openTopoLayer,
            "Satellite (Esri)": satelliteLayer
        };

        // Initialize a feature group for current markers to easily clear them later
        markersLayer = L.featureGroup().addTo(map);

        // ----------------------------------------------------
        // HISTORICAL HOTSPOT LAYER (Day 3)
        // WHY: We keep historical markers in a separate layer
        // so they can be toggled, cleared, or styled independently
        // from the current active FIRMS hotspots.
        // ----------------------------------------------------
        historicalLayer = L.featureGroup().addTo(map);

        // ----------------------------------------------------
        // INDUSTRIAL FACILITY LAYER (Day 4)
        // WHY: We keep industrial context separate from fires,
        // allowing the user to toggle them on/off easily.
        // ----------------------------------------------------
        industrialLayer = L.featureGroup().addTo(map);

        const overlayMaps = {
            "Current Hotspots": markersLayer,
            "Historical Detections": historicalLayer,
            "Industrial Facilities": industrialLayer
        };

        L.control.layers(baseMaps, overlayMaps).addTo(map);

        // Clean up any placeholder text in the map container (e.g. from index.html)
        const placeholder = document.querySelector(`#${containerId} .tx-map-placeholder`);
        if (placeholder) {
            placeholder.style.display = 'none';
        }

        return map;
    }

    /**
     * Adds a test marker to the map.
     * @param {number} lat - Latitude
     * @param {number} lng - Longitude
     * @param {string} title - Title for the marker
     * @param {string} popupContent - HTML content for the popup
     */
    function addTestMarker(lat, lng, title, popupContent) {
        if (!map || !markersLayer) return;

        const marker = L.marker([lat, lng], { title: title });
        
        if (popupContent) {
            marker.bindPopup(popupContent);
        }
        
        marker.addTo(markersLayer);
    }

    /**
     * Clears all dynamic markers from the map.
     */
    function clearMapMarkers() {
        if (markersLayer) {
            markersLayer.clearLayers();
        }
    }

    /**
     * Centers the map on specific coordinates.
     * @param {number} lat - Latitude
     * @param {number} lng - Longitude
     * @param {number} zoom - Zoom level
     */
    function centerMapOn(lat, lng, zoom = 10) {
        if (map) {
            map.flyTo([lat, lng], zoom);
        }
    }

    /**
     * Renders an array of hotspot objects as markers on the map.
     * @param {Array} hotspots - Array of normalized hotspot objects.
     */
    function renderHotspots(hotspots) {
        if (!map || !markersLayer) return;

        // Clear existing markers before rendering new ones
        clearMapMarkers();

        // Loop through each hotspot and create a marker
        hotspots.forEach(hotspot => {
            // Create a basic marker at the hotspot's coordinates
            const marker = L.marker([hotspot.latitude, hotspot.longitude]);
            
            // ============================================================
            // LEAFLET POPUP & SELECTION INTEGRATION (Role 1 & Role 2)
            // What this does:
            // 1. Formats the popup HTML using Role 1's UI generator.
            // 2. Binds a click event so selecting a marker updates the sidebar panel.
            // ============================================================
            let popupHTML = "";
            if (window.ThermalXUI && typeof window.ThermalXUI.createHotspotPopupHTML === 'function') {
                popupHTML = window.ThermalXUI.createHotspotPopupHTML(hotspot);
            } else {
                // Fallback popup if UI module is still loading
                popupHTML = `
                    <div style="font-family: monospace; font-size: 14px; min-width: 200px;">
                        <strong style="color: #e53935;">🔥 Thermal Hotspot</strong><br>
                        <hr style="border: 0; border-top: 1px solid #ccc; margin: 5px 0;">
                        <strong>Lat/Lng:</strong> ${hotspot.latitude.toFixed(4)}, ${hotspot.longitude.toFixed(4)}<br>
                        <strong>FRP:</strong> ${hotspot.frp} MW<br>
                        <strong>Brightness:</strong> ${hotspot.brightness} K<br>
                        <strong>Confidence:</strong> ${hotspot.confidence}%<br>
                        <strong>Date:</strong> ${hotspot.date}<br>
                        <strong>Satellite:</strong> ${hotspot.satellite}
                    </div>
                `;
            }
            
            // Bind the popup to the marker
            marker.bindPopup(popupHTML);
            
            // When user clicks the marker, display full details in the sidebar panel
            marker.on('click', () => {
                if (typeof window.showHotspotDetails === 'function') {
                    window.showHotspotDetails(hotspot);
                } else if (window.ThermalXUI && typeof window.ThermalXUI.showHotspotDetails === 'function') {
                    window.ThermalXUI.showHotspotDetails(hotspot);
                } else if (window.ThermalXUI && typeof window.ThermalXUI.displayEvent === 'function') {
                    window.ThermalXUI.displayEvent(hotspot);
                }
            });
            
            // Add the marker to the layer group
            marker.addTo(markersLayer);
        });

        // Optionally adjust the map view to fit all markers if there are any
        if (hotspots.length > 0) {
            map.fitBounds(markersLayer.getBounds(), { padding: [50, 50], maxZoom: 12 });
        }
    }

    // ====================================================
    // HISTORICAL MARKERS (Day 3 Role 2)
    // ====================================================

    /**
     * ----------------------------------------------------
     * FUNCTION: clearHistoricalDetections()
     * PURPOSE: Removes old historical markers when switching
     *          events, keeping the map clean and preventing
     *          stale data overlays.
     * ----------------------------------------------------
     */
    function clearHistoricalDetections() {
        if (historicalLayer) {
            historicalLayer.clearLayers();
        }
    }

    /**
     * ----------------------------------------------------
     * FUNCTION: createHistoricalPopupContent(detection)
     * PURPOSE: Generates the HTML for a historical detection popup.
     *          Ensures missing values are safely handled.
     * ----------------------------------------------------
     */
    function createHistoricalPopupContent(detection) {
        const frpText = (detection.frp !== undefined && detection.frp !== null) ? `${detection.frp} MW` : 'Not available';
        const brightText = (detection.brightness !== undefined && detection.brightness !== null) ? `${detection.brightness} K` : 'Not available';
        const confText = detection.confidence || 'Not available';
        const satText = detection.satellite || 'Unknown';
        const dateText = detection.date || 'Unknown Date';

        return `
            <div style="font-family: monospace; font-size: 13px; min-width: 180px;">
                <strong style="color: #607d8b;">• Historical Thermal Detection</strong><br>
                <hr style="border: 0; border-top: 1px solid #ccc; margin: 5px 0;">
                <strong>Date:</strong> ${dateText}<br>
                <strong>Location:</strong> ${detection.latitude.toFixed(4)}, ${detection.longitude.toFixed(4)}<br>
                <br>
                <strong>Brightness:</strong> ${brightText}<br>
                <strong>FRP:</strong> ${frpText}<br>
                <strong>Confidence:</strong> ${confText}<br>
                <strong>Satellite:</strong> ${satText}
            </div>
        `;
    }

    /**
     * ----------------------------------------------------
     * FUNCTION: addHistoricalMarker(detection)
     * PURPOSE: Creates a distinct circle marker for a single
     *          historical point and adds it to historicalLayer.
     * ----------------------------------------------------
     */
    function addHistoricalMarker(detection) {
        if (!map || !historicalLayer) return;

        // Visual distinction: small grey/blue circle marker instead of large flame icon
        const marker = L.circleMarker([detection.latitude, detection.longitude], {
            radius: 6,
            fillColor: "#607d8b", // Grey-blue color
            color: "#fff",
            weight: 1,
            opacity: 1,
            fillOpacity: 0.8
        });

        marker.bindPopup(createHistoricalPopupContent(detection));
        marker.addTo(historicalLayer);
    }

    /**
     * ----------------------------------------------------
     * FUNCTION: renderHistoricalDetections(detections)
     * PURPOSE: Loops through an array of historical detections,
     *          validates coordinates, and renders them.
     * INPUT: detections - Array of historical objects
     * ----------------------------------------------------
     */
    function renderHistoricalDetections(detections) {
        clearHistoricalDetections(); // Ensure no stale markers

        // Check whether the input is an array before processing
        // This prevents errors if API or processing layer yields null
        if (!Array.isArray(detections)) {
            console.warn("ThermalX Map: Expected array of historical detections, got something else.");
            return 0;
        }

        let validCount = 0;

        detections.forEach(det => {
            // Validate coordinates: prevent Leaflet from crashing on NaN or out-of-bounds
            const lat = Number(det.latitude);
            const lng = Number(det.longitude);

            if (
                !Number.isFinite(lat) || !Number.isFinite(lng) ||
                lat < -90 || lat > 90 || lng < -180 || lng > 180
            ) {
                return; // Skip invalid
            }

            addHistoricalMarker(det);
            validCount++;
        });

        console.log(`ThermalX Map: Rendered ${validCount} historical detections.`);
        return validCount;
    }

    /**
     * ----------------------------------------------------
     * FUNCTION: fitMapToHistoricalDetections(detections)
     * PURPOSE: Zooms and pans the map to comfortably fit
     *          all historical markers for an event.
     * ----------------------------------------------------
     */
    function fitMapToHistoricalDetections() {
        if (!map || !historicalLayer) return;
        
        const bounds = historicalLayer.getBounds();
        if (bounds.isValid()) {
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
        }
    }

    // Expose public API
    return {
        initMap,
        addTestMarker,
        clearMapMarkers,
        centerMapOn,
        renderHotspots,
        renderHistoricalDetections,
        clearHistoricalDetections,
        fitMapToHistoricalDetections,
        getMapInstance: () => map
    };
})();

// Wait for the DOM to be ready before initializing the map
document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Map
    window.MapModule.initMap('map');

    // 2. Add Test Hotspot Marker (Nagpur, India)
    const testLat = 21.1458;
    const testLng = 79.0882;
    const popupHTML = `
        <div style="font-family: monospace; font-size: 14px;">
            <strong>Source:</strong> Test Hotspot<br>
            <strong>Lat/Lng:</strong> ${testLat}, ${testLng}<br>
            <strong>Status:</strong> Ready for FIRMS integration.<br>
        </div>
    `;
    
    window.MapModule.addTestMarker(testLat, testLng, "Test Hotspot (Nagpur)", popupHTML);
    
    // Optional: center map on test marker after short delay for visual effect
    setTimeout(() => {
        window.MapModule.centerMapOn(testLat, testLng, 6);
    }, 1000);
    // Note: Day 2 Role 2 removed the static test marker on load.
    // Real FIRMS data markers will be injected via renderHotspots() called by app.js
});

