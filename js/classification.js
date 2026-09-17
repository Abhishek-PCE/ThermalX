/**
 * ThermalX - Day 1 Role 5
 * Classification Logic Engineer
 *
 * This module provides a clean, explainable, rule-based classification engine.
 * It is a pure logic module that does NOT manipulate the DOM or rely on external frameworks.
 * It consumes processed hotspot features (from Role 4) and outputs a standardized
 * classification result (category, confidence, evidence, reasons, priority).
 *
 * IMPORTANT:
 * This uses decision-support heuristics, NOT a trained machine-learning model.
 * The output is an estimate and requires human verification.
 */

// ============================================================================
// 1. CLASSIFICATION CATEGORIES
// ============================================================================
// Centralized definitions so we avoid raw strings and typos across the app.
const CATEGORIES = {
    INDUSTRIAL: "Industrial",
    WILDFIRE: "Wildfire",
    AGRICULTURE: "Agricultural",
    OTHER: "Other",
    UNKNOWN: "Unknown"
};

// ============================================================================
// 2. INPUT FEATURE STRUCTURE (DOCUMENTATION)
// ============================================================================
/**
 * EXPECTED INPUT FEATURE OBJECT
 * 
 * Available Now (from Role 4):
 * - latitude: number
 * - longitude: number
 * - brightness: number (optional)
 * - frp: number (optional)
 * - confidence: string/number
 * - date: string
 *
 * Expected from Future Roles (Days 2-8):
 * - persistence: { score: number, detectionCount: number, uniqueDays: number }
 * - industrialContext: { nearestFacility: string, distance: number, relevance: number }
 * - landContext: { type: string } // e.g., "forest", "farmland"
 * - cluster: { isExpanding: boolean, size: number }
 */

// ============================================================================
// DAY 3 ROLE 5: PERSISTENCE SCORING ENGINE
// ============================================================================

// --------------------------------------------------
// Persistence Threshold Configuration
// Defines the prototype thresholds used to categorize
// how frequently a thermal event was detected.
// These values are decision-support heuristics,
// not scientific ground truth.
// --------------------------------------------------
const PERSISTENCE_THRESHOLDS = {
    LOW: { max: 20, label: "LOW" },
    MODERATE: { max: 50, label: "MODERATE" },
    HIGH: { max: 80, label: "HIGH" },
    VERY_HIGH: { max: 100, label: "VERY HIGH" }
};

// --------------------------------------------------
// Date Normalization
// Converts different date representations into a
// consistent YYYY-MM-DD format so multiple detections
// on the same calendar day are counted only once.
// --------------------------------------------------
function normalizeDateString(dateInput) {
    if (!dateInput) return null;
    return String(dateInput).split('T')[0];
}

// --------------------------------------------------
// Unique Days Calculation
// Determines the number of unique calendar days
// on which the event was detected.
// --------------------------------------------------
function getUniqueDays(detections) {
    if (!Array.isArray(detections)) return 0;
    const uniqueDaysSet = new Set();
    detections.forEach(det => {
        // Look for the date in common properties
        const rawDate = det.date || det.acq_date || det.timestamp;
        if (rawDate) {
            const dateStr = normalizeDateString(rawDate);
            if (dateStr) uniqueDaysSet.add(dateStr);
        } else if (typeof det === 'string' || typeof det === 'number') {
            // Handle if the array just contains raw strings/timestamps
            const dateStr = normalizeDateString(det);
            if (dateStr) uniqueDaysSet.add(dateStr);
        }
    });
    return uniqueDaysSet.size;
}

