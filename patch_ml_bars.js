const fs = require('fs');

let appJs = fs.readFileSync('js/app.js', 'utf8');

const oldCode = `                            let probsHTML = "";
                            for (const [cls, prob] of Object.entries(mlResult.probabilities)) {
                                probsHTML += \`<div>\${cls}: \${(prob * 100).toFixed(1)}%</div>\`;
                            }`;

const newCode = `                            let probsHTML = "";
                            for (const [cls, prob] of Object.entries(mlResult.probabilities)) {
                                const percent = (prob * 100).toFixed(1);
                                const fillClass = 'fill-' + cls.toLowerCase();
                                probsHTML += \`
                                <div class="tx-prob-row">
                                    <div class="tx-prob-label">\${cls}</div>
                                    <div class="tx-prob-bar-bg">
                                        <div class="tx-prob-bar-fill \${fillClass}" style="width: \${percent}%"></div>
                                    </div>
                                    <div class="tx-prob-val">\${percent}%</div>
                                </div>\`;
                            }`;

if (appJs.includes(oldCode)) {
    appJs = appJs.replace(oldCode, newCode);
    fs.writeFileSync('js/app.js', appJs);
    console.log("Successfully patched ML probability bars.");
} else {
    console.log("Could not find the target code to patch in app.js");
}
