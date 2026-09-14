// Role 3: Data Integration Developer
// Day 1: API Foundation and Data Fetching Demo

// -----------------------------------------------------------------------------
// NASA FIRMS API UNDERSTANDING:
// What NASA FIRMS provides: NASA FIRMS (Fire Information for Resource Management System)
// provides near real-time thermal anomaly (hotspot and fire) detections from satellites.
// 
// ThermalX will eventually consume these detections to analyze thermal activity.
// 
// What fields ThermalX is interested in from the API:
// - latitude (Y coordinate of the hotspot)
// - longitude (X coordinate of the hotspot)
// - brightness (Temperature/brightness of the thermal anomaly)
// - FRP (Fire Radiative Power - intensity of the fire)
// - confidence (Detection confidence percentage or level)
// - date (When the detection was recorded)
// - satellite (Which satellite recorded it, e.g., Aqua, Terra)
//
// TODO — verify against the current NASA FIRMS API response 
// (The exact response format from NASA FIRMS may differ and needs verification).
// -----------------------------------------------------------------------------

// Store a placeholder configuration for the real FIRMS API URL.
// We use a placeholder here so we can insert the real API key later without rewriting.
const FIRMS_API_CONFIG = {
    // The base URL for the real NASA FIRMS API (currently pointing to our demo file).
    // In production on Day 2, this will be the actual NASA API endpoint.
    baseUrl: "data/demo-firms.json",
    
    // A placeholder for the API key, which will be securely managed later.
    apiKey: "YOUR_NASA_API_KEY_HERE"
};

// Create a small function that converts raw demo records into a common ThermalX hotspot structure.
function standardizeHotspot(rawRecord) {
    // Create and return a new standardized JavaScript object.
    return {
        // Assign the unique identifier from the raw record to the new id property.
        id: rawRecord.id,
        
        // Assign the latitude from the raw record to the new latitude property.
        latitude: rawRecord.latitude,
        
        // Assign the longitude from the raw record to the new longitude property.
        longitude: rawRecord.longitude,
        
        // Assign the date from the raw record to the new date property.
        date: rawRecord.date,
        
        // Assign the brightness value from the raw record to the new brightness property.
        brightness: rawRecord.brightness,
        
        // Assign the Fire Radiative Power (frp) from the raw record to the new frp property.
        frp: rawRecord.frp,
        
        // Assign the confidence level from the raw record to the new confidence property.
        confidence: rawRecord.confidence,
        
        // Assign the satellite name from the raw record to the new satellite property.
        satellite: rawRecord.satellite
    };
}

// Create an asynchronous function to fetch the FIRMS data.
// We export this function so it can be used in app.js.
export async function fetchFirmsData() {
    
    // Log a message to the console indicating that the fetch process is starting.
    console.log("Starting to fetch FIRMS data...");
    
    // Start a try block to handle any errors that might occur during the fetch.
    try {
        
        // Build the URL we want to request data from.
        const requestUrl = FIRMS_API_CONFIG.baseUrl;
        
        // Log the URL we are about to fetch for debugging purposes.
        console.log(`Fetching from URL: ${requestUrl}`);
        
        // Send an HTTP request to the specified URL using fetch(), and wait for the response.
        const response = await fetch(requestUrl);
        
        // Check if the server response is NOT okay (e.g., a 404 Not Found error).
        if (!response.ok) {
            
            // If the response is bad, throw an error to stop execution and go to the catch block.
            throw new Error(`HTTP error! status: ${response.status}`);
            
        // Close the if statement.
        }
        
        // Check if the response actually contains JSON data by inspecting the Content-Type header.
        // For local files without servers, Content-Type might be null, so we are careful.
        // We will just proceed to parse it.
        
        // Convert the server response from JSON text into a JavaScript object/array.
        const rawData = await response.json();
        
        // Log the raw data received from the server to the browser console.
        console.log("Raw data received:", rawData);
        
        // Check if the data is an array and if it is empty.
        if (Array.isArray(rawData) && rawData.length === 0) {
            
            // If it is empty, throw an error so the user knows no data was found.
            throw new Error("The dataset is empty. No hotspots found.");
            
        // Close the if statement.
        }
        
        // Create an empty array to store our standardized records.
        const standardizedData = [];
        
        // Loop through every single record in the raw data array.
        for (const record of rawData) {
            
            // Convert the raw record into our standardized format.
            const cleanRecord = standardizeHotspot(record);
            
            // Add the standardized record into our new array.
            standardizedData.push(cleanRecord);
            
        // Close the for loop.
        }
        
        // Log a success message to the console showing how many records were processed.
        console.log(`Successfully processed ${standardizedData.length} records.`);
        
        // Return the clean, standardized data to whatever part of the app called this function.
        return standardizedData;
        
    // Catch any errors that occurred in the try block (like network failure or bad JSON).
    } catch (error) {
        
        // Log the exact error message to the browser console so developers can debug it.
        console.error("An error occurred during fetchFirmsData:", error);
        
        // Re-throw the error so the function that called this one knows something went wrong.
        throw error;
        
    // Close the catch block.
    }
    
// Close the asynchronous function.
}

