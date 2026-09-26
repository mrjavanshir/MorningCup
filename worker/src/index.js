/**
 * Store and sign-in for ganira-games.
 *
 * Every route except signing in needs a session. The Worker decides who is
 * asking from the session token alone — the app never says "I am j" — and
 * files each person's data under their own key, so one person's device has no
 * way to address, let alone overwrite, the other person's records.
 *
 * There are two accounts and no sign-up. Accounts are written straight into KV
 * by scripts/set-password.mjs, which hashes the password on the machine running
 * it; the plain password never reaches Cloudflare.
 *
 *   POST /auth/login     { username, password }  ->  { token, user }
 *   POST /auth/logout                            ->  204, ends this session
 *   GET  /auth/me                                ->  { user }
 *   POST /auth/password  { current, next }       ->  { token }, ends every other session
 *
 *   GET|PUT /me/doc/:name          your own document
 *   GET     /users/:id/doc/:name   the other person's, read-only
 *
 *   GET  /khatm                    the one document you really share
 *   POST /khatm/toggle { juz }     marks or unmarks it as yours — never theirs
 *   POST /khatm/reset
 *
 *   GET /config, PUT /config (admin)   which games each person's hub lists
 *
 *   POST /s, GET /s/:id                 write-once blobs behind a short id
 *   POST /c, GET /c/:id, PUT /c/:id     mutable collections, written with a key
 */

const MAX_BYTES = 16 * 1024;
// Personal documents hold liked ayahs with their text, so they get more room.
const MAX_DOC_BYTES = 256 * 1024;
const TTL_SECONDS = 60 * 60 * 24 * 400; // ~13 months
const SESSION_TTL = 60 * 60 * 24 * 365;
// Workers caps PBKDF2 at 100k iterations; scripts/set-password.mjs must match.
const PBKDF2_ITERATIONS = 100_000;
const LOGIN_WINDOW = 15 * 60;
// Per address, so a stranger guessing cannot lock the real person out; plus a
// higher cap per account, so spreading guesses over many addresses stays slow.
const LOGIN_MAX_FAILURES = 5;
const LOGIN_MAX_FAILURES_ACCOUNT = 30;
const JUZ_COUNT = 30;
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

const toHex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
const fromHex = (hex) => new Uint8Array(hex.match(/../g).map((h) => parseInt(h, 16)));

// Compares in constant time so a wrong key cannot be narrowed down by timing.
function keysMatch(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function hashPassword(password, saltHex, iterations = PBKDF2_ITERATIONS) {
  const material = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: fromHex(saltHex), iterations },
    material,
    256
  );
  return toHex(bits);
}

// Sessions are stored under a hash of the token, so reading KV does not hand
// out working tokens.
const sessionKey = async (token) => `session:${toHex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token)))}`;

const publicUser = (u) => ({ id: u.id, name: u.name, admin: !!u.admin });

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
    "Access-Control-Allow-Headers": "Content-Type,Authorization,X-Write-Key",
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
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...headers },
  });
}

/** Returns { value, raw } on success, or { error, status } to send straight back. */
async function readJsonBody(request, limit = MAX_BYTES) {
  // Content-Length is only a cheap early reject; the byte length below decides.
  if (Number(request.headers.get("Content-Length") || 0) > limit) {
    return { error: "payload too large", status: 413 };
  }
  const raw = await request.text();
  if (new TextEncoder().encode(raw).length > limit) {
    return { error: "payload too large", status: 413 };
  }
  try {
    return { value: JSON.parse(raw), raw };
  } catch {
    return { error: "body must be JSON", status: 400 };
  }
}

async function readJson(env, key, fallback) {
  const stored = await env.STORE.get(key);
  if (stored === null) return fallback;
  try {
    return JSON.parse(stored);
  } catch {
    return fallback;
  }
}

