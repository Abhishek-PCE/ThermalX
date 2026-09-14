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
        minPersistenceScore: 70,     // High persistence indicates static flare/factory
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
    if (hotspot.persistence && hotspot.persistence.score >= HEURISTICS.INDUSTRIAL.minPersistenceScore) {
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
window.ThermalXClassification = {
    CATEGORIES,
    classifyHotspot,
    isClassifiable,
    TEST_CLASSIFICATION_CASES
};

