// Defines an object to store configuration settings for the NASA FIRMS API.
const FIRMS_API_CONFIG = {
    // Stores the base URL endpoint for NASA FIRMS CSV area requests.
    endpoint: "https://firms.modaps.eosdis.nasa.gov/api/area/csv/",
    
    // Provides a placeholder for the required NASA FIRMS API key (must be supplied by the user).
    apiKey: "YOUR_NASA_FIRMS_API_KEY",
    
    // Sets the geographic bounding area to fetch data for (e.g., 'world').
    area: "world",
    
    // Defines how many days of past data to request (e.g., 1 day).
    dayRange: 1,

    // Defines a fallback URL pointing to our local demo file for testing without a live key.
    fallbackUrl: "data/demo-firms.json",

    // Defines a fallback URL pointing to our local demo file for historical testing.
    historicalFallbackUrl: "data/demo-historical-firms.json"
// Ends the configuration object.
};

// Defines an asynchronous function that orchestrates fetching and processing FIRMS data for the initial load.
export async function fetchFIRMSData(useDemo = true) {
    // Declares a variable to hold the final URL we will request data from.
    let requestUrl = "";
    
    // Checks if the application is running in demo mode.
    if (useDemo) {
        // Sets the request URL to our local fallback JSON file.
        requestUrl = FIRMS_API_CONFIG.fallbackUrl;
    // Ends the if condition and starts the alternative branch.
    } else {
        // Constructs the real NASA API URL by combining our configuration variables.
        requestUrl = `${FIRMS_API_CONFIG.endpoint}${FIRMS_API_CONFIG.apiKey}/VIIRS_SNPP_NRT/${FIRMS_API_CONFIG.area}/${FIRMS_API_CONFIG.dayRange}`;
    // Ends the else branch.
    }

    // Prints a message to the browser console to show the fetch has started.
    console.log(`FIRMS request started: fetching from ${requestUrl}`);

    // Starts a try block to catch any errors that happen during the network request or processing.
    try {
        // Sends the network request to the URL and waits for the server's response.
        const response = await fetch(requestUrl);
        
        // Checks if the HTTP response status code indicates a failure (like 404 Not Found).
        if (!response.ok) {
            // Stops execution and throws an error displaying the specific HTTP status code.
            throw new Error(`NASA FIRMS returned HTTP status: ${response.status}`);
        // Ends the HTTP response check block.
        }

        // Reads the raw content from the server response as plain text and waits for it to finish.
        const rawText = await response.text();
        
        // Prints a message to the browser console confirming the response was received.
        console.log("FIRMS response received.");

        // Calls a function to parse the raw text (which might be JSON or CSV) into JavaScript objects.
        const parsedData = parseFIRMSResponse(rawText);

        // Calls a function to filter out any records that have invalid or missing coordinates.
        const validData = validateFIRMSData(parsedData);

        // Calls a function to convert the valid records into our standardized ThermalX format.
        const normalizedHotspots = normalizeHotspotData(validData);

        // Checks if our final list of hotspots is completely empty.
        if (normalizedHotspots.length === 0) {
            // Stops execution and throws an error indicating no useful data was found.
            throw new Error("No thermal hotspots were returned.");
        // Ends the empty data check block.
        }

        // Returns the final, clean array of hotspot objects to whichever function called this one.
        return normalizedHotspots;

    // Catches any errors that were thrown anywhere inside the try block.
    } catch (error) {
        // Prints the specific error message to the browser console for debugging.
        console.error("FIRMS request failed:", error.message);
        
        // Throws a new, user-friendly error string so the user interface can display it.
        throw new Error(`Unable to connect to NASA FIRMS. Details: ${error.message}`);
    // Ends the catch block.
    }
// Ends the fetchFIRMSData function.
}

