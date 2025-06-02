let donations = [];
let isConnected = false;

function formatCurrency(amount, currency = "USD") {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currency.toUpperCase(),
    }).format(amount);
}

function formatTime(timestamp) {
    return new Date(timestamp * 1000).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    });
}

function updateStats() {
    const totalAmount = donations.reduce((sum, donation) => sum + donation.amount, 0);
    const donationCount = donations.length;
    const averageAmount = donationCount > 0 ? totalAmount / donationCount : 0;
    const topDonation = donations.length > 0 ? Math.max(...donations.map((d) => d.amount)) : 0;

    document.getElementById("totalAmount").textContent = formatCurrency(totalAmount);
    document.getElementById("donationCount").textContent = donationCount;
    document.getElementById("averageAmount").textContent = formatCurrency(averageAmount);
    document.getElementById("topDonation").textContent = formatCurrency(topDonation);
}

function addDonationToList(donation) {
    const donationsList = document.getElementById("donationsList");

    // Remove empty state if it exists
    const emptyState = donationsList.querySelector(".empty-state");
    if (emptyState) {
        emptyState.remove();
    }

    const donationItem = document.createElement("div");
    donationItem.className = "donation-item";

    const message = donation.message || donation.support_note || "";
    const messageHtml = message ? `<div class="donation-message">"${message}"</div>` : "";

    donationItem.innerHTML = `
                <div class="donation-info">
                    <div class="supporter-name">${donation.supporter_name || "Anonymous"}</div>
                    ${messageHtml}
                    <div class="donation-time">${formatTime(donation.created_at)}</div>
                </div>
                <div class="donation-amount">${formatCurrency(donation.amount, donation.currency)}</div>
            `;

    // Add to the top of the list
    donationsList.insertBefore(donationItem, donationsList.firstChild);

    // Keep only the last 50 donations in the UI
    const items = donationsList.querySelectorAll(".donation-item");
    if (items.length > 50) {
        items[items.length - 1].remove();
    }
}

function updateConnectionStatus(connected) {
    isConnected = connected;
    const statusIndicator = document.getElementById("statusIndicator");

    if (connected) {
        statusIndicator.className = "status-indicator status-connected";
        statusIndicator.innerHTML = '<div class="pulse"></div><span>Connected</span>';
    } else {
        statusIndicator.className = "status-indicator status-disconnected";
        statusIndicator.innerHTML = '<div class="pulse"></div><span>Disconnected</span>';
    }
}

function onDonationReceived(data) {
    console.log("New donation:", data);

    // Add to donations array
    donations.unshift(data);

    // Keep only the last 100 donations in memory
    if (donations.length > 100) {
        donations = donations.slice(0, 100);
    }

    // Update UI
    updateStats();
    addDonationToList(data);
}

async function main() {
    try {
        const oldDataRes = await fetch(`/bmac/donations`);
        if (oldDataRes.ok) {
            const oldData = await oldDataRes.json();
            console.log(oldData);
            for (let i = 0; i < oldData.length; i++) {
                onDonationReceived(oldData[i].data);
            }
        }

        const source = new EventSource(`/bmac/webhook`);

        source.onopen = () => {
            console.log("Connected to donation stream");
            updateConnectionStatus(true);
        };

        source.onmessage = (e) => {
            try {
                const data = JSON.parse(e.data);
                onDonationReceived(data.data);
            } catch (error) {
                console.error("Error parsing donation data:", error);
            }
        };

        source.onerror = (err) => {
            console.error("SSE error:", err);
            updateConnectionStatus(false);

            setTimeout(() => {
                console.log("Attempting to reconnect...");
                main();
            }, 5000);
        };

        console.log("Donation dashboard initialized");
    } catch (error) {
        console.error("Failed to initialize donation dashboard:", error);
        updateConnectionStatus(false);
    }
}

// Initialize when page loads
document.addEventListener("DOMContentLoaded", main);
