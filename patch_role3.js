const fs = require('fs');

let apiCode = fs.readFileSync('js/api.js', 'utf8');

const role3Addition = `
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

        console.log(\`Role 3: Successfully prepared \${combinedData.length} records for clustering.\`);
        return combinedData;

    } catch (error) {
        console.error("Role 3: Error preparing clustering dataset:", error.message);
        
        // Return empty array on failure so the app doesn't crash
        return [];
    }
}
`;

apiCode += '\n' + role3Addition;
fs.writeFileSync('js/api.js', apiCode);

let appCode = fs.readFileSync('js/app.js', 'utf8');

appCode = appCode.replace(
    "import { fetchFIRMSData, fetchNearbyIndustrialFacilities } from './api.js';",
    "import { fetchFIRMSData, fetchNearbyIndustrialFacilities, getHotspotsForClustering } from './api.js';"
);

appCode = appCode.replace(
    "const apiHotspots = await fetchFIRMSData(true); // Using true for demo/fallback mode",
    "// DAY 5 ROLE 3: Use the new clustering integration function\\n            const apiHotspots = await getHotspotsForClustering(true); // Fetch and merge data for clustering"
);

fs.writeFileSync('js/app.js', appCode);
console.log("Patched api.js and app.js successfully.");
