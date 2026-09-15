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
    fallbackUrl: "data/demo-firms.json"
// Ends the configuration object.
};

// Defines an asynchronous function that orchestrates fetching and processing FIRMS data.
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
