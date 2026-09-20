const fs = require('fs');

let appJs = fs.readFileSync('js/app.js', 'utf8');

const oldCode = `        <div style="font-family: var(--tx-font-primary, sans-serif); min-width: 220px; padding: 4px 2px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; border-bottom: 1px solid #334155; padding-bottom: 6px;">
                <span style="font-weight: 700; color: #f87171; font-size: 0.9rem;">🔥 Thermal Hotspot</span>
                <span style="font-family: monospace; font-size: 0.75rem; color: #94a3b8;">\${id}</span>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; font-size: 0.8rem; margin-bottom: 8px;">
                <div>
                    <span style="color: #94a3b8; font-size: 0.7rem; display: block;">FRP POWER</span>
                    <strong style="color: #fbbf24; font-family: monospace;">\${frp}</strong>
                </div>
                <div>
                    <span style="color: #94a3b8; font-size: 0.7rem; display: block;">BRIGHTNESS</span>
                    <strong style="color: #fbbf24; font-family: monospace;">\${brightness}</strong>
                </div>
                <div>
                    <span style="color: #94a3b8; font-size: 0.7rem; display: block;">CONFIDENCE</span>
                    <span style="color: #e2e8f0;">\${confidence}</span>
                </div>
                <div>
                    <span style="color: #94a3b8; font-size: 0.7rem; display: block;">CLASS</span>
                    <span class="popup-category" style="color: #fbbf24;">\${classification}</span>
                </div>
            </div>
            <div style="font-size: 0.75rem; color: #94a3b8; border-top: 1px solid #334155; padding-top: 6px; display: flex; flex-direction: column; gap: 2px;">
                <div><strong>Location:</strong> <span style="font-family: monospace; color: #e2e8f0;">\${lat}, \${lng}</span></div>
                <div><strong>Detected:</strong> \${date} (\${time})</div>
                <div><strong>Satellite:</strong> \${satellite}</div>
            </div>
            <div style="margin-top: 8px; text-align: center; font-size: 0.7rem; color: #64748b; font-style: italic;">
                Click marker to view complete details in sidebar →
            </div>
        </div>`;

const newCode = `        <div style="font-family: var(--tx-font-primary, sans-serif); min-width: 220px; padding: 4px 2px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; border-bottom: 1px solid #DCE4EF; padding-bottom: 6px;">
                <span style="font-weight: 700; color: var(--tx-critical-red, #E53935); font-size: 0.9rem;">🔥 Thermal Event</span>
                <span style="font-family: monospace; font-size: 0.75rem; color: var(--tx-text-secondary, #52627A);">\${id}</span>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; font-size: 0.8rem; margin-bottom: 8px;">
                <div>
                    <span style="color: var(--tx-text-muted, #7A899E); font-size: 0.7rem; display: block;">FRP POWER</span>
                    <strong style="color: var(--tx-thermal-orange, #FF6B35); font-family: monospace;">\${frp}</strong>
                </div>
                <div>
                    <span style="color: var(--tx-text-muted, #7A899E); font-size: 0.7rem; display: block;">BRIGHTNESS</span>
                    <strong style="color: var(--tx-thermal-orange, #FF6B35); font-family: monospace;">\${brightness}</strong>
                </div>
                <div>
                    <span style="color: var(--tx-text-muted, #7A899E); font-size: 0.7rem; display: block;">CONFIDENCE</span>
                    <span style="color: var(--tx-text-primary, #10213A); font-weight: 600;">\${confidence}</span>
                </div>
                <div>
                    <span style="color: var(--tx-text-muted, #7A899E); font-size: 0.7rem; display: block;">CLASS</span>
                    <span class="popup-category" style="color: var(--tx-brand-blue, #1769E0); font-weight: 600;">\${classification}</span>
                </div>
            </div>
            <div style="font-size: 0.75rem; color: var(--tx-text-secondary, #52627A); border-top: 1px solid #DCE4EF; padding-top: 6px; display: flex; flex-direction: column; gap: 2px;">
                <div><strong>Location:</strong> <span style="font-family: monospace; color: var(--tx-text-primary, #10213A);">\${lat}, \${lng}</span></div>
                <div><strong>Detected:</strong> \${date}</div>
            </div>
        </div>`;

// Note: I also need to make sure the popup-category span exists in the old code to replace, wait, in my original check it was `<span style="color: #fbbf24;">\${classification}</span>`. Ah, let me just use replace with regex.

appJs = appJs.replace(/<div style="font-family: var\(--tx-font-primary.*Click marker to view complete details in sidebar →\n\s*<\/div>\n\s*<\/div>/s, newCode);

fs.writeFileSync('js/app.js', appJs);
console.log("Successfully patched popup HTML to light theme.");
