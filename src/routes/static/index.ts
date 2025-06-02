import { CORS_HEADERS } from "../../utils/cors";
import path from "path";

const PROJECT_ROOT = path.join(import.meta.dir, "../..");

export async function serveStaticFile(filePath: string): Promise<Response> {
    try {
        console.log(`Attempting to serve file: ${filePath}`);
        const file = Bun.file(filePath);
        if (await file.exists()) {
            const contentType = filePath.endsWith(".css")
                ? "text/css"
                : filePath.endsWith(".js")
                ? "application/javascript"
                : filePath.endsWith(".html")
                ? "text/html"
                : filePath.endsWith(".png")
                ? "image/png"
                : filePath.endsWith(".jpg") || filePath.endsWith(".jpeg")
                ? "image/jpeg"
                : filePath.endsWith(".svg")
                ? "image/svg+xml"
                : filePath.endsWith(".json")
                ? "application/json"
                : undefined;

            if (!contentType) {
                return new Response("File Type Not Found", { status: 404 });
            }

            console.log(`Successfully serving: ${filePath} as ${contentType}`);
            return new Response(file, {
                headers: {
                    "Content-Type": contentType,
                    ...CORS_HEADERS,
                },
            });
        } else {
            console.log(`File not found: ${filePath}`);
        }
    } catch (error) {
        console.error("Error serving static file:", error);
    }
    return new Response("Not Found", { status: 404 });
}

export async function handleStaticFiles(request: Request): Promise<Response | null> {
    let { pathname } = new URL(request.url);

    if (pathname !== "/" && pathname.endsWith("/")) {
        pathname = pathname.slice(0, -1);
    }

    console.log(`Handling static file request: ${pathname}`);

    // Root path handler
    if (pathname === "/") {
        return serveStaticFile(path.join(PROJECT_ROOT, "routes/main/web/index.html"));
    }

    // Handle HTML pages for bmac and spotify modules
    if (pathname === "/bmac/panel") {
        return serveStaticFile(path.join(PROJECT_ROOT, "routes/bmac/web/panel/index.html"));
    }

    if (pathname === "/bmac/style1") {
        return serveStaticFile(path.join(PROJECT_ROOT, "routes/bmac/web/style1/index.html"));
    }

    if (pathname === "/spotify/style1") {
        return serveStaticFile(path.join(PROJECT_ROOT, "routes/spotify/web/style1/index.html"));
    }

    // Handle asset requests for the bmac and spotify module pages
    // This pattern handles paths like:
    // - /bmac/style1/index.css
    // - /bmac/style1/index.js
    // - /spotify/style1/index.css
    // - /bmac/panel/index.js, etc.
    const moduleStyleAssetMatch = pathname.match(/^\/(bmac|spotify)\/(style\d+|panel)\/(.+\.(css|js|png|jpg|jpeg|svg))$/);
    if (moduleStyleAssetMatch) {
        const [, module, styleDir, filename] = moduleStyleAssetMatch;
        const filePath = path.join(PROJECT_ROOT, "routes", module!, "web", styleDir!, filename!);
        console.log(`Serving module asset: ${filePath}`);
        return serveStaticFile(filePath);
    }

    // Direct file access for assets within the web directory structure
    if (pathname.startsWith("/spotify/web") || pathname.startsWith("/bmac/web") || pathname.startsWith("/main/web")) {
        const filePath = path.join(PROJECT_ROOT, "routes", pathname);
        console.log(`Serving web directory asset: ${filePath}`);
        return serveStaticFile(filePath);
    }

    console.log(`No static file handler matched for: ${pathname}`);
    // If no static file matches, return null
    return null;
}
