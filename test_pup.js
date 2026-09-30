const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
    try {
        const browser = await puppeteer.launch({headless: "new"});
        const page = await browser.newPage();
        
        page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
        page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));

        const filePath = 'file://' + path.resolve('index.html');
        console.log("Loading", filePath);
        
        await page.goto(filePath, {waitUntil: 'networkidle0'});
        
        console.log("Clicking button...");
        await page.click('#btn-test-fetch');
        
        // Wait a bit
        await new Promise(r => setTimeout(r, 2000));
        
        await browser.close();
    } catch (e) {
        console.error("PUPPETEER ERROR:", e);
    }
})();
