const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const tableHTML = `
            <!-- RECENT HOTSPOTS TABLE (PRIORITY DASHBOARD) -->
            <div class="tx-floating-panel tx-hotspots-table-panel" id="recent-hotspots-panel">
                <div class="panel-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                    <div class="panel-title" style="margin: 0;">Recent Hotspots</div>
                    <a href="#" style="font-size: 12px; font-weight: 600;">View All →</a>
                </div>
                <div style="overflow-x: auto;">
                    <table class="tx-data-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>TIME</th>
                                <th>LOCATION</th>
                                <th>FRP (MW)</th>
                                <th>CONFIDENCE</th>
                                <th>CLASS</th>
                                <th>PERSISTENCE</th>
                                <th>ACTION</th>
                            </tr>
                        </thead>
                        <tbody id="hotspot-table-body">
                            <!-- Populated by JS -->
                            <tr><td colspan="8" style="text-align:center; padding: 20px; color: var(--tx-text-muted);">No hotspots loaded yet.</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
`;

// Insert it right after the Legend/Layers floating panel
html = html.replace('<!-- RIGHT EVENT INSPECTION PANEL -->', tableHTML + '\n            <!-- RIGHT EVENT INSPECTION PANEL -->');

fs.writeFileSync('index.html', html);
console.log("Added table to HTML");
