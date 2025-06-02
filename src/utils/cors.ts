export const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
};

export function handleCorsPreflight(): Response {
    return new Response(null, { headers: CORS_HEADERS });
}
