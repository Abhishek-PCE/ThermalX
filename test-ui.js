const fs = require('fs');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

const html = fs.readFileSync('index.html', 'utf8');
const dom = new JSDOM(html);
global.document = dom.window.document;
global.window = dom.window;

try {
    eval(fs.readFileSync('js/app.js', 'utf8').replace(/import.*?['"];?/g, ''));
    
    const facilities = [
        { name: "Super Factory", type: "factory", distanceFromHotspot: 1.254, latitude: 10, longitude: 20 },
        { name: "Power 9000", type: "power plant", distanceFromHotspot: 5.678, latitude: 10.1, longitude: 20.1 }
    ];

    renderIndustrialFacilitiesUI(facilities);

    const container = document.getElementById('industrial-facilities-container');
    console.log("HTML length:", container.innerHTML.length);
    console.log("Includes Super Factory:", container.innerHTML.includes("Super Factory"));
    console.log("Includes 1.25 km:", container.innerHTML.includes("1.25 km"));
    console.log("Includes Power 9000:", container.innerHTML.includes("Power 9000"));
    console.log("Includes 5.68 km:", container.innerHTML.includes("5.68 km")); // .toFixed(2) rounds it

    // Test clear
    clearHotspotDetails();
    console.log("Cleared includes Super Factory:", container.innerHTML.includes("Super Factory"));
    console.log("Cleared includes 'No hotspot selected':", container.innerHTML.includes("No hotspot selected"));

} catch (e) {
    console.error("TEST FAILED:", e);
}
