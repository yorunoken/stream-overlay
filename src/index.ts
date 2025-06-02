import { serve } from "bun";
import { handleBmacRoutes } from "./routes/bmac";
import { handleSpotifyRoutes } from "./routes/spotify";
import { handleStaticFiles } from "./routes/static";
import { handleCorsPreflight } from "./utils/cors";

const PORT = process.env.PORT || 4000;

// SSE clients storage - shared across modules
export let clients: Array<ReadableStreamDefaultController> = [];

// Main server
serve({
    port: PORT,
    idleTimeout: 40,
    async fetch(request) {
        const { method } = request;

        // Handle CORS preflight requests
        if (method === "OPTIONS") {
            return handleCorsPreflight();
        }

        // Buy Me A Coffee routes
        const bmacResponse = await handleBmacRoutes(request);
        if (bmacResponse) return bmacResponse;

        // Spotify routes
        const spotifyResponse = await handleSpotifyRoutes(request);
        if (spotifyResponse) return spotifyResponse;

        // Static file routes (must be last as it handles more generic routes)
        const staticResponse = await handleStaticFiles(request);
        if (staticResponse) return staticResponse;

        // If no handler matched
        return new Response("Not Found", { status: 404 });
    },
});

console.log(`Server running on http://localhost:${PORT} ...`);