// Defines an asynchronous function to fetch historical data around a specific location.
export async function fetchHistoricalFirmsData(latitude, longitude, referenceDate, useDemo = true) {
    // Declares a variable to hold the final URL for historical data fetching.
    let requestUrl = "";
    
    // Checks if the application is running in demo mode for historical data.
    if (useDemo) {
        // Sets the request URL to our historical local fallback JSON file.
        requestUrl = FIRMS_API_CONFIG.historicalFallbackUrl;
    // Ends the if condition and starts the alternative branch for live historical data.
    } else {
        // Calculates a simple bounding box around the selected hotspot (e.g., +/- 0.1 degrees).
        // Defines the western boundary (longitude minus 0.1).
        const west = Number(longitude) - 0.1;
        
        // Defines the southern boundary (latitude minus 0.1).
        const south = Number(latitude) - 0.1;
        
        // Defines the eastern boundary (longitude plus 0.1).
        const east = Number(longitude) + 0.1;
        
        // Defines the northern boundary (latitude plus 0.1).
        const north = Number(latitude) + 0.1;
        
        // Formats the bounding box string required by the FIRMS API: west,south,east,north.
        const boundingBox = `${west},${south},${east},${north}`;
        
        // Sets the number of historical days to fetch (e.g., 10 days for persistence check).
        const historicalDays = 10;
        
        // Constructs the real NASA API URL for the specified bounding box and historical time range.
        requestUrl = `${FIRMS_API_CONFIG.endpoint}${FIRMS_API_CONFIG.apiKey}/VIIRS_SNPP_NRT/${boundingBox}/${historicalDays}`;
    // Ends the else branch.
    }

    // Prints a message to the browser console indicating the historical fetch has started.
    console.log(`FIRMS historical request started: fetching from ${requestUrl}`);

    // Starts a try block to handle network errors safely without crashing the application.
    try {
        // Sends the network request to the historical URL and waits for the response.
        const response = await fetch(requestUrl);
        
        // Checks if the server responded with an error HTTP status code.
        if (!response.ok) {
            // Stops execution and throws a clear error message with the status code.
            throw new Error(`NASA FIRMS returned HTTP status: ${response.status}`);
        // Ends the HTTP response check block.
        }

        // Reads the raw content from the server response as text.
        const rawText = await response.text();
        
        // Prints a success message to the browser console confirming data receipt.
        console.log("FIRMS historical response received.");

        // Calls our existing function to parse the raw CSV/JSON text into JavaScript objects.
        const parsedData = parseFIRMSResponse(rawText);

        // Calls our existing function to filter out records that are missing or have invalid coordinates.
        const validData = validateFIRMSData(parsedData);

        // Calls our existing function to normalize the valid records into the standard ThermalX format.
        const normalizedHotspots = normalizeHotspotData(validData);

        // Checks if the resulting array contains any valid records.
        if (normalizedHotspots.length === 0) {
            // Throws an error to signal that no historical activity was found in this area.
            throw new Error("No historical hotspots were returned for this location.");
        // Ends the empty data check block.
        }

        // Sorts the historical records chronologically from oldest to newest based on the date field.
        normalizedHotspots.sort((a, b) => {
            // Converts the date string of record A into a numeric timestamp.
            const dateA = new Date(a.date).getTime();
            // Converts the date string of record B into a numeric timestamp.
            const dateB = new Date(b.date).getTime();
            // Returns the difference to sort them ascending (oldest first).
            return dateA - dateB;
        // Ends the sorting callback function.
        });

        // Returns a predictable success structure containing our standardized, sorted historical records.
        // This structure allows Role 4 to easily consume the data or check for success.
        return {
            // Sets a success flag indicating the data was fetched and processed correctly.
            success: true,
            // Attaches the sorted array of historical hotspot objects.
            data: normalizedHotspots
        // Ends the return object.
        };

    // Catches any errors that occurred during the fetch, parse, or validation steps.
    } catch (error) {
        // Logs the exact error message to the browser console for developers.
        console.error("Historical FIRMS request failed:", error.message);
        
        // Returns a predictable failure structure instead of throwing an uncaught error.
        // This prevents the application from crashing and gives Role 4 an easy way to handle the failure.
        return {
            // Sets the success flag to false.
            success: false,
            // Provides an empty array as a safe fallback for the data field.
            data: [],
            // Provides a human-readable error message that can be displayed in the UI.
            error: `Unable to fetch historical data: ${error.message}`
        // Ends the error return object.
        };
    // Ends the catch block.
    }
// Ends the fetchHistoricalFirmsData function.
}

