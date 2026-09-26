/**
 * Each person's own documents, plus read-only access to the other person's.
 *
 * The server files a write under whoever the session belongs to, so there is
 * no way to address someone else's document from here — a bug in an app can
 * at worst lose your own data, never theirs.
 *
 * Writes still go through read-merge-write rather than a blind overwrite: the
 * same person on a phone and a laptop around the same time would otherwise
 * clobber each other.
 */

import { authFetch, readSession, storeConfigured } from "./auth.js";

export const docsAvailable = storeConfigured;

// Keyed by user as well as name, so switching accounts on a device can never
// show one person the other's cached copy.
const cacheKey = (who, name) => `doc-cache-${who}-${name}`;
const myId = () => readSession()?.user.id || "none";

function readCache(who, name) {
  try {
    const raw = localStorage.getItem(cacheKey(who, name));
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function cache(who, name, value) {
  try {
    localStorage.setItem(cacheKey(who, name), JSON.stringify(value));
  } catch {
    /* private mode */
  }
}

async function getJson(path) {
  try {
    const res = await authFetch(path);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/** Your own copy as this device last saw it, for a first paint without waiting. */
export const cachedDoc = (name) => readCache(myId(), name);

/** The other person's copy as this device last saw it. */
export const cachedUserDoc = (who, name) => readCache(who, name);

export async function readDoc(name) {
  if (!storeConfigured()) return null;
  const data = await getJson(`/me/doc/${name}`);
  if (data) cache(myId(), name, data);
  return data;
}

/** Read-only: someone else's document, e.g. their progress to show beside yours. */
export async function readUserDoc(who, name) {
  if (!storeConfigured()) return null;
  const data = await getJson(`/users/${who}/doc/${name}`);
  if (data) cache(who, name, data);
  return data;
}

// `keepalive` lets a caller fire this from a pagehide/visibilitychange
// handler and have a real chance of it landing after the tab is gone —
// without it, the browser can and does abort the request mid-flight.
export async function writeDoc(name, value, { keepalive = false } = {}) {
  if (!storeConfigured()) return false;
  try {
    const res = await authFetch(`/me/doc/${name}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(value),
      keepalive,
    });
    if (res.ok) cache(myId(), name, value);
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Applies `change` to the newest copy of the document rather than to whatever
 * this device last saw, so a change made on your other device survives.
 * Returns the document actually written, or null if it could not be saved.
 */
export async function updateDoc(name, change) {
  if (!storeConfigured()) return null;
  const latest = await getJson(`/me/doc/${name}`);
  if (!latest) return null; // unreachable — do not overwrite with a guess
  const next = change(latest);
  const ok = await writeDoc(name, next);
  return ok ? next : null;
}

// ---- the khatm: the one document both people write ----
// The server stamps the mark with whoever is signed in and refuses to clear
// the other person's, so nothing here says whose mark it is.

export const cachedKhatm = () => readCache("shared", "khatm");

async function khatmCall(path, init) {
  try {
    const res = await authFetch(path, init);
    if (!res.ok && res.status !== 409) return null;
    const data = await res.json();
    cache("shared", "khatm", data);
    return data;
  } catch {
    return null;
  }
}

export const readKhatm = () => (storeConfigured() ? khatmCall("/khatm") : Promise.resolve(null));

export const toggleJuz = (n) =>
  khatmCall("/khatm/toggle", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ juz: n }),
  });

export const resetKhatm = () => khatmCall("/khatm/reset", { method: "POST" });
