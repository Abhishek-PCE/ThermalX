const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8');

const dom = new JSDOM(html, { 
    runScripts: "dangerously",
    resources: "usable" 
});
dom.window.console.log = function() { console.log.apply(console, arguments); };
dom.window.console.error = function() { console.error.apply(console, arguments); };

setTimeout(() => {
    console.log("Testing button click...");
    const btn = dom.window.document.getElementById('btn-test-fetch');
    if (btn) {
        btn.click();
    } else {
        console.error("Button not found!");
    }
}, 2000);

setTimeout(() => {
    console.log("Exiting test.");
    process.exit(0);
}, 5000);
