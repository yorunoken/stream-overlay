import { clients } from "../..";
import { CORS_HEADERS } from "../../utils/cors";
import type { CGMReading } from "./types";

export async function handleNightscoutRoutes(request: Request): Promise<Response | null> {
    const { method } = request;
    let { pathname } = new URL(request.url);

    if (pathname !== "/" && pathname.endsWith("/")) {
        pathname = pathname.slice(0, -1);
    }

    if (method === "GET" && pathname === "/nightscout/api/get-glucose") {
        const nightscoutUrl = process.env.NIGHTSCOUT_URL;

        if (!nightscoutUrl) {
            return new Response(JSON.stringify({ error: "Nightscout URL not configured" }), {
                status: 400,
                headers: { "Content-Type": "application/json", ...CORS_HEADERS },
            });
        }

        try {
            // Fetch the latest entries from Nightscout
            const response = await fetch(`${nightscoutUrl}/api/v1/entries.json?count=10`);
            const data = (await response.json()) as Array<CGMReading>;

            if (data.length >= 2) {
                const previousReading = data[1]!;
                data[0]!.delta = data[0]!.sgv - previousReading.sgv;
            } else {
                data[0]!.delta = 0;
            }

            return new Response(JSON.stringify(data), {
                status: 200,
                headers: { "Content-Type": "application/json", ...CORS_HEADERS },
            });
        } catch (error) {
            console.error("Error fetching Nightscout data:", error);
            return new Response(JSON.stringify({ error: "Failed to fetch Nightscout data" }), {
                status: 500,
                headers: { "Content-Type": "application/json", ...CORS_HEADERS },
            });
        }
    }

    if (method === "GET" && pathname === "/nightscout/webhook") {
        const stream = new ReadableStream({
            start(controller) {
                clients.push(controller);

                controller.enqueue(new TextEncoder().encode(": connected\n\n"));

                const heartbeat = setInterval(() => {
                    controller.enqueue(new TextEncoder().encode(": ping\n\n"));
                }, 10000);

                // Poll Nightscout for updates
                let lastData: CGMReading | null = null;
                const pollInterval = setInterval(async () => {
                    try {
                        const nightscoutUrl = process.env.NIGHTSCOUT_URL;
                        if (!nightscoutUrl) return;

                        const response = await fetch(`${nightscoutUrl}/api/v1/entries.json?count=1`);
                        const data = (await response.json()) as Array<CGMReading>;

                        if (data && data.length > 0) {
                            const latestEntry = data[0]!;

                            // Only send if data has changed
                            if (!lastData || lastData.sgv !== latestEntry.sgv || lastData.date !== latestEntry.date) {
                                lastData = latestEntry;
                                const msg = `data: ${JSON.stringify(latestEntry)}\n\n`;
                                controller.enqueue(new TextEncoder().encode(msg));
                            }
                        }
                    } catch (error) {
                        console.error("Error polling Nightscout:", error);
                    }
                }, 30000); // Poll every 30 seconds

                const close = () => {
                    clearInterval(heartbeat);
                    clearInterval(pollInterval);
                    clients.splice(0, clients.length, ...clients.filter((c) => c !== controller));
                    controller.close();
                };

                request.signal.addEventListener("abort", close);
            },
        });

        return new Response(stream, {
            headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                Connection: "keep-alive",
                "Access-Control-Allow-Origin": "*",
            },
        });
    }

    // If this handler doesn't apply, return null so the next one can try
    return null;
}
