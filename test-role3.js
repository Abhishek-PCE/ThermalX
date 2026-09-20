// Test Role 3 integration
const fs = require('fs');

global.localStorage = {
    _data: {},
    getItem(key) { return this._data[key] || null; },
    setItem(key, value) { this._data[key] = String(value); }
};

global.fetch = async (url) => {
    return {
        ok: true,
        text: async () => {
            if (url.includes('historical')) {
                return fs.readFileSync('data/demo-historical-firms.json', 'utf8');
            } else {
                return fs.readFileSync('data/demo-firms.json', 'utf8');
            }
        }
    };
};

let apiCode = fs.readFileSync('js/api.js', 'utf8');
apiCode = apiCode.replace(/export /g, '');

try {
    eval(apiCode);
    
    // Clear cache initially
    global.clusteringDataCache = null;
    
    getHotspotsForClustering(true).then(data => {
        console.log("Test 1 - Initial Fetch:", data.length, "records");
        
        // Reset cache to test local storage
        global.clusteringDataCache = null;
        getHotspotsForClustering(true).then(data2 => {
            console.log("Test 2 - Local Storage Load:", data2.length, "records");
        });
        
    }).catch(console.error);
    
} catch(e) {
    console.error("Eval error:", e);
}
