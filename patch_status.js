const fs = require('fs');
let appJs = fs.readFileSync('js/app.js', 'utf8');

// Replace the hidden state logic
appJs = appJs.replace(
    'testStatusMessage.textContent = "Loading NASA FIRMS data...";',
    'testStatusMessage.style.display = "block";\n        testStatusMessage.textContent = "Loading NASA FIRMS data...";'
);

fs.writeFileSync('js/app.js', appJs);
console.log("Patched status message display");
