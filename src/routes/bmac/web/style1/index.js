let alertTimeout;

function formatCurrency(amount, currency = "USD") {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currency.toUpperCase(),
    }).format(amount);
}

function createHeart() {
    const heart = document.createElement("div");
    heart.className = "heart";
    heart.innerHTML = "❤️";

    const container = document.getElementById("hearts");
    const containerRect = container.getBoundingClientRect();

    // Random position inside container
    const offsetX = Math.random() * containerRect.width;
    const offsetY = Math.random() * containerRect.height;

    heart.style.left = `${offsetX}px`;
    heart.style.top = `${offsetY}px`;

    heart.style.setProperty("--anim-duration", 2.5 + Math.random() * 1.5 + "s");

    heart.style.setProperty("--anim-delay", Math.random() * 0.6 + "s");

    const rotationDeg = (Math.random() < 0.5 ? -1 : 1) * (200 + Math.random() * 200);
    heart.style.setProperty("--rotation", `${rotationDeg}deg`);

    // Random scale between 0.8 and 1.2
    heart.style.setProperty("--scale", 0.8 + Math.random() * 0.4);

    container.appendChild(heart);

    setTimeout(() => {
        while (heart.style.opacity > 0) {
            heart.style.opacity -= 1;
        }
        heart.remove();
    }, 4000);
}

function getThankYouMessage(amount) {
    if (amount >= 50) {
        return "Wow! You're amazing! 🌟";
    } else if (amount >= 20) {
        return "You're so generous! 🙌";
    } else if (amount >= 10) {
        return "Thank you so much! 💖";
    } else {
        return "Thank you for your support! 💜";
    }
}

function showDonationAlert(/** @type {import("../jsdoc").DonationData} */ data) {
    const alertContainer = document.getElementById("alertContainer");
    const supporterName = document.getElementById("supporterName");
    const donationAmount = document.getElementById("donationAmount");
    const thankYouText = document.getElementById("thankYouText");
    const donationMessage = document.getElementById("donationMessage");
    const messageText = document.getElementById("messageText");

    // Clear any existing timeout
    if (alertTimeout) {
        clearTimeout(alertTimeout);
    }

    // Update content
    supporterName.textContent = data.supporter_name || "Anonymous";
    donationAmount.textContent = formatCurrency(data.amount, data.currency);
    thankYouText.textContent = getThankYouMessage(data.amount);

    // Show message if it exists
    console.log(data.support_note);
    if (data.support_note && data.support_note.trim()) {
        messageText.textContent = data.support_note;
        donationMessage.style.display = "block";
    } else {
        donationMessage.style.display = "none";
    }

    // Show alert
    alertContainer.classList.add("show");

    // Create floating hearts (more hearts for bigger donations)
    const heartCount = Math.min(Math.floor(data.amount / 5) + 3, 10);
    for (let i = 0; i < heartCount; i++) {
        setTimeout(() => createHeart(), i * 200);
    }

    // Hide alert after 5 seconds
    alertTimeout = setTimeout(() => {
        alertContainer.classList.remove("show");
    }, 5000);
}

function onDonationSent(data) {
    console.log("Donation received:", data);
    showDonationAlert(data);
}

async function main() {
    try {
        const source = new EventSource(`/bmac/webhook`);

        source.onmessage = (e) => {
            try {
                const data = JSON.parse(e.data);
                onDonationSent(data.data);
            } catch (error) {
                console.error("Error parsing donation data:", error);
            }
        };

        source.onerror = (err) => {
            console.error("SSE error:", err);

            setTimeout(() => {
                console.log("Attempting to reconnect...");
                main();
            }, 5000);
        };

        console.log("Donation alert system initialized");
    } catch (error) {
        console.error("Failed to initialize donation alerts:", error);
    }
}

// Initialize when page loads
document.addEventListener("DOMContentLoaded", main);
