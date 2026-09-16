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

        L.control.layers(baseMaps).addTo(map);

        // Initialize a feature group for markers to easily clear them later
        markersLayer = L.featureGroup().addTo(map);

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

    // Expose public API
    return {
        initMap,
        addTestMarker,
        clearMapMarkers,
        centerMapOn,
        renderHotspots,
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

