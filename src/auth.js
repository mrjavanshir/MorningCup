/**
 * Who is signed in on this device, and the one way to talk to the store.
 *
 * The Worker works out who is asking from the session token alone, so nothing
 * here can claim to be someone else — the user object kept below is only for
 * display and routing, never trusted by the server. Every store request goes
 * through authFetch, which attaches the token and, if the server no longer
 * accepts it, signs this device out.
 */

const STORE_URL = (import.meta.env.VITE_STORE_URL || "").replace(/\/+$/, "");
const SESSION_KEY = "auth-session";
export const SIGNED_OUT_EVENT = "auth-signed-out";

// Left over from the key-based unlock and the shared documents. Cleared on
// sign-in and sign-out so nothing from a previous person lingers on the device.
const LEGACY_KEYS = ["is-admin", "identity", "is-owner", "view-as-user", "shared-config"];

export const storeConfigured = () => STORE_URL !== "";

export function readSession() {
  try {
    const parsed = JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
    return parsed && parsed.token && parsed.user && parsed.user.id ? parsed : null;
  } catch {
    return null;
  }
}

function saveSession(session) {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    /* private mode — the session lasts until the tab closes */
  }
}

/** Removes everything this device remembers about the person who was using it. */
function forgetDevice() {
  try {
    const drop = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k === SESSION_KEY || k.startsWith("doc-cache-") || LEGACY_KEYS.includes(k)) drop.push(k);
    }
    drop.forEach((k) => localStorage.removeItem(k));
  } catch {
    /* private mode */
  }
}

/**
 * fetch against the store, signed in. Resolves to the Response, or throws on a
 * network failure like fetch does. A 401 means the session is gone (signed out
 * elsewhere, or the password changed), so the app is sent back to sign-in.
 */
export async function authFetch(path, init = {}) {
  const session = readSession();
  const headers = { ...(init.headers || {}) };
  if (session) headers.Authorization = `Bearer ${session.token}`;
  const res = await fetch(`${STORE_URL}${path}`, { ...init, headers });
  if (res.status === 401 && session) {
    forgetDevice();
    window.dispatchEvent(new Event(SIGNED_OUT_EVENT));
  }
  return res;
}

/** Resolves to { session } on success or { error } with a message to show. */
export async function signIn(username, password) {
  if (!STORE_URL) return { error: "The store is not configured — set VITE_STORE_URL and rebuild." };
  try {
    const res = await fetch(`${STORE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) return { error: body.error || "Could not sign in." };
    forgetDevice();
    const session = { token: body.token, user: body.user };
    saveSession(session);
    return { session };
  } catch {
    return { error: "Could not reach the server. Check the connection and try again." };
  }
}

export async function signOut() {
  try {
    await authFetch("/auth/logout", { method: "POST" });
  } catch {
    /* offline — the token is dropped here anyway */
  }
  forgetDevice();
}

/** Resolves to null on success, or a message to show. */
export async function changePassword(current, next) {
  try {
    const res = await authFetch("/auth/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ current, next }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) return body.error || "Could not change the password.";
    const session = readSession();
    if (session) saveSession({ ...session, token: body.token });
    return null;
  } catch {
    return "Could not reach the server. Check the connection and try again.";
  }
}

/** Refreshes the stored user (name, admin) from the server. */
export async function refreshUser() {
  try {
    const res = await authFetch("/auth/me");
    if (!res.ok) return null;
    const { user } = await res.json();
    const session = readSession();
    if (session && user) saveSession({ ...session, user });
    return user || null;
  } catch {
    return null;
  }
}
