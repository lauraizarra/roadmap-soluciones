const MAX_STATE_BYTES = 16 * 1024;

function jsonResponse(body, status, headers) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { ...Object.fromEntries(headers), "Content-Type": "application/json" }
    });
}

function corsHeaders(origin, allowedOrigin) {
    const headers = new Headers({
        "Access-Control-Allow-Methods": "GET, PUT, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Max-Age": "86400",
        "Cache-Control": "no-store",
        "Vary": "Origin"
    });
    if (origin === allowedOrigin) headers.set("Access-Control-Allow-Origin", allowedOrigin);
    return headers;
}

export default {
    async fetch(request, env) {
        const origin = request.headers.get("Origin");
        const headers = corsHeaders(origin, env.ALLOWED_ORIGIN);
        if (!env.ALLOWED_ORIGIN || origin !== env.ALLOWED_ORIGIN) {
            return jsonResponse({ error: "Origin not allowed" }, 403, headers);
        }

        const url = new URL(request.url);
        if (request.method === "OPTIONS") {
            return new Response(null, { status: 204, headers });
        }
        if (!env.DB) {
            return jsonResponse({ error: "D1 database binding is not configured" }, 500, headers);
        }
        if (request.method !== "GET" && request.method !== "PUT") {
            return jsonResponse({ error: "Method not allowed" }, 405, headers);
        }
        if ((request.method === "GET" && url.pathname !== "/latest") ||
            (request.method === "PUT" && url.pathname !== "/")) {
            return jsonResponse({ error: "Not found" }, 404, headers);
        }

        try {
            if (request.method === "GET") {
                const result = await env.DB
                    .prepare("SELECT state FROM roadmap_state WHERE id = 1")
                    .first();
                return jsonResponse({ record: result ? JSON.parse(result.state) : {} }, 200, headers);
            }

            const body = await request.text();
            if (new TextEncoder().encode(body).byteLength > MAX_STATE_BYTES) {
                return jsonResponse({ error: "State is too large" }, 413, headers);
            }
            let state;
            try {
                state = JSON.parse(body);
            } catch {
                return jsonResponse({ error: "Invalid JSON" }, 400, headers);
            }
            if (!state || typeof state !== "object" || Array.isArray(state) ||
                Object.values(state).some((value) => typeof value !== "boolean")) {
                return jsonResponse({ error: "State must be an object containing boolean values" }, 400, headers);
            }

            await env.DB
                .prepare("INSERT INTO roadmap_state (id, state) VALUES (1, ?) ON CONFLICT(id) DO UPDATE SET state = excluded.state")
                .bind(JSON.stringify(state))
                .run();
            return jsonResponse({ success: true }, 200, headers);
        } catch {
            return jsonResponse({ error: "Database operation failed" }, 500, headers);
        }
    }
};
