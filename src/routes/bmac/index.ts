import type { DonationCreatedEvent } from "./types";
import { CORS_HEADERS } from "../../utils/cors";
import { clients } from "../..";

export async function handleBmacRoutes(request: Request): Promise<Response | null> {
    const { method } = request;
    const { pathname } = new URL(request.url);

    // SSE webhook endpoint
    if (method === "GET" && pathname === "/bmac/webhook") {
        const stream = new ReadableStream({
            start(controller) {
                clients.push(controller);

                controller.enqueue(new TextEncoder().encode(": connected\n\n"));

                const heartbeat = setInterval(() => {
                    controller.enqueue(new TextEncoder().encode(": ping\n\n"));
                }, 10000);

                const close = () => {
                    clearInterval(heartbeat);
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

    // BMAC webhook receiver
    if (method === "POST" && pathname === "/bmac") {
        try {
            const data = (await request.json()) as DonationCreatedEvent;

            const filePath = "donations.json";
            const file = Bun.file(filePath);
            let jData: Array<DonationCreatedEvent> = [];

            if (await file.exists()) {
                jData = await file.json();
            }

            jData.push(data);
            await Bun.write(filePath, JSON.stringify(jData, null, 2));

            const msg = `data: ${JSON.stringify(data)}\n\n`;
            const encoded = new TextEncoder().encode(msg);

            clients.forEach((controller) => {
                try {
                    controller.enqueue(encoded);
                } catch {
                    // Client disconnected, will be filtered out on next heartbeat
                }
            });

            return new Response("OK", { status: 200, headers: CORS_HEADERS });
        } catch (err) {
            console.error("Webhook error:", err);
            return new Response("Invalid JSON", { status: 400, headers: CORS_HEADERS });
        }
    }

    // Donations history endpoint
    if (method === "GET" && pathname === "/bmac/donations") {
        const file = Bun.file("donations.json");

        if (await file.exists()) {
            const data: Array<DonationCreatedEvent> = await file.json();
            return new Response(JSON.stringify(data), {
                status: 200,
                headers: {
                    "Content-Type": "application/json",
                    ...CORS_HEADERS,
                },
            });
        }

        return new Response(JSON.stringify({ msg: "The file doesn't exist" }), {
            status: 404,
            headers: {
                "Content-Type": "application/json",
                ...CORS_HEADERS,
            },
        });
    }

    // If this handler doesn't apply, return null so the next one can try
    return null;
}
