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
     * Renders an array of hotspot objects or Day 5 Thermal Events as markers on the map.
     * @param {Array} hotspots - Array of normalized hotspot objects or Thermal Events.
     */
    function renderHotspots(hotspots) {
        if (!map || !markersLayer) return;

        // Clear existing markers before rendering new ones
        clearMapMarkers();
        
        // Track the currently selected marker so we can revert its style
        let activeMarker = null;

        // Loop through each hotspot/event and create a marker
        hotspots.forEach(hotspot => {
            // Check if this is a Day 5 Thermal Event (has an eventId)
            const isThermalEvent = hotspot.eventId !== undefined;
            
            // ============================================================
            // THERMAL EVENT MARKER (Day 5)
            // ============================================================
            // Creates a distinct visual cluster marker rather than a standard pin.
            let marker;
            const defaultEventHtml = `
                <div class="tx-event-marker" style="
                    background-color: #ef4444; 
                    color: white; 
                    border: 2px solid white; 
                    border-radius: 50%; 
                    width: 32px; 
                    height: 32px; 
                    display: flex; 
                    align-items: center; 
                    justify-content: center; 
                    font-weight: bold; 
                    font-family: monospace; 
                    box-shadow: 0 0 8px rgba(0,0,0,0.5);
                ">${hotspot.detectionCount || 1}</div>
            `;
            
            const selectedEventHtml = `
                <div class="tx-event-marker-selected" style="
                    background-color: #f59e0b; 
                    color: white; 
                    border: 3px solid white; 
                    border-radius: 50%; 
                    width: 38px; 
                    height: 38px; 
                    display: flex; 
                    align-items: center; 
                    justify-content: center; 
                    font-weight: bold; 
                    font-family: monospace; 
                    box-shadow: 0 0 12px rgba(245, 158, 11, 0.8);
                    z-index: 1000;
                ">${hotspot.detectionCount || 1}</div>
            `;

            if (isThermalEvent) {
                const eventIcon = L.divIcon({
                    className: 'custom-event-icon',
                    html: defaultEventHtml,
                    iconSize: [32, 32],
                    iconAnchor: [16, 16]
                });
                marker = L.marker([hotspot.latitude, hotspot.longitude], { icon: eventIcon });
            } else {
                marker = L.marker([hotspot.latitude, hotspot.longitude]);
            }
            
            // ============================================================
            // THERMAL EVENT POPUP (Day 5)
            // ============================================================
            let popupHTML = "";
            if (isThermalEvent) {
                const pScore = hotspot.persistenceScore !== undefined ? hotspot.persistenceScore + '%' : 'N/A';
                popupHTML = `
                    <div style="font-family: monospace; font-size: 13px; min-width: 200px;">
                        <strong style="color: #ef4444; font-size: 15px;">🔥 ${hotspot.eventId}</strong><br>
                        <hr style="border: 0; border-top: 1px solid #ccc; margin: 6px 0;">
                        <strong>Detections:</strong> ${hotspot.detectionCount}<br>
                        <strong>Unique Days:</strong> ${hotspot.uniqueDays}<br>
                        <strong>Persistence:</strong> ${pScore}<br>
                        <strong>Avg FRP:</strong> ${hotspot.frp.toFixed(1)} MW<br>
                        <strong>Avg Confidence:</strong> ${Math.round(hotspot.confidence)}%<br>
                        <hr style="border: 0; border-top: 1px dashed #ccc; margin: 6px 0;">
                        <strong>First:</strong> ${hotspot.firstDetection}<br>
                        <strong>Last:</strong> ${hotspot.lastDetection}<br>
                    </div>
                `;
            } else {
                if (window.ThermalXUI && typeof window.ThermalXUI.createHotspotPopupHTML === 'function') {
                    popupHTML = window.ThermalXUI.createHotspotPopupHTML(hotspot);
                } else {
                    popupHTML = `<div><strong>Lat/Lng:</strong> ${hotspot.latitude}, ${hotspot.longitude}</div>`;
                }
            }
            
            marker.bindPopup(popupHTML);
            
            // ============================================================
            // THERMAL EVENT SELECTION (Day 5)
            // ============================================================
            // 1. Highlights the selected event visually.
            // 2. Dispatches update to app.js dashboard UI.
            marker.on('click', () => {
                // Revert previous marker to default styling if it was a Day 5 Event
                if (activeMarker && activeMarker.options.icon && activeMarker.options.icon.options.className === 'custom-event-icon') {
                    activeMarker.setIcon(L.divIcon({
                        className: 'custom-event-icon',
                        html: activeMarker._defaultHtml, // Stored safely on the marker object
                        iconSize: [32, 32],
                        iconAnchor: [16, 16]
                    }));
                }

                // Highlight the newly clicked marker if it's a Day 5 Event
                if (isThermalEvent) {
                    marker._defaultHtml = defaultEventHtml; // Store for later reversion
                    marker.setIcon(L.divIcon({
                        className: 'custom-event-icon',
                        html: selectedEventHtml,
                        iconSize: [38, 38],
                        iconAnchor: [19, 19]
                    }));
                    activeMarker = marker;
                }

                if (typeof window.showHotspotDetails === 'function') {
                    window.showHotspotDetails(hotspot);
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

    // ====================================================
    // 6. INDUSTRIAL CONTEXT (Day 4 Role 2)
    // ====================================================

    /**
     * Removes the previously displayed industrial markers
     * before rendering a refreshed facility dataset.
     */
    function clearIndustrialLayer() {
        if (industrialLayer) {
            industrialLayer.clearLayers();
        }
    }

    /**
     * Generates HTML for an industrial facility popup.
     */
    function createIndustrialPopupContent(facility) {
        // Fallback for missing type
        const typeText = facility.type || 'Industrial Facility';
        // Fallback for missing operator
        const opText = (facility.tags && facility.tags.operator) ? facility.tags.operator : 'N/A';
        // Distance info from Role 4 if present
        const distText = (facility.distanceFromHotspot !== undefined) ? `${facility.distanceFromHotspot.toFixed(2)} km away` : '';

        // Pick an emoji representing the type
        let emoji = '🏭';
        if (typeText.toLowerCase().includes('power')) emoji = '⚡';
        else if (typeText.toLowerCase().includes('refinery')) emoji = '🛢';
        else if (typeText.toLowerCase().includes('mine')) emoji = '⛏';

        return `
            <div style="font-family: var(--tx-font-primary, sans-serif); min-width: 200px; font-size: 13px;">
                <div style="color: #60a5fa; font-weight: bold; border-bottom: 1px solid #334155; padding-bottom: 5px; margin-bottom: 5px;">
                    ${emoji} ${facility.name}
                </div>
                <strong>Type:</strong> ${typeText}<br>
                <strong>Operator:</strong> ${opText}<br>
                <strong>Source:</strong> OpenStreetMap<br>
                ${distText ? `<div style="margin-top: 5px; color: #fbbf24; font-weight: bold;">${distText}</div>` : ''}
            </div>
        `;
    }

    /**
     * Creates Leaflet markers for industrial facilities
     * received from the OSM/Overpass data module (Role 3).
     */
    function renderIndustrialFacilities(facilities) {
        clearIndustrialLayer();

        if (!Array.isArray(facilities) || facilities.length === 0) {
            console.log("MapModule: No industrial facilities to render.");
            return 0;
        }

        let renderedCount = 0;

        facilities.forEach(facility => {
            const lat = parseFloat(facility.latitude);
            const lng = parseFloat(facility.longitude);

            // 1. Validate coordinates so we don't crash the map
            if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
                return;
            }

            // 2. Visually distinguish from fires (blue square-ish icon or distinct circle)
            // We use a custom DivIcon to make it look professional and different from the red fire dots
            const industrialIcon = L.divIcon({
                className: 'tx-industrial-marker',
                html: `<div style="background-color: #3b82f6; border: 2px solid white; border-radius: 4px; width: 12px; height: 12px; transform: rotate(45deg);"></div>`,
                iconSize: [16, 16],
                iconAnchor: [8, 8]
            });

            const marker = L.marker([lat, lng], { icon: industrialIcon });
            
            // 3. Attach the popup
            const popupHTML = createIndustrialPopupContent(facility);
            marker.bindPopup(popupHTML);

            // 4. Add to the dedicated industrial layer
            marker.addTo(industrialLayer);
            renderedCount++;
        });

        console.log(`ThermalX Map: Rendered ${renderedCount} industrial facilities.`);
        return renderedCount;
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
        renderIndustrialFacilities,
        clearIndustrialLayer,
        getMapInstance: () => map
    };
})();

// Wait for the DOM to be ready before initializing the map
document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Map
    window.MapModule.initMap('map');
});