// Defines a function to figure out if the data is JSON or CSV and parse it accordingly.
function parseFIRMSResponse(rawText) {
    // Starts a try block in case the parsing logic fails or crashes.
    try {
        // Removes any extra spaces or hidden characters from the very beginning and end of the text.
        const trimmedText = rawText.trim();
        
        // Checks if the first character is a square bracket or curly brace, which usually means it's JSON.
        if (trimmedText.startsWith('[') || trimmedText.startsWith('{')) {
            // Uses the built-in JSON parser to convert the text into JavaScript objects and returns it.
            return JSON.parse(trimmedText);
        // Ends the JSON check and starts the alternative branch for CSV.
        } else {
            // Splits the giant block of CSV text into an array of individual lines.
            const lines = trimmedText.split('\n');
            
            // Takes the very first line (row 0), which contains the column headers, and splits it by commas.
            const headers = lines[0].split(',');
            
            // Creates an empty array that will store all our newly created row objects.
            const records = [];
            
            // Starts a loop to go through every line of data, starting at index 1 to skip the headers.
            for (let rowIndex = 1; rowIndex < lines.length; rowIndex++) {
                // Checks if the current line is completely empty (like a blank line at the end of a file).
                if (!lines[rowIndex].trim()) {
                    // Skips this empty line and moves on to the next iteration of the loop.
                    continue;
                // Ends the empty line check.
                }
                
                // Splits the current data row by commas to isolate the individual cell values.
                const values = lines[rowIndex].split(',');
                
                // Creates an empty object to represent this specific row of data.
                const record = {};
                
                // Starts an inner loop to match each cell value with its corresponding column header.
                for (let columnIndex = 0; columnIndex < headers.length; columnIndex++) {
                    // Cleans up the header name to use as a key in our object.
                    const key = headers[columnIndex].trim();
                    
                    // Assigns the cell value to the object key, or an empty string if the value is missing.
                    record[key] = values[columnIndex] ? values[columnIndex].trim() : "";
                // Ends the inner loop over the columns.
                }
                
                // Adds our fully constructed row object into our main list of records.
                records.push(record);
            // Ends the outer loop over the rows.
            }
            
            // Returns the final array of parsed CSV records.
            return records;
        // Ends the CSV branch.
        }
    // Catches any unexpected errors that happen while parsing.
    } catch (error) {
        // Throws a custom error letting the application know the data format was completely unreadable.
        throw new Error("FIRMS response format is invalid.");
    // Ends the catch block.
    }
// Ends the parseFIRMSResponse function.
}

// Defines a function to remove records that are broken, missing coordinates, or mathematically impossible.
function validateFIRMSData(parsedData) {
    // Checks if the parsed data is already an array; if not, it wraps the single item inside a new array.
    const dataArray = Array.isArray(parsedData) ? parsedData : [parsedData];
    
    // Filters the array, keeping only the records that pass our strict validation rules.
    const validRecords = dataArray.filter((record) => {
        // Attempts to convert the text-based latitude into a true numeric decimal (float).
        const lat = parseFloat(record.latitude);
        
        // Attempts to convert the text-based longitude into a true numeric decimal (float).
        const lon = parseFloat(record.longitude);
        
        // Checks if the latitude conversion failed (resulting in 'Not-a-Number' / NaN).
        if (isNaN(lat)) {
            // Rejects this record because it doesn't have a valid latitude.
            return false;
        // Ends the latitude NaN check.
        }
        
        // Checks if the longitude conversion failed (resulting in 'Not-a-Number' / NaN).
        if (isNaN(lon)) {
            // Rejects this record because it doesn't have a valid longitude.
            return false;
        // Ends the longitude NaN check.
        }
        
        // Checks if the latitude is further south than -90 or further north than 90.
        if (lat < -90 || lat > 90) {
            // Rejects this record because it is physically impossible on Earth.
            return false;
        // Ends the latitude bounds check.
        }
        
        // Checks if the longitude is further west than -180 or further east than 180.
        if (lon < -180 || lon > 180) {
            // Rejects this record because it is physically impossible on Earth.
            return false;
        // Ends the longitude bounds check.
        }
        
        // Returns true because the record survived all tests and is mathematically valid.
        return true;
    // Ends the filter function.
    });

    // Calculates how many records were rejected by subtracting the valid count from the total count.
    const invalidCount = dataArray.length - validRecords.length;
    
    // Prints a summary of the validation results to the browser console.
    console.log(`Validation complete: ${validRecords.length} valid records, ${invalidCount} invalid records ignored.`);
    
    // Returns the new, filtered list containing only safe, valid hotspots.
    return validRecords;
// Ends the validateFIRMSData function.
}