/** The signed-in user for this request, or null. */
async function authenticate(request, env) {
  const header = request.headers.get("Authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token) return null;
  const session = await readJson(env, await sessionKey(token), null);
  if (!session) return null;
  const user = await readJson(env, `user:${session.username}`, null);
  // A password change bumps `ver`, which retires every session made before it.
  if (!user || user.ver !== session.ver) return null;
  return { ...user, username: session.username, token };
}

async function startSession(env, username, user) {
  const token = randomString(40);
  await env.STORE.put(await sessionKey(token), JSON.stringify({ username, ver: user.ver, at: new Date().toISOString() }), {
    expirationTtl: SESSION_TTL,
  });
  return token;
}

async function login(request, env, cors) {
  const body = await readJsonBody(request);
  if (body.error) return json({ error: body.error }, body.status, cors);
  const username = String(body.value?.username || "").trim().toLowerCase();
  const password = String(body.value?.password || "");
  if (!/^[a-z0-9_-]{1,32}$/.test(username) || !password) return json({ error: "wrong username or password" }, 401, cors);

  // KV is eventually consistent, so these counts are approximate — a handful
  // of extra tries at most, not an open door.
  const ip = request.headers.get("CF-Connecting-IP") || "local";
  const ipKey = `rl:${username}:${ip}`;
  const accountKey = `rl:${username}`;
  const [fromHere, overall] = await Promise.all([readJson(env, ipKey, { n: 0 }), readJson(env, accountKey, { n: 0 })]);
  if (fromHere.n >= LOGIN_MAX_FAILURES || overall.n >= LOGIN_MAX_FAILURES_ACCOUNT) {
    return json({ error: "too many attempts, try again in 15 minutes" }, 429, cors);
  }

  const user = await readJson(env, `user:${username}`, null);
  // Hash even for an unknown name, so the response time does not reveal
  // which usernames exist.
  const hash = await hashPassword(password, user?.salt || "00".repeat(16), user?.iterations || PBKDF2_ITERATIONS);
  if (!user || !keysMatch(hash, user.hash)) {
    await Promise.all([
      env.STORE.put(ipKey, JSON.stringify({ n: fromHere.n + 1 }), { expirationTtl: LOGIN_WINDOW }),
      env.STORE.put(accountKey, JSON.stringify({ n: overall.n + 1 }), { expirationTtl: LOGIN_WINDOW }),
    ]);
    return json({ error: "wrong username or password" }, 401, cors);
  }
  if (fromHere.n > 0) await env.STORE.delete(ipKey);
  const token = await startSession(env, username, user);
  return json({ token, user: publicUser(user) }, 200, cors);
}

async function changePassword(request, env, cors, me) {
  const body = await readJsonBody(request);
  if (body.error) return json({ error: body.error }, body.status, cors);
  const current = String(body.value?.current || "");
  const next = String(body.value?.next || "");
  if (next.length < 8) return json({ error: "the new password needs at least 8 characters" }, 400, cors);
  const hash = await hashPassword(current, me.salt, me.iterations || PBKDF2_ITERATIONS);
  if (!keysMatch(hash, me.hash)) return json({ error: "current password is wrong" }, 403, cors);

  const salt = toHex(crypto.getRandomValues(new Uint8Array(16)));
  const { token: _t, username, ...stored } = me;
  const updated = { ...stored, salt, iterations: PBKDF2_ITERATIONS, hash: await hashPassword(next, salt), ver: (me.ver || 0) + 1 };
  await env.STORE.put(`user:${username}`, JSON.stringify(updated));
  // Every other device is signed out; this one carries on with a fresh token.
  await env.STORE.delete(await sessionKey(me.token));
  return json({ token: await startSession(env, username, updated) }, 200, cors);
}

async function readDocResponse(env, key, cors) {
  const stored = await env.STORE.get(key);
  return new Response(stored === null ? "{}" : stored, {
    status: 200,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...cors },
  });
}

async function khatm(request, env, cors, me, action) {
  const key = "doc:khatm";
  if (request.method === "GET" && !action) return readDocResponse(env, key, cors);
  if (request.method !== "POST") return null;

  if (action === "reset") {
    const fresh = { juz: {}, started: new Date().toISOString() };
    await env.STORE.put(key, JSON.stringify(fresh));
    return json(fresh, 200, cors);
  }

  if (action === "toggle") {
    const body = await readJsonBody(request);
    if (body.error) return json({ error: body.error }, body.status, cors);
    const n = Number(body.value?.juz);
    if (!Number.isInteger(n) || n < 1 || n > JUZ_COUNT) return json({ error: "no such juz" }, 400, cors);
    const doc = await readJson(env, key, {});
    const juz = { ...(doc.juz || {}) };
    const holder = juz[n];
    // The other person's mark is theirs to clear, not yours.
    if (holder && holder !== me.id) return json({ ...doc, conflict: true }, 409, cors);
    if (holder === me.id) delete juz[n];
    else juz[n] = me.id;
    const next = { ...doc, juz, updated: new Date().toISOString() };
    await env.STORE.put(key, JSON.stringify(next));
    return json(next, 200, cors);
  }
  return null;
}

