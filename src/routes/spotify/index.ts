import { Spotify } from "./spotify";
import { CORS_HEADERS } from "../../utils/cors";

// Initialize Spotify authentication
Spotify.initialize();

export async function handleSpotifyRoutes(request: Request): Promise<Response | null> {
    const { method } = request;
    const { pathname, searchParams } = new URL(request.url);

    // Spotify authentication
    if (method === "GET" && pathname === "/spotify/login") {
        const authUrl = Spotify.getAuthUrl();
        return Response.redirect(authUrl);
    }

    if (method === "GET" && pathname === "/spotify/callback") {
        const code = searchParams.get("code");
        if (!code) {
            return new Response("Missing code parameter", { status: 400 });
        }

        try {
            await Spotify.getToken(code);
            return Response.redirect("/");
        } catch (error) {
            console.error("Authentication failed:", error);
            return new Response("Authentication failed", { status: 500 });
        }
    }

    // Spotify currently playing track
    if (method === "GET" && pathname === "/spotify/api/currently-playing") {
        try {
            const data = await Spotify.getMePlaying();
            if (!data) {
                return new Response(JSON.stringify({ error: "No track playing" }), {
                    status: 204,
                    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
                });
            }

            return new Response(JSON.stringify(data), {
                status: 200,
                headers: { "Content-Type": "application/json", ...CORS_HEADERS },
            });
        } catch (error: any) {
            console.error("Error fetching currently playing track:", error);
            if (error.message?.includes("User needs to authenticate")) {
                return Response.redirect("/login");
            }

            return new Response(JSON.stringify({ error: "Failed to fetch current track" }), {
                status: 500,
                headers: { "Content-Type": "application/json", ...CORS_HEADERS },
            });
        }
    }

    // Fetch album art from Spotify
    if (method === "GET" && pathname === "/spotify/api/album-art") {
        const imageUrl = searchParams.get("url");
        if (!imageUrl) {
            return new Response("Missing url parameter", { status: 400 });
        }

        try {
            const imageResponse = await fetch(imageUrl);

            return new Response(imageResponse.body, {
                status: 200,
                headers: {
                    "Content-Type": imageResponse.headers.get("Content-Type") || "image/jpeg",
                    ...CORS_HEADERS,
                },
            });
        } catch (error) {
            console.error("Error fetching album art:", error);
            return new Response("Failed to fetch album art", { status: 500 });
        }
    }

    // If this handler doesn't apply, return null so the next one can try
    return null;
}