// Defines a function to transform various API formats (like NASA CSV vs Demo JSON) into one standard shape.
function normalizeHotspotData(validData) {
    // Creates a new array by mapping over and transforming every single valid record.
    return validData.map((record, index) => {
        // Creates and returns a brand-new object with exactly the properties ThermalX expects.
        return {
            // Uses the existing ID if it has one, otherwise generates a fallback ID using the loop index.
            id: record.id || `HOTSPOT-${index}`,
            
            // Ensures the latitude is stored as a true number instead of text.
            latitude: parseFloat(record.latitude),
            
            // Ensures the longitude is stored as a true number instead of text.
            longitude: parseFloat(record.longitude),
            
            // Tries multiple possible brightness keys (NASA CSV often uses 'bright_ti4') and defaults to 0.
            brightness: parseFloat(record.brightness || record.bright_ti4 || 0),
            
            // Ensures Fire Radiative Power is a number, defaulting to 0 if missing.
            frp: parseFloat(record.frp || 0),
            
            // Copies the confidence value, or uses 'unknown' if it was not provided.
            confidence: record.confidence || "unknown",
            
            // Tries multiple possible date keys (NASA CSV often uses 'acq_date') and defaults to 'unknown'.
            date: record.date || record.acq_date || "unknown",
            
            // Copies the satellite name, or uses 'unknown' if it was not provided.
            satellite: record.satellite || "unknown"
        // Ends the returned standard object.
        };
    // Ends the map transformation function.
    });
// Ends the normalizeHotspotData function.
}

// ============================================================================
// DAY 4 ROLE 3: OSM OVERPASS API INTEGRATION
// ============================================================================

// Defines the Overpass API endpoint for querying OpenStreetMap data.
// We use a reliable public instance.
const OVERPASS_API_URL = "https://overpass-api.de/api/interpreter";

// Defines the default search radius in meters around the hotspot (e.g., 5000 meters = 5km).
const INDUSTRIAL_SEARCH_RADIUS = 5000;

// Simple in-memory cache to prevent identical duplicate requests during the same session.
const overpassCache = new Map();

/**
 * ----------------------------------------------------
 * FUNCTION: fetchNearbyIndustrialFacilities(latitude, longitude, radius)
 *
 * PURPOSE:
 * Queries the OSM Overpass API to find industrial facilities
 * near the selected thermal hotspot.
 *
 * INPUT:
 * latitude, longitude - Coordinates of the selected hotspot.
 * radius - Search radius in meters (defaults to 5000).
 *
 * OUTPUT:
 * Returns an array of standardized facility objects.
 * ----------------------------------------------------
 */
