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

    // Expose public API
    return {
        initMap,
        addTestMarker,
        clearMapMarkers,
        centerMapOn,
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
});

