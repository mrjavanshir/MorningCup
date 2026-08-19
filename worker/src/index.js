/**
 * Tiny link store for ganira-games.
 *
 * The app is a static site, so it cannot hold a secret. Everything here is
 * therefore written assuming the endpoint is public: payloads are capped,
 * ids are unguessable, and stored blobs expire. It stores opaque JSON and
 * hands back a short id — it never interprets what the games put in it.
 *
 *   POST /s      { ...anything }  ->  { id }          write once, read forever
 *   GET  /s/:id                   ->  the stored JSON
 *
 * Collections are the mutable version, for things that get added to over time
 * (the jar's kept verses). Reading needs only the id, but writing needs the
 * key handed out at creation — so a collection can be shared read-only by
 * passing on the id alone.
 *
 *   POST /c      { ...anything }  ->  { id, key }
 *   GET  /c/:id                   ->  the stored JSON
 *   PUT  /c/:id  + X-Write-Key    ->  204, replaces the contents
 */

const MAX_BYTES = 16 * 1024;
const TTL_SECONDS = 60 * 60 * 24 * 400; // ~13 months
// Ambiguous glyphs (0/o, 1/l/i) are left out so an id can be read aloud.
const ALPHABET = "23456789abcdefghjkmnpqrstuvwxyz";
const ID_LENGTH = 10;
const KEY_LENGTH = 24;

function randomString(length) {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  let out = "";
  for (const b of bytes) out += ALPHABET[b % ALPHABET.length];
  return out;
}

const newId = () => randomString(ID_LENGTH);

// Compares in constant time so a wrong key cannot be narrowed down by timing.
function keysMatch(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function allowedOrigins(env) {
  return (env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

// Any localhost port counts as development. Enumerating dev ports meant the
// allowlist silently broke whenever the dev server picked a different one.
const isLocalhost = (origin) => /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);

function corsHeaders(request, env) {
  const allowed = allowedOrigins(env);
  const origin = request.headers.get("Origin") || "";
  const headers = {
    "Access-Control-Allow-Methods": "GET,POST,PUT,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,X-Write-Key",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
  // With no allowlist configured (local dev) fall back to open CORS.
  if (allowed.length === 0) headers["Access-Control-Allow-Origin"] = "*";
  else if (allowed.includes(origin) || isLocalhost(origin)) headers["Access-Control-Allow-Origin"] = origin;
  return headers;
}

function json(body, status, headers) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
}

/** Returns { value } on success, or { error, status } to send straight back. */
async function readJsonBody(request) {
  // Content-Length is only a cheap early reject; the byte length below decides.
  if (Number(request.headers.get("Content-Length") || 0) > MAX_BYTES) {
    return { error: "payload too large", status: 413 };
  }
  const raw = await request.text();
  if (new TextEncoder().encode(raw).length > MAX_BYTES) {
    return { error: "payload too large", status: 413 };
  }
  try {
    return { value: JSON.parse(raw), raw };
  } catch {
    return { error: "body must be JSON", status: 400 };
  }
}

export default {
  async fetch(request, env) {
    const cors = corsHeaders(request, env);
    const url = new URL(request.url);

    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });

    // ---- collections: mutable, and writable only with the key ----
    const collection = url.pathname.match(/^\/c\/([a-z0-9]+)$/);

    if (request.method === "GET" && collection) {
      const stored = await env.STORE.get(`c:${collection[1]}`);
      if (stored === null) return json({ error: "not found" }, 404, cors);
      // The write key lives alongside the data and must never be handed out:
      // sharing a collection means sharing read access only.
      const { data } = JSON.parse(stored);
      return json(data, 200, { "Cache-Control": "no-store", ...cors });
    }

    if (request.method === "PUT" && collection) {
      const stored = await env.STORE.get(`c:${collection[1]}`);
      if (stored === null) return json({ error: "not found" }, 404, cors);
      const existing = JSON.parse(stored);
      if (!keysMatch(request.headers.get("X-Write-Key") || "", existing.key)) {
        return json({ error: "wrong write key" }, 403, cors);
      }
      const body = await readJsonBody(request);
      if (body.error) return json({ error: body.error }, body.status, cors);
      await env.STORE.put(
        `c:${collection[1]}`,
        JSON.stringify({ key: existing.key, data: body.value }),
        { expirationTtl: TTL_SECONDS }
      );
      return new Response(null, { status: 204, headers: cors });
    }

    if (request.method === "POST" && url.pathname === "/c") {
      const body = await readJsonBody(request);
      if (body.error) return json({ error: body.error }, body.status, cors);
      const id = newId();
      const key = randomString(KEY_LENGTH);
      await env.STORE.put(`c:${id}`, JSON.stringify({ key, data: body.value }), {
        expirationTtl: TTL_SECONDS,
      });
      return json({ id, key }, 201, cors);
    }

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
      const body = await readJsonBody(request);
      if (body.error) return json({ error: body.error }, body.status, cors);
      const id = newId();
      await env.STORE.put(id, body.raw, { expirationTtl: TTL_SECONDS });
      return json({ id }, 201, cors);
    }

    return json({ error: "not found" }, 404, cors);
  },
};