// --------------------------------------------------
// Persistence Score Calculation & Category
// Calculates the percentage of analysed days on which
// the thermal event was detected.
// Formula:
// persistence = (days detected / days analysed) × 100
// --------------------------------------------------
function calculatePersistence(event, analysisDays = 7) {
    // --------------------------------------------------
    // Validation
    // Protects the application from invalid or incomplete
    // historical data.
    // --------------------------------------------------
    if (!event) {
        throw new Error("Invalid event data provided for persistence calculation.");
    }

    let daysDetected = 0;

    // Use Role 4's pre-calculated uniqueDays if available
    if (event.persistence && typeof event.persistence.uniqueDays === 'number') {
        daysDetected = event.persistence.uniqueDays;
    } 
    // Fallback: extract unique days from an array of raw detections
    else if (Array.isArray(event.detections)) {
        daysDetected = getUniqueDays(event.detections);
    } else {
        // Minimal fallback
        daysDetected = 0;
    }

    // Safety checks
    if (!Number.isFinite(analysisDays) || analysisDays < 1) {
        analysisDays = 1;
    }

    if (daysDetected > analysisDays) {
        // Cap daysDetected to analysisDays to prevent > 100%
        daysDetected = analysisDays;
    }

    // Calculate score
    let score = (daysDetected / analysisDays) * 100;
    
    // Clamp between 0 and 100 just in case
    score = Math.max(0, Math.min(100, score));
    
    // Format to 2 decimal places
    score = parseFloat(score.toFixed(2));

    // --------------------------------------------------
    // Persistence Category
    // Converts the numerical persistence percentage into
    // LOW, MODERATE, HIGH, or VERY HIGH based on thresholds.
    // Exactly 20 falls into LOW, 50 into MODERATE, etc.
    // --------------------------------------------------
    let category = PERSISTENCE_THRESHOLDS.LOW.label;
    if (score > PERSISTENCE_THRESHOLDS.HIGH.max) {
        category = PERSISTENCE_THRESHOLDS.VERY_HIGH.label;
    } else if (score > PERSISTENCE_THRESHOLDS.MODERATE.max) {
        category = PERSISTENCE_THRESHOLDS.HIGH.label;
    } else if (score > PERSISTENCE_THRESHOLDS.LOW.max) {
        category = PERSISTENCE_THRESHOLDS.MODERATE.label;
    }

    // Generate explainable evidence
    const evidenceString = `Detected on ${daysDetected} of ${analysisDays} analysed days.`;

    return {
        daysDetected: daysDetected,
        daysAnalysed: analysisDays,
        persistenceScore: score,
        persistenceCategory: category,
        evidence: evidenceString
    };
}


// ============================================================================
// 3 & 5. INITIAL INDICATORS & SCORING SYSTEM PLACEHOLDER
// ============================================================================
/**
 * Prototype heuristic scoring rules.
 * These will be refined in Days 2-8 into a weighted scoring engine.
 * Example future calculation: 
 * (Persistence × 0.35) + (Industrial Proximity × 0.30) + (FRP × 0.20) + (Confidence × 0.15)
 */
const HEURISTICS = {
    INDUSTRIAL: {
        minPersistenceScore: 50,     // High/Moderate persistence indicates static flare/factory
        maxFacilityDistance: 2.0,    // km
        requiresHighFRP: false       // Industrial could be low or high FRP
    },
    WILDFIRE: {
        maxPersistenceScore: 40,     // Wildfires usually move, so point persistence is lower
        requiresNaturalLand: true    // Must be in natural/forest context
    },
    AGRICULTURE: {
        maxDurationDays: 3,          // Usually short-duration burnings
        requiresFarmland: true       // Must be in agricultural context
    }
};

// ============================================================================
// 8. VALIDATION RULES
// ============================================================================
/**
 * Safely validates the input before attempting classification.
 * @param {Object} hotspot - Processed hotspot feature
 * @returns {boolean} - true if valid enough to process
 */
function isClassifiable(hotspot) {
    if (!hotspot) return false;
    // Must have coordinates
    if (typeof hotspot.latitude !== 'number' || typeof hotspot.longitude !== 'number') return false;
    return true;
}

// ============================================================================
// DAY 4 ROLE 5: INDUSTRIAL CONTEXT SCORING
// ============================================================================

// --------------------------------------------------
// Prototype thresholds used to convert facility
// distance into an industrial-context category.
// These values are decision-support heuristics,
// not scientifically validated attribution rules.
// --------------------------------------------------
const INDUSTRIAL_PROXIMITY_CONFIG = {
    veryCloseKm: 2.0,
    moderateKm: 5.0
};

// --------------------------------------------------
// Normalized score mapping for future Day 6 
// classification weighting engine.
// --------------------------------------------------
const INDUSTRIAL_SCORE_CONFIG = {
    veryCloseScore: 1.0,
    moderateScore: 0.6,
    farScore: 0.2,
    noFacilityScore: 0
};

/**
 * Validates whether a distance value can
 * safely be used in proximity calculations.
 */
function isValidDistance(distanceKm) {
    return (
        distanceKm !== undefined && 
        distanceKm !== null && 
        !isNaN(distanceKm) && 
        distanceKm >= 0 && 
        distanceKm !== Infinity
    );
}

/**
 * Converts facility distance into a prototype proximity category.
 */
