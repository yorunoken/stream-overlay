document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("server-port").textContent = location.port || "4000";
    document.getElementById("server-url").textContent = location.origin;

    checkSpotifyStatus();
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
