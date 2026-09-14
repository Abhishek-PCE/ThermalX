# ThermalX
SIH26162 — ThermalX: Satellite-based thermal hotspot detection, analysis and source classification system.

## Day 1 - Role 3: Data Integration Developer

### Role 3 Responsibility
The Data Integration Developer is responsible for fetching, parsing, and standardizing data from external sources, primarily the NASA FIRMS API. On Day 1, the focus is on building the foundational JavaScript architecture for data retrieval using native modern browser APIs.

Day 1 uses demo data for testing. Real NASA FIRMS integration is planned for Day 2.

### Core Technologies Used
* **`fetch()`**: A modern, native JavaScript API used to make network requests to retrieve resources (like JSON data) across the network.
* **`async`/`await`**: Syntactic sugar in JavaScript that makes asynchronous code look and behave more like synchronous code, making it easier to read and maintain when waiting for network responses.
* **`try`/`catch`**: A robust error-handling mechanism that allows the code to "try" executing a block and "catch" any errors that occur without breaking the entire application.
* **JSON**: JavaScript Object Notation. A lightweight data-interchange format that is easy for humans to read and write and easy for machines to parse.

### NASA FIRMS & Demo JSON
NASA FIRMS provides near real-time thermal anomaly detections from satellites (like Aqua and Terra). For Day 1, we simulate this data using a fictional `demo-firms.json` file to test the data pipeline without hitting rate limits or needing API keys immediately.

### Data Standardization
Raw data fetched from the API (or demo file) is passed through a standardization function. This ensures that regardless of how the source data is formatted, our application only deals with a predictable, uniform object structure (containing properties like `id`, `latitude`, `longitude`, `brightness`, `frp`, `confidence`, `date`, and `satellite`).

### How to Run the Day 1 Test
1. Start a local development server in the `ThermalX` folder (e.g., using VS Code Live Server, Python's `http.server`, or Node's `http-server`). Since ES Modules (`type="module"`) are used, you **must** serve the files over HTTP/HTTPS, not directly from the file system (`file://`).
2. Open `index.html` in your web browser.
3. Open the Browser Developer Tools Console (usually F12).
4. Click the **"Load Demo FIRMS Data"** button located at the top of the dashboard.
5. Verify that the UI displays a success message, and check the browser console to see the fetched and standardized JSON data.

### What will be implemented on Day 2
On Day 2, we will replace the demo data source with a live connection to the actual NASA FIRMS API endpoint, manage API keys, handle real-time data pagination, and begin integrating the standardized data directly into the map (Role 2) and UI layers (Role 1).
