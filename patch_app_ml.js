const fs = require('fs');

let appJs = fs.readFileSync('js/app.js', 'utf8');

// Replace evaluateIndustrialContext block with ML logic
const oldRole5Block = `                    // ==========================================
                    // DAY 4 ROLE 5: Industrial Context Scoring
                    // ==========================================
                    let finalContextScore = null;
                    if (window.ThermalXClassification && typeof window.ThermalXClassification.evaluateIndustrialContext === 'function') {
                        // Convert proximity into an explainable heuristic score
                        finalContextScore = window.ThermalXClassification.evaluateIndustrialContext(processedContext);
                    }

                    // Update UI with the nearest facility data and Role 5 evidence
                    if (finalContextScore) {
                        if (finalContextScore.nearestFacility) {
                            const nearest = finalContextScore.nearestFacility;
                            setElementText('event-facility', \`\${nearest.name} (\${nearest.type})\`);
                            setElementText('event-distance', \`\${parseFloat(nearest.distanceFromHotspot.toFixed(2))} km\`);
                        } else {
                            setElementText('event-facility', "No nearby industrial facilities.");
                            setElementText('event-distance', "—");
                        }
                        
                        // Append Role 5 evidence to the evidence section
                        const existingEvidence = document.getElementById('event-evidence')?.textContent || "";
                        if (finalContextScore.evidence && finalContextScore.evidence.length > 0) {
                            const newEvidence = finalContextScore.evidence[0].description;
                            if (existingEvidence === "Classification pending Role 5 analysis." || existingEvidence === "—") {
                                setElementText('event-evidence', newEvidence);
                            } else {
                                setElementText('event-evidence', existingEvidence + " | " + newEvidence);
                            }
                        }
                    } else if (processedContext.nearestFacility) {
                        // Fallback UI update if Role 5 is missing
                        const nearest = processedContext.nearestFacility;
                        const distText = nearest.distanceFromHotspot !== undefined 
                            ? \`\${nearest.distanceFromHotspot.toFixed(2)} km\` 
                            : "Distance unknown";
                        
                        setElementText('event-facility', \`\${nearest.name} (\${nearest.type})\`);
                        setElementText('event-distance', distText);
                    } else if (processedContext.facilities && processedContext.facilities.length > 0) {
                        setElementText('event-facility', \`\${processedContext.facilities.length} nearby facilities found.\`);
                        setElementText('event-distance', "Not available");
                    } else {
                        setElementText('event-facility', "No nearby industrial facilities.");
                        setElementText('event-distance', "—");
                    }`;

const newMLBlock = `                    // Update UI with the nearest facility data
                    if (processedContext.nearestFacility) {
                        const nearest = processedContext.nearestFacility;
                        const distText = nearest.distanceFromHotspot !== undefined 
                            ? \`\${nearest.distanceFromHotspot.toFixed(2)} km\` 
                            : "Distance unknown";
                        setElementText('event-facility', \`\${nearest.name} (\${nearest.type})\`);
                        setElementText('event-distance', distText);
                    } else {
                        setElementText('event-facility', "No nearby industrial facilities.");
                        setElementText('event-distance', "—");
                    }

                    // ==========================================
                    // DAY 8: MACHINE LEARNING CLASSIFICATION
                    // ==========================================
                    if (window.ThermalXClassification && typeof window.ThermalXClassification.runMLClassification === 'function') {
                        setElementText('event-classification', 'Loading ML...');
                        document.getElementById('event-classification').className = 'tx-badge tx-badge-pending';
                        
                        // Fetch ML prediction
                        const mlResult = await window.ThermalXClassification.runMLClassification(hotspot, processedContext);
                        
                        if (mlResult) {
                            // Update Classification Badge
                            updateClassification(mlResult.category, mlResult.probability * 100);
                            
                            // Update Probability Texts
                            setElementText('event-probability', \`\${(mlResult.probability * 100).toFixed(1)}%\`);
                            
                            let probsHTML = "";
                            for (const [cls, prob] of Object.entries(mlResult.probabilities)) {
                                probsHTML += \`<div>\${cls}: \${(prob * 100).toFixed(1)}%</div>\`;
                            }
                            const probsList = document.getElementById('event-probabilities-list');
                            if (probsList) probsList.innerHTML = probsHTML;
                            
                            // Update Evidence
                            setElementText('event-evidence', mlResult.evidence);
                            
                            // Attach the mlResult to the hotspot object so the map can use it
                            hotspot.classification = mlResult;
                            
                            // Re-render the map popup with the ML classification if the map module supports it
                            if (window.MapModule && typeof window.MapModule.renderHotspots === 'function') {
                                // Just visual update of the popup if it's currently open
                                const popup = document.querySelector('.leaflet-popup-content');
                                if (popup) {
                                    const titleEl = popup.querySelector('h4');
                                    if (titleEl && titleEl.textContent.includes(hotspot.eventId || hotspot.id)) {
                                       const catEl = popup.querySelector('.popup-category');
                                       if(catEl) catEl.textContent = mlResult.category;
                                    }
                                }
                            }
                        }
                    }`;

if (appJs.includes('if (window.ThermalXClassification && typeof window.ThermalXClassification.evaluateIndustrialContext')) {
    appJs = appJs.replace(oldRole5Block, newMLBlock);
    fs.writeFileSync('js/app.js', appJs);
    console.log("Successfully patched app.js to use runMLClassification");
} else {
    console.log("Could not find the target block in app.js");
}
