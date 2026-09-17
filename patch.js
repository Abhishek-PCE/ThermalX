const fs = require('fs');
let code = fs.readFileSync('js/classification.js', 'utf8');

const newCode = `

// ============================================================================
// DAY 5 ROLE 5: CLASSIFICATION EVIDENCE GENERATION
// ============================================================================

/**
 * ============================================================
 * EVIDENCE VALIDATION
 * ============================================================
 * Ensures that evidence values are valid before they are passed
 * to the classification engine.
 *
 * Missing values are represented explicitly instead of being
 * silently converted to zero.
 *
 * This prevents missing data from being interpreted as genuine
 * evidence of low or high activity.
 * ============================================================
 */
function validateNumericEvidence(val) {
    if (val === null || val === undefined) return null;
    const num = Number(val);
    if (Number.isNaN(num) || !Number.isFinite(num) || num < 0) return null;
    return num;
}

/**
 * ============================================================
 * AVERAGE FRP CALCULATION
 * ============================================================
 * Calculates the average Fire Radiative Power for all valid
 * detections belonging to the thermal event.
 *
 * Invalid or missing FRP values are ignored.
 * If no valid FRP values exist, the function returns null
 * rather than incorrectly treating missing data as zero.
 * ============================================================
 */
function calculateAverageFRP(detections) {
    if (!Array.isArray(detections) || detections.length === 0) return null;
    
    let sum = 0;
    let count = 0;
    
    for (const d of detections) {
        if (d && d.frp !== undefined && d.frp !== null) {
            const val = Number(d.frp);
            if (!Number.isNaN(val) && Number.isFinite(val) && val >= 0) {
                sum += val;
                count++;
            }
        }
    }
    
    return count > 0 ? (sum / count) : null;
}

/**
 * Helper to calculate average confidence if missing from event root
 */
function calculateAverageConfidence(detections) {
    if (!Array.isArray(detections) || detections.length === 0) return null;
    
    let sum = 0;
    let count = 0;
    
    for (const d of detections) {
        if (d && d.confidence !== undefined && d.confidence !== null) {
            let val = Number(d.confidence);
            // Handle standard categorical mappings
            if (Number.isNaN(val)) {
                 const str = String(d.confidence).toLowerCase();
                 if (str === 'h' || str === 'high') val = 100;
                 else if (str === 'n' || str === 'nominal') val = 50;
                 else if (str === 'l' || str === 'low') val = 10;
                 else continue;
            }
            
            if (Number.isFinite(val) && val >= 0) {
                sum += val;
                count++;
            }
        }
    }
    
    return count > 0 ? (sum / count) : null;
}

/**
 * ============================================================
 * EVIDENCE OBJECT CREATION
 * ============================================================
 * Converts a processed thermal event into a standardized set
 * of features that the Day 6 classification engine can use.
 *
 * IMPORTANT:
 * This function does NOT classify the event.
 * It only prepares evidence.
 *
 * Input:
 * - Processed thermal event containing persistence, detections,
 *   industrial-distance information, FRP and confidence.
 *
 * Output:
 * - Standardized evidence object.
 *
 * Keeping evidence generation separate from classification
 * makes the system easier to test and explain.
 * ============================================================
 */
function createEvidenceObject(event) {
    if (!event) return null;

    // 1. Persistence Score
    let pScore = null;
    if (event.persistenceScore !== undefined) {
        pScore = validateNumericEvidence(event.persistenceScore);
    } else if (event.persistence && event.persistence.score !== undefined) {
        pScore = validateNumericEvidence(event.persistence.score);
    }

    // 2. Detection Count
    let dCount = validateNumericEvidence(event.detectionCount);
    if (dCount === null && event.persistence) {
        dCount = validateNumericEvidence(event.persistence.detectionCount);
    }
    
    // 3. Industrial Distance
    let indDist = null;
    if (event.industrialContext && event.industrialContext.nearestFacility && event.industrialContext.nearestFacility.distanceFromHotspot !== undefined) {
        indDist = validateNumericEvidence(event.industrialContext.nearestFacility.distanceFromHotspot);
    } else if (event.industrialContext && event.industrialContext.distance !== undefined) {
        indDist = validateNumericEvidence(event.industrialContext.distance);
    }

    // 4. Average FRP
    let avgFrp = validateNumericEvidence(event.frp);
    // Fallback if the event didn't average it already
    if (avgFrp === null && Array.isArray(event.detections)) {
        avgFrp = calculateAverageFRP(event.detections);
    }

    // 5. Confidence
    let conf = validateNumericEvidence(event.confidence);
    // Fallback if the event didn't average it already
    if (conf === null && Array.isArray(event.detections)) {
        conf = calculateAverageConfidence(event.detections);
    }

    return {
        persistenceScore: pScore,
        detectionCount: dCount,
        industrialDistance: indDist,
        averageFRP: avgFrp,
        confidence: conf
    };
}
`;

code = code.replace(
    'window.ThermalXClassification = {', 
    newCode + '\nwindow.ThermalXClassification = {'
);

code = code.replace(
    'isClassifiable,',
    'isClassifiable,\n    createEvidenceObject,\n    validateNumericEvidence,\n    calculateAverageFRP,'
);

fs.writeFileSync('js/classification.js', code);
console.log("classification.js patched.");
