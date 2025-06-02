// Elements
const glucoseValueEl = document.getElementById("glucose-value");
const trendArrowEl = document.getElementById("trend-arrow");
const glucoseDeltaEl = document.getElementById("glucose-delta");
const timeAgoEl = document.getElementById("time-ago");
const statusIndicatorEl = document.getElementById("status-indicator");

// Constants
const FIVE_MINUTES = 5 * 60 * 1000;
const TWENTY_MINUTES = 20 * 60 * 1000;
const LOW_THRESHOLD = 80;
const HIGH_THRESHOLD = 180;
const VERY_LOW_THRESHOLD = 70;
const VERY_HIGH_THRESHOLD = 250;

// Convert trend arrow direction to UI display
function getTrendArrow(trend) {
    switch (trend) {
        case "DoubleUp":
            trendArrowEl.textContent = "↑↑";
            trendArrowEl.className = "trend-arrow arrow-up";
            return;
        case "SingleUp":
            trendArrowEl.textContent = "↑";
            trendArrowEl.className = "trend-arrow arrow-up";
            return;
        case "FortyFiveUp":
            trendArrowEl.textContent = "↗";
            trendArrowEl.className = "trend-arrow arrow-up-right";
            return;
        case "Flat":
            trendArrowEl.textContent = "→";
            trendArrowEl.className = "trend-arrow arrow-right";
            return;
        case "FortyFiveDown":
            trendArrowEl.textContent = "↘";
            trendArrowEl.className = "trend-arrow arrow-down-right";
            return;
        case "SingleDown":
            trendArrowEl.textContent = "↓";
            trendArrowEl.className = "trend-arrow arrow-down";
            return;
        case "DoubleDown":
            trendArrowEl.textContent = "↓↓";
            trendArrowEl.className = "trend-arrow arrow-down";
            return;
        default:
            trendArrowEl.textContent = "→";
            trendArrowEl.className = "trend-arrow";
            return;
    }
}

// Format time ago string
function formatTimeAgo(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;

    if (diff < 60000) {
        // Less than a minute
        return "Just now";
    } else if (diff < 3600000) {
        // Less than an hour
        const minutes = Math.floor(diff / 60000);
        return `${minutes} min ago`;
    } else {
        // Hours
        const hours = Math.floor(diff / 3600000);
        return `${hours}h ago`;
    }
}

// Update connection status indicator
function updateConnectionStatus(connected) {
    if (connected) {
        statusIndicatorEl.className = "status-indicator status-connected";
        statusIndicatorEl.innerHTML = '<div class="pulse"></div><span>Connected</span>';
    } else {
        statusIndicatorEl.className = "status-indicator status-disconnected";
        statusIndicatorEl.innerHTML = '<div class="pulse"></div><span>Disconnected</span>';
    }
}

// Update the UI with glucose data
function updateGlucoseDisplay(data) {
    if (!data) {
        glucoseValueEl.textContent = "---";
        glucoseValueEl.className = "glucose-value";
        trendArrowEl.textContent = "→";
        trendArrowEl.className = "trend-arrow";
        glucoseDeltaEl.textContent = "±0";
        timeAgoEl.textContent = "-- min ago";
        return;
    }

    const sgv = data.sgv;
    const trend = data.direction;
    const timestamp = data.date;
    let delta = data.delta || 0;

    // Update glucose value and apply color based on range
    glucoseValueEl.textContent = sgv;

    if (sgv <= VERY_LOW_THRESHOLD) {
        glucoseValueEl.className = "glucose-value very-low";
    } else if (sgv <= LOW_THRESHOLD) {
        glucoseValueEl.className = "glucose-value low";
    } else if (sgv >= VERY_HIGH_THRESHOLD) {
        glucoseValueEl.className = "glucose-value very-high";
    } else if (sgv >= HIGH_THRESHOLD) {
        glucoseValueEl.className = "glucose-value high";
    } else {
        glucoseValueEl.className = "glucose-value in-range";
    }

    // Update trend arrow
    getTrendArrow(trend);

    // Update delta (format to one decimal place)
    delta = Math.round(delta * 10) / 10;
    glucoseDeltaEl.textContent = delta > 0 ? `+${delta}` : delta;

    // Update time ago
    timeAgoEl.textContent = formatTimeAgo(timestamp);

    // Add stale class if reading is old
    const now = Date.now();
    if (now - timestamp > TWENTY_MINUTES) {
        glucoseValueEl.classList.add("stale");
    } else {
        glucoseValueEl.classList.remove("stale");
    }
}

// Initialize and connect to the glucose data stream
async function initializeGlucoseMonitor() {
    try {
        // First, get the current glucose readings
        const response = await fetch(`/nightscout/api/get-glucose`);
        if (response.status === 200) {
            const data = await response.json();
            if (data && data.length > 0) {
                updateGlucoseDisplay(data[0]);
            }
        }

        // Then connect to real-time updates
        const source = new EventSource(`/nightscout/webhook`);

        source.onopen = () => {
            console.log("Connected to Nightscout data stream");
            updateConnectionStatus(true);
        };

        source.onmessage = (e) => {
            try {
                if (e.data && e.data !== "ping") {
                    const data = JSON.parse(e.data);
                    console.log("Received new glucose data:", data);
                    updateGlucoseDisplay(data);
                }
            } catch (error) {
                console.error("Error parsing glucose data:", error);
            }
        };

        source.onerror = (err) => {
            console.error("SSE error:", err);
            updateConnectionStatus(false);

            setTimeout(() => {
                console.log("Attempting to reconnect...");
                initializeGlucoseMonitor();
            }, 5000);
        };

        // Update the time ago display every minute
        setInterval(() => {
            const glucoseValue = glucoseValueEl.textContent;
            if (glucoseValue && glucoseValue !== "---") {
                timeAgoEl.textContent = formatTimeAgo(lastReadingTime);
            }
        }, 60000);
    } catch (error) {
        console.error("Failed to initialize glucose monitor:", error);
        updateConnectionStatus(false);

        setTimeout(() => {
            console.log("Attempting to reconnect...");
            initializeGlucoseMonitor();
        }, 5000);
    }
}

// Start when the page loads
document.addEventListener("DOMContentLoaded", initializeGlucoseMonitor);

// Store the last reading time for updates
let lastReadingTime = Date.now();
