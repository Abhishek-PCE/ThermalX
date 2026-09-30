const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const badScripts = `    <script src="js/data.js"></script>
    <script src="js/api.js"></script>
    <script src="js/processing.js"></script>
    <script src="js/classification.js"></script>
    <script src="js/map.js"></script>
    <script src="js/app.js"></script>`;

const goodScripts = `    <!-- Load order matters for global scripts -->
    <script src="js/processing.js"></script>
    <script src="js/classification.js"></script>
    <script src="js/map.js"></script>
    <!-- Entry point requires module support for imports -->
    <script type="module" src="js/app.js"></script>`;

if (html.includes(badScripts)) {
    html = html.replace(badScripts, goodScripts);
    fs.writeFileSync('index.html', html);
    console.log("Fixed script imports in index.html");
} else {
    console.log("Could not find the exact script tags to replace.");
}
