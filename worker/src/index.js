/**
 * Tiny link store for ganira-games.
 *
 * The app is a static site, so it cannot hold a secret. Everything here is
 * therefore written assuming the endpoint is public: payloads are capped,
 * ids are unguessable, and stored blobs expire. It stores opaque JSON and
 * hands back a short id — it never interprets what the games put in it.
 *
 *   POST /s      { ...anything }  ->  { id }
 *   GET  /s/:id                   ->  the stored JSON
 */

const MAX_BYTES = 16 * 1024;
const TTL_SECONDS = 60 * 60 * 24 * 400; // ~13 months
// Ambiguous glyphs (0/o, 1/l/i) are left out so an id can be read aloud.
const ALPHABET = "23456789abcdefghjkmnpqrstuvwxyz";
const ID_LENGTH = 10;

function newId() {
  const bytes = crypto.getRandomValues(new Uint8Array(ID_LENGTH));
  let out = "";
  for (const b of bytes) out += ALPHABET[b % ALPHABET.length];
  return out;
}

function allowedOrigins(env) {
  return (env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function corsHeaders(request, env) {
  const allowed = allowedOrigins(env);
  const origin = request.headers.get("Origin") || "";
  const headers = {
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
  // With no allowlist configured (local dev) fall back to open CORS.
  if (allowed.length === 0) headers["Access-Control-Allow-Origin"] = "*";
  else if (allowed.includes(origin)) headers["Access-Control-Allow-Origin"] = origin;
  return headers;
}

function json(body, status, headers) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
}

export default {
  async fetch(request, env) {
    const cors = corsHeaders(request, env);
    const url = new URL(request.url);

    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });

    // GET /s/:id
    const match = url.pathname.match(/^\/s\/([a-z0-9]+)$/);
    if (request.method === "GET" && match) {
      const id = match[1];
      if (id.length !== ID_LENGTH) return json({ error: "not found" }, 404, cors);
      const stored = await env.STORE.get(id);
      if (stored === null) return json({ error: "not found" }, 404, cors);
      return new Response(stored, {
        status: 200,
        headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=300", ...cors },
      });
    }

    // POST /s
    if (request.method === "POST" && url.pathname === "/s") {
      // Trust the header only as a fast reject; the real check is the byte length below.
      const declared = Number(request.headers.get("Content-Length") || 0);
      if (declared > MAX_BYTES) return json({ error: "payload too large" }, 413, cors);

      const raw = await request.text();
      if (new TextEncoder().encode(raw).length > MAX_BYTES) {
        return json({ error: "payload too large" }, 413, cors);
      }
      try {
        JSON.parse(raw);
      } catch {
        return json({ error: "body must be JSON" }, 400, cors);
      }

      const id = newId();
      await env.STORE.put(id, raw, { expirationTtl: TTL_SECONDS });
      return json({ id }, 201, cors);
    }

    return json({ error: "not found" }, 404, cors);
  },
};
