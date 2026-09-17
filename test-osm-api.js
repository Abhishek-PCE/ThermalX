// We will load the module dynamically, but since it uses export we can just use dynamic import.
(async () => {
    try {
        const module = await import('./js/api.js');
        console.log("Testing fetchNearbyIndustrialFacilities...");
        // Test 1: valid coordinates (e.g., somewhere with industrial facilities like a major city)
        const facilities = await module.fetchNearbyIndustrialFacilities(40.7128, -74.0060, 5000); // NY
        console.log(`Test 1 valid coordinates returned ${facilities.length} facilities.`);
        if (facilities.length > 0) {
            console.log("Sample facility:", facilities[0]);
        }

        // Test 2: invalid coordinates
        const invalid = await module.fetchNearbyIndustrialFacilities(900, -200, 5000);
        console.log(`Test 2 invalid coordinates returned ${invalid.length} facilities. (Expected 0)`);
        
        // Test 3: empty result (middle of the ocean)
        const empty = await module.fetchNearbyIndustrialFacilities(0, 0, 5000);
        console.log(`Test 3 ocean coordinates returned ${empty.length} facilities. (Expected 0)`);
        
        // Test 4: cache hit
        console.log("Fetching NY again to test cache...");
        const cached = await module.fetchNearbyIndustrialFacilities(40.7128, -74.0060, 5000);
        console.log(`Test 4 cached returned ${cached.length} facilities.`);
        
    } catch (e) {
        console.error("Test failed:", e);
    }
})();
