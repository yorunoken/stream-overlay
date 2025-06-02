document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("server-port").textContent = location.port || "4000";
    document.getElementById("server-url").textContent = location.origin;

    checkSpotifyStatus();
    checkNightscoutStatus();
});

async function checkSpotifyStatus() {
    const statusElement = document.getElementById("spotify-status");

    try {
        const response = await fetch("/spotify/api/currently-playing");

        if (response.status === 200) {
            const data = await response.json();
            statusElement.innerHTML = `
                <span class="status-ready">
                    <i class="fas fa-play-circle"></i> 
                    Currently playing: ${data.item.name} by ${data.item.artists[0].name}
                </span>
            `;
        } else if (response.status === 204) {
            statusElement.innerHTML = `
                <span class="status-ready">
                    <i class="fas fa-check-circle"></i> 
                    Connected, but no track currently playing
                </span>
            `;
        } else if (response.status === 401 || response.status === 403) {
            statusElement.innerHTML = `
                <span class="status-error">
                    <i class="fas fa-exclamation-circle"></i> 
                    Authentication required
                </span>
            `;
        } else {
            throw new Error("Unexpected response");
        }
    } catch (error) {
        statusElement.innerHTML = `
            <span class="status-error">
                <i class="fas fa-exclamation-triangle"></i> 
                Error connecting to Spotify
            </span>
        `;
    }
}

async function checkNightscoutStatus() {
    const statusElement = document.getElementById("nightscout-status");

    try {
        const response = await fetch(`/nightscout/api/get-glucose`);

        if (response.status === 200) {
            const data = await response.json();
            if (data && data.length > 0) {
                const latestReading = data[0];
                const readingTime = new Date(latestReading.date).toLocaleTimeString();

                statusElement.innerHTML = `
                    <span class="status-ready">
                        <i class="fas fa-check-circle"></i> 
                        Connected: ${latestReading.sgv} mg/dL at ${readingTime}
                    </span>
                `;
            } else {
                statusElement.innerHTML = `
                    <span class="status-ready">
                        <i class="fas fa-check-circle"></i> 
                        Connected, but no readings available
                    </span>
                `;
            }
        } else if (response.status === 400) {
            statusElement.innerHTML = `
                <span class="status-error">
                    <i class="fas fa-exclamation-circle"></i> 
                    Nightscout URL not configured
                </span>
            `;
        } else {
            throw new Error("Unexpected response");
        }
    } catch (error) {
        statusElement.innerHTML = `
            <span class="status-error">
                <i class="fas fa-exclamation-triangle"></i> 
                Error connecting to Nightscout
            </span>
        `;
    }
}