function classifyIndustrialProximity(distanceKm) {
    if (distanceKm <= INDUSTRIAL_PROXIMITY_CONFIG.veryCloseKm) {
        return {
            category: "VERY_CLOSE",
            score: INDUSTRIAL_SCORE_CONFIG.veryCloseScore,
            label: "Very Close"
        };
    } else if (distanceKm <= INDUSTRIAL_PROXIMITY_CONFIG.moderateKm) {
        return {
            category: "MODERATE",
            score: INDUSTRIAL_SCORE_CONFIG.moderateScore,
            label: "Moderate"
        };
    } else {
        return {
            category: "FAR",
            score: INDUSTRIAL_SCORE_CONFIG.farScore,
            label: "Far"
        };
    }
}

/**
 * Evaluates industrial context based on processed proximity data from Role 4.
 * 
 * WHAT:
 * Translates the nearest industrial facility distance into a normalized score and explainable evidence.
 * 
 * INPUT:
 * @param {Object} processedContext - The proximity result generated by Role 4.
 * 
 * OUTPUT:
 * Standardized industrial context object for the UI and the Day 6 Classifier.
 */
function evaluateIndustrialContext(processedContext) {
    // 1. Handle No Facility Case
    if (!processedContext || !processedContext.nearestFacility) {
        return {
            category: "NONE",
            label: "No Nearby Facility",
            score: INDUSTRIAL_SCORE_CONFIG.noFacilityScore,
            nearestFacility: null,
            nearbyFacilities: processedContext ? processedContext.facilities : [],
            evidence: [
                {
                    type: "industrial_proximity",
                    description: "No valid nearby industrial facility was provided.",
                    source: "OpenStreetMap"
                }
            ]
        };
    }

    const nearest = processedContext.nearestFacility;
    
    // 2. Handle Missing or Invalid Distance Case
    if (!isValidDistance(nearest.distanceFromHotspot)) {
        return {
            category: "UNKNOWN",
            label: "Distance Unknown",
            score: null, // Do not guess a score
            nearestFacility: nearest,
            nearbyFacilities: processedContext.facilities || [],
            evidence: [
                {
                    type: "industrial_proximity",
                    description: "Industrial facility data is available, but distance could not be determined.",
                    source: "OpenStreetMap"
                }
            ]
        };
    }

    // 3. Classify valid distance
    const dist = nearest.distanceFromHotspot;
    const classification = classifyIndustrialProximity(dist);
    const readableDist = parseFloat(dist.toFixed(2));

    // 4. Build Evidence string responsibly (avoiding causation claims)
    const evidenceDesc = `A nearby ${nearest.type || "industrial facility"} (${nearest.name || "Unknown"}) provides industrial-context evidence within ${readableDist} km (${classification.label}).`;

    return {
        category: classification.category,
        label: classification.label,
        score: classification.score,
        nearestFacility: nearest,
        nearbyFacilities: processedContext.facilities || [],
        evidence: [
            {
                type: "industrial_proximity",
                description: evidenceDesc,
                source: "OpenStreetMap"
            }
        ]
    };
}


// ============================================================================
// 4 & 6. CLASSIFICATION MODULE
// ============================================================================

/**
 * Creates a default UNKNOWN classification result structure.
 * @returns {Object} Standardized Classification Result
 */
function createDefaultResult() {
    return {
        category: CATEGORIES.UNKNOWN,
        confidence: 0,
        scores: {
            industrial: 0,
            wildfire: 0,
            agriculture: 0,
            other: 0
        },
        evidence: [],
        reasons: ["Insufficient data for classification"],
        priority: "Low",
        requiresHumanVerification: true
    };
}

/**
 * Main classification function.
 * Evaluates the available features and returns a standardized explainable result.
 *
 * @param {Object} hotspot - The processed hotspot feature object.
 * @returns {Object} - The classification result.
 */