export async function fetchNearbyIndustrialFacilities(latitude, longitude, radius = INDUSTRIAL_SEARCH_RADIUS) {
    // 1. Validate the input coordinates. If they are missing or invalid, fail safely.
    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);
    if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
        console.warn("Invalid coordinates provided to Overpass API.");
        return [];
    }

    // 2. Generate a cache key. If we already searched this exact spot, return the cached result immediately.
    const cacheKey = `${lat.toFixed(4)}_${lon.toFixed(4)}_${radius}`;
    if (overpassCache.has(cacheKey)) {
        console.log("Returning industrial facilities from cache.");
        return overpassCache.get(cacheKey);
    }

    console.log(`Searching OSM for industrial facilities within ${radius}m of ${lat}, ${lon}...`);

    // 3. Build the Overpass QL query.
    // We search for nodes, ways, and relations that have industrial tags near the coordinate.
    const query = `
        [out:json][timeout:25];
        (
            nwr["landuse"="industrial"](around:${radius},${lat},${lon});
            nwr["man_made"="works"](around:${radius},${lat},${lon});
            nwr["power"="plant"](around:${radius},${lat},${lon});
            nwr["industrial"](around:${radius},${lat},${lon});
            nwr["amenity"="factory"](around:${radius},${lat},${lon});
            nwr["man_made"="mineshaft"](around:${radius},${lat},${lon});
        );
        out center;
    `;

    try {
        // 4. Send the request to the Overpass API using POST (safer for long queries than GET).
        const response = await fetch(OVERPASS_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: `data=${encodeURIComponent(query)}`
        });

        // 5. Handle HTTP errors gracefully.
        if (!response.ok) {
            throw new Error(`Overpass API returned HTTP status: ${response.status}`);
        }

        // 6. Parse the raw JSON response from OSM.
        const rawData = await response.json();

        // 7. Validate that the expected elements array exists.
        if (!rawData || !Array.isArray(rawData.elements)) {
            throw new Error("Overpass API returned malformed data.");
        }

        // 8. Convert raw OSM elements into our standardized ThermalX facility format.
        const facilities = [];

        rawData.elements.forEach(element => {
            // Determine the coordinates. Ways/relations use 'center', nodes use 'lat'/'lon'.
            const facLat = element.center ? element.center.lat : element.lat;
            const facLon = element.center ? element.center.lon : element.lon;

            // Discard records that are missing coordinates.
            if (facLat === undefined || facLon === undefined) return;

            // Safely get tags, defaulting to an empty object.
            const tags = element.tags || {};

            // Determine a human-readable type based on the OSM tags.
            let type = "Industrial Facility";
            if (tags.power === "plant") type = "Power Plant";
            else if (tags.man_made === "works" || tags.amenity === "factory") type = "Factory";
            else if (tags.man_made === "mineshaft") type = "Mine";
            else if (tags.landuse === "industrial") type = "Industrial Area";

            // Determine a safe name, providing a fallback if unnamed.
            const name = tags.name || `Unnamed ${type}`;

            // Create the standardized facility object.
            const facility = {
                id: `OSM-${element.type}-${element.id}`,
                name: name,
                type: type,
                latitude: parseFloat(facLat),
                longitude: parseFloat(facLon),
                tags: tags,
                source: "OpenStreetMap",
                osmType: element.type,
                osmId: element.id
            };

            facilities.push(facility);
        });

        // 9. Save the successfully parsed facilities to our in-memory cache.
        overpassCache.set(cacheKey, facilities);
        console.log(`Found ${facilities.length} industrial facilities.`);

        // 10. Return the standard array to be used by Map/UI/Processing modules.
        return facilities;

    } catch (error) {
        // 11. Handle network failures or parsing crashes safely.
        // We log the error but return an empty array so the dashboard doesn't crash.
        console.error("OSM Overpass API request failed:", error.message);
        return [];
    }
}



// ============================================================================
// DAY 5 ROLE 3: THERMAL EVENT CLUSTERING DATA FLOW
// ============================================================================
// Memory cache to prevent duplicate requests when loading clustering data
let clusteringDataCache = null;

/**
 * ------------------------------------------------------------
 * FUNCTION: getHotspotsForClustering(useDemo = true)
 * 
 * PURPOSE:
 * Provides a consolidated, normalized dataset of historical
 * and current FIRMS hotspot records to Role 4 for spatial 
 * clustering and persistence analysis.
 * 
 * It implements a Fetch -> Normalize -> Cache -> Return pattern
 * to avoid duplicate API requests and unnecessary parsing.
 * 
 * INPUT:
 * useDemo - Boolean indicating whether to use live API or local fallback.
 * 
 * OUTPUT:
 * Array of standardized hotspot objects ready for clustering.
 * ------------------------------------------------------------
 */