async function route(request, env, cors, url) {
  const { pathname } = url;
  const method = request.method;

  if (pathname === "/auth/login" && method === "POST") return login(request, env, cors);

  // ---- everything below needs a session ----
  const me = await authenticate(request, env);
  if (!me) return json({ error: "sign in first" }, 401, cors);

  if (pathname === "/auth/me" && method === "GET") return json({ user: publicUser(me) }, 200, cors);
  if (pathname === "/auth/logout" && method === "POST") {
    await env.STORE.delete(await sessionKey(me.token));
    return new Response(null, { status: 204, headers: cors });
  }
  if (pathname === "/auth/password" && method === "POST") return changePassword(request, env, cors, me);

  // ---- your own documents ----
  const own = pathname.match(/^\/me\/doc\/([a-z][a-z0-9-]{0,30})$/);
  if (own) {
    const key = `u:${me.id}:${own[1]}`;
    if (method === "GET") return readDocResponse(env, key, cors);
    if (method === "PUT") {
      const body = await readJsonBody(request, MAX_DOC_BYTES);
      if (body.error) return json({ error: body.error }, body.status, cors);
      await env.STORE.put(key, body.raw);
      return new Response(null, { status: 204, headers: cors });
    }
  }

  // ---- the other person's documents: read, never write ----
  const theirs = pathname.match(/^\/users\/([a-z])\/doc\/([a-z][a-z0-9-]{0,30})$/);
  if (theirs && method === "GET") return readDocResponse(env, `u:${theirs[1]}:${theirs[2]}`, cors);

  const k = pathname.match(/^\/khatm(?:\/(toggle|reset))?$/);
  if (k) {
    const res = await khatm(request, env, cors, me, k[1]);
    if (res) return res;
  }

  // ---- which games each hub lists ----
  if (pathname === "/config") {
    if (method === "GET") return readDocResponse(env, "config:shared", cors);
    if (method === "PUT") {
      if (!me.admin) return json({ error: "admin only" }, 403, cors);
      const body = await readJsonBody(request);
      if (body.error) return json({ error: body.error }, body.status, cors);
      await env.STORE.put("config:shared", body.raw);
      return new Response(null, { status: 204, headers: cors });
    }
  }

  // ---- collections: mutable, and writable only with the key ----
  const collection = pathname.match(/^\/c\/([a-z0-9]+)$/);

  if (method === "GET" && collection) {
    const stored = await env.STORE.get(`c:${collection[1]}`);
    if (stored === null) return json({ error: "not found" }, 404, cors);
    // The write key lives alongside the data and must never be handed out:
    // sharing a collection means sharing read access only.
    const { data } = JSON.parse(stored);
    return json(data, 200, cors);
  }

  if (method === "PUT" && collection) {
    const stored = await env.STORE.get(`c:${collection[1]}`);
    if (stored === null) return json({ error: "not found" }, 404, cors);
    const existing = JSON.parse(stored);
    if (!keysMatch(request.headers.get("X-Write-Key") || "", existing.key)) {
      return json({ error: "wrong write key" }, 403, cors);
    }
    const body = await readJsonBody(request);
    if (body.error) return json({ error: body.error }, body.status, cors);
    await env.STORE.put(`c:${collection[1]}`, JSON.stringify({ key: existing.key, data: body.value }), {
      expirationTtl: TTL_SECONDS,
    });
    return new Response(null, { status: 204, headers: cors });
  }

  if (method === "POST" && pathname === "/c") {
    const body = await readJsonBody(request);
    if (body.error) return json({ error: body.error }, body.status, cors);
    const id = newId();
    const key = randomString(KEY_LENGTH);
    await env.STORE.put(`c:${id}`, JSON.stringify({ key, data: body.value }), { expirationTtl: TTL_SECONDS });
    return json({ id, key }, 201, cors);
  }

  // ---- write-once blobs ----
  const blob = pathname.match(/^\/s\/([a-z0-9]+)$/);
  if (method === "GET" && blob) {
    if (blob[1].length !== ID_LENGTH) return json({ error: "not found" }, 404, cors);
    const stored = await env.STORE.get(blob[1]);
    if (stored === null) return json({ error: "not found" }, 404, cors);
    return new Response(stored, {
      status: 200,
      headers: { "Content-Type": "application/json", "Cache-Control": "private, max-age=300", ...cors },
    });
  }

  if (method === "POST" && pathname === "/s") {
    const body = await readJsonBody(request);
    if (body.error) return json({ error: body.error }, body.status, cors);
    const id = newId();
    await env.STORE.put(id, body.raw, { expirationTtl: TTL_SECONDS });
    return json({ id }, 201, cors);
  }

  return json({ error: "not found" }, 404, cors);
}

export default {
  async fetch(request, env) {
    const cors = corsHeaders(request, env);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    return route(request, env, cors, new URL(request.url));
  },
};
