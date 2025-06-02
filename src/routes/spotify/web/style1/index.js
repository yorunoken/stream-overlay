const PORT = 4000;

const title = document.getElementById("title");
const artist = document.getElementById("artist");
const currentDuration = document.getElementById("curr-duration");
const songDuration = document.getElementById("song-duration");
const albumArt = document.getElementById("album-art");
const progressBar = document.getElementById("progress");
const pauseOverlay = document.getElementById("pause-overlay");

const musicDiv = document.getElementById("music-d");
const bgDiv = document.getElementById("bg-color");

function formatTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function progressBarUpdate(currTime, totalTime) {
    const progressPercentage = (currTime / totalTime) * 100;
    progressBar.style.width = `${progressPercentage}%`;
    currentDuration.innerText = formatTime(currTime);
    songDuration.innerText = formatTime(totalTime);
}

function getAverageColor(img) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const width = (canvas.width = img.naturalWidth);
    const height = (canvas.height = img.naturalHeight);

    ctx.drawImage(img, 0, 0);

    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    let r = 0;
    let g = 0;
    let b = 0;

    for (let i = 0, l = data.length; i < l; i += 4) {
        r += data[i];
        g += data[i + 1];
        b += data[i + 2];
    }

    r = Math.floor(r / (data.length / 4));
    g = Math.floor(g / (data.length / 4));
    b = Math.floor(b / (data.length / 4));

    return { r, g, b };
}

function darkenColor({ r, g, b }, factor = 0.7) {
    return {
        r: Math.floor(r * factor),
        g: Math.floor(g * factor),
        b: Math.floor(b * factor),
    };
}

function getAverageColorFromUrl(imageUrl) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.src = imageUrl;

        img.onload = function () {
            const rgb = getAverageColor(img);
            resolve(rgb);
        };

        img.onerror = function () {
            reject(new Error("Failed to load image"));
        };
    });
}

async function refresh() {
    const spotify = await fetch(`http://localhost:${PORT}/spotify/api/currently-playing`, {
        method: "GET",
    }).then((res) => res.json());

    if (spotify.currently_playing_type === "episode") {
        return;
    }

    const { item } = spotify;
    const currentPosition = spotify.progress_ms;
    const totalDuration = item.duration_ms;
    const isPlaying = spotify.is_playing;
    const albumSrc = item.album.images[0].url;

    const albumAverageColor = await getAverageColorFromUrl(albumSrc);
    const albumDarkerColor = darkenColor(albumAverageColor);

    title.innerText = item.name || "-";
    artist.innerText = item.artists[0].name || "-";
    albumArt.src = `http://localhost:${PORT}/spotify/api/album-art?url=${albumSrc}`;
    document.documentElement.style.setProperty("--album-color", `${albumAverageColor.r}, ${albumAverageColor.g}, ${albumAverageColor.b}`);
    document.documentElement.style.setProperty("--album-color-dark", `${albumDarkerColor.r}, ${albumDarkerColor.g}, ${albumDarkerColor.b}`);

    if (isPlaying) {
        pauseOverlay.classList.add("hidden");
    } else {
        pauseOverlay.classList.remove("hidden");
    }

    bgDiv.style.width = `${musicDiv.offsetWidth}px`;
    bgDiv.style.height = `${musicDiv.offsetHeight}px`;

    progressBarUpdate(currentPosition, totalDuration);
}

refresh();
setInterval(refresh, 1000);