function classifyHotspot(hotspot) {
    const result = createDefaultResult();

    if (!isClassifiable(hotspot)) {
        result.reasons = ["Invalid or missing coordinate data"];
        return result;
    }

    result.reasons = []; // Clear default reason since we have valid input

    let industrialScore = 0;
    let wildfireScore = 0;
    let agricultureScore = 0;

    // --- PROTOTYPE EVALUATION LOGIC ---

    // 1. Evaluate Industrial Indicators
    if (hotspot.industrialContext && hotspot.industrialContext.distance <= HEURISTICS.INDUSTRIAL.maxFacilityDistance) {
        industrialScore += 50;
        result.evidence.push(`Proximity to facility (${hotspot.industrialContext.distance}km)`);
    }

    // Connect Day 3 Role 5 Persistence Calculation
    if (hotspot.persistence && typeof hotspot.persistence.uniqueDays === 'number') {
        // Use default 7 days analysis period for prototype if not specified
        const analysisDays = hotspot.analysisDays || 7;
        const persistenceResult = calculatePersistence(hotspot, analysisDays);
        
        // Expose persistence data for the UI
        result.persistenceData = persistenceResult;

        if (persistenceResult.persistenceScore >= HEURISTICS.INDUSTRIAL.minPersistenceScore) {
            industrialScore += 40;
            result.evidence.push(`Persistence (${persistenceResult.persistenceCategory}): ${persistenceResult.evidence}`);
        }
    } else if (hotspot.persistence && hotspot.persistence.score >= HEURISTICS.INDUSTRIAL.minPersistenceScore) {
        // Fallback for older mock tests
        industrialScore += 40;
        result.evidence.push(`High persistence score (${hotspot.persistence.score})`);
    }

    // 2. Evaluate Wildfire Indicators
    if (hotspot.landContext && hotspot.landContext.type === "forest") {
        wildfireScore += 60;
        result.evidence.push("Detected in forested/natural land area");
    }
    if (hotspot.cluster && hotspot.cluster.isExpanding) {
        wildfireScore += 30;
        result.evidence.push("Part of an expanding thermal cluster");
    }

    // 3. Evaluate Agricultural Indicators
    if (hotspot.landContext && hotspot.landContext.type === "farmland") {
        agricultureScore += 60;
        result.evidence.push("Detected in agricultural land area");
    }

    // Save internal scores (for explainability)
    result.scores = {
        industrial: industrialScore,
        wildfire: wildfireScore,
        agriculture: agricultureScore,
        other: 0 // Base score for 'Other'
    };

    // --- DECISION LOGIC ---
    
    // Find highest score
    const maxScore = Math.max(industrialScore, wildfireScore, agricultureScore);

    if (maxScore === 0) {
        result.category = CATEGORIES.UNKNOWN;
        result.confidence = 0;
        result.reasons.push("No distinguishing indicators found in available data.");
    } else if (maxScore === industrialScore) {
        result.category = CATEGORIES.INDUSTRIAL;
        result.confidence = industrialScore;
        result.priority = "High";
        result.reasons.push("Data matches industrial stationary source pattern.");
    } else if (maxScore === wildfireScore) {
        result.category = CATEGORIES.WILDFIRE;
        result.confidence = wildfireScore;
        result.priority = "Critical";
        result.reasons.push("Data matches active wildfire progression pattern.");
    } else if (maxScore === agricultureScore) {
        result.category = CATEGORIES.AGRICULTURE;
        result.confidence = agricultureScore;
        result.priority = "Medium";
        result.reasons.push("Data matches temporary agricultural burning pattern.");
    } else {
        result.category = CATEGORIES.OTHER;
        result.confidence = 20;
        result.reasons.push("Hotspot detected but does not match standard patterns.");
    }

    // Cap confidence at 99 (since this is heuristic, not absolute truth)
    result.confidence = Math.min(result.confidence, 99);

    // AI-assisted classifications always require human verification in MVP
    result.requiresHumanVerification = true;

    return result;
}

// ============================================================================
// 7. SMALL TEST / DEMO DATA
// ============================================================================

const TEST_CLASSIFICATION_CASES = {
    // A. Possible industrial hotspot
    industrialCase: {
        latitude: 23.4, longitude: 87.1,
        frp: 45,
        persistence: { score: 85 },
        industrialContext: { distance: 0.5 }
    },
    // B. Possible wildfire
    wildfireCase: {
        latitude: -34.1, longitude: 150.2,
        landContext: { type: "forest" },
        cluster: { isExpanding: true },
        persistence: { score: 20 }
    },
    // C. Possible agricultural burning
    agricultureCase: {
        latitude: 30.5, longitude: 75.8,
        landContext: { type: "farmland" }
    },
    // D. Unknown case (missing info)
    unknownCase: {
        latitude: 10.0, longitude: 20.0
    }
};

// ============================================================================
// EXPOSE API
// ============================================================================


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

window.ThermalXClassification = {
    CATEGORIES,
    PERSISTENCE_THRESHOLDS,
    calculatePersistence,
    evaluateIndustrialContext,
    classifyHotspot,
    isClassifiable,
    createEvidenceObject,
    validateNumericEvidence,
    calculateAverageFRP,
    TEST_CLASSIFICATION_CASES
};