export async function getHotspotsForClustering(useDemo = true) {
    // 1. Return from memory cache if already fetched and normalized
    if (clusteringDataCache && clusteringDataCache.length > 0) {
        console.log("Role 3: Returning cached hotspot data for clustering.");
        return clusteringDataCache;
    }

    // 2. Check localStorage if available (survive page refreshes)
    try {
        const stored = localStorage.getItem('thermalx_clustering_data');
        if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed) && parsed.length > 0) {
                console.log("Role 3: Loaded hotspot data from localStorage.");
                clusteringDataCache = parsed;
                return parsed;
            }
        }
    } catch (e) {
        console.warn("Role 3: Failed to read from localStorage.", e);
    }

    console.log("Role 3: Fetching hotspot dataset for clustering...");
    
    try {
        let combinedData = [];

        if (useDemo) {
            // In demo mode, simulate a robust historical dataset by merging
            // both our snapshot and historical JSON files.
            const [currentRes, historicalRes] = await Promise.all([
                fetch(FIRMS_API_CONFIG.fallbackUrl),
                fetch(FIRMS_API_CONFIG.historicalFallbackUrl)
            ]);

            if (!currentRes.ok || !historicalRes.ok) {
                throw new Error("Failed to fetch demo data files.");
            }

            const currentRaw = await currentRes.text();
            const historicalRaw = await historicalRes.text();

            const parsedCurrent = parseFIRMSResponse(currentRaw);
            const parsedHistorical = parseFIRMSResponse(historicalRaw);

            const validCurrent = validateFIRMSData(parsedCurrent);
            const validHistorical = validateFIRMSData(parsedHistorical);

            const normCurrent = normalizeHotspotData(validCurrent);
            const normHistorical = normalizeHotspotData(validHistorical);

            // Merge and deduplicate by ID just in case
            const allHotspots = [...normCurrent, ...normHistorical];
            const uniqueMap = new Map();
            allHotspots.forEach(h => {
                if (h && h.id && !uniqueMap.has(h.id)) {
                    uniqueMap.set(h.id, h);
                }
            });
            combinedData = Array.from(uniqueMap.values());
            
        } else {
            // Live API fallback
            const rawLive = await fetchFIRMSData(false);
            if (!rawLive || rawLive.length === 0) {
                throw new Error("Live API returned no data.");
            }
            combinedData = rawLive;
        }

        if (combinedData.length === 0) {
            console.warn("Role 3: No valid data found for clustering.");
            return [];
        }

        // Cache in memory
        clusteringDataCache = combinedData;

        // Persist to localStorage safely
        try {
            localStorage.setItem('thermalx_clustering_data', JSON.stringify(combinedData));
        } catch (e) {
            console.warn("Role 3: Could not save to localStorage (quota exceeded?).");
        }

        console.log(`Role 3: Successfully prepared ${combinedData.length} records for clustering.`);
        return combinedData;

    } catch (error) {
        console.error("Role 3: Error preparing clustering dataset:", error.message);
        
        // Return empty array on failure so the app doesn't crash
        return [];
    }
}

// ============================================================================
// ML API INTEGRATION (DAY 7/8)
// ============================================================================

const ML_API_URL = "http://127.0.0.1:8000/predict";

/**
 * Sends extracted ML features to the FastAPI service and returns the Random Forest classification.
 * Falls back to a simulated demo response if the ML service is unreachable.
 * 
 * @param {Object} eventFeatures The structured feature vector (e.g. average_frp, persistence_score)
 * @returns {Promise<Object>} The classification prediction, probability, and evidence.
 */
async function predictThermalEventClass(eventFeatures) {
    try {
        console.log("Sending features to ML API:", eventFeatures);
        
        const response = await fetch(ML_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(eventFeatures)
        });

        if (!response.ok) {
            throw new Error(`ML API HTTP error! status: ${response.status}`);
        }

        // Return structured JSON prediction from the FastAPI service
        return await response.json();
        
    } catch (error) {
        console.warn("ML service is unavailable. Falling back to Demo Classification Mode.", error);
        
        // Graceful fallback if the FastAPI server is down during a demo
        return {
            prediction: "Unknown (API Offline)",
            probability: 0.0,
            probabilities: {
                "Industrial": 0.0,
                "Wildfire": 0.0,
                "Agricultural": 0.0,
                "Other": 0.0,
                "Unknown": 1.0
            },
            features: {},
            model: "Demo Fallback",
            error: true
        };
    }
}
