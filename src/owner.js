/**
 * Who is looking, and which games they should see listed.
 *
 * A static site cannot keep a secret: OWNER_KEY ships in the bundle and is
 * readable by anyone who looks. It is a latch, not a lock — enough to keep the
 * full list and the settings page out of the way of someone casually opening
 * the hub, and nothing more. The same value gates config writes on the Worker
 * (see OWNER_KEY in worker/wrangler.toml — keep the two equal).
 */

const STORE_URL = (import.meta.env.VITE_STORE_URL || "").replace(/\/+$/, "");

export const OWNER_KEY = "q7m2-havaland-4tx9";
const OWNER_FLAG = "is-owner";
const CONFIG_CACHE = "shared-config";

export function readOwner() {
  try {
    const param = new URLSearchParams(window.location.search).get("owner");
    if (param === OWNER_KEY) {
      localStorage.setItem(OWNER_FLAG, "1");
      // Drop the key from the address bar so it is not left in history or
      // copied by accident when sharing the hub link.
      const url = new URL(window.location.href);
      url.searchParams.delete("owner");
      window.history.replaceState({}, "", url);
      return true;
    }
    return localStorage.getItem(OWNER_FLAG) === "1";
  } catch {
    return false;
  }
}

export function clearOwner() {
  try {
    localStorage.removeItem(OWNER_FLAG);
  } catch {
    /* private mode */
  }
}

/** Last config this device saw, so the hub still filters correctly offline. */
export function cachedConfig() {
  try {
    const raw = localStorage.getItem(CONFIG_CACHE);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function cache(config) {
  try {
    localStorage.setItem(CONFIG_CACHE, JSON.stringify(config));
  } catch {
    /* private mode */
  }
}

/**
 * Resolves to a map of { gameId: boolean }, or null when there is nothing to
 * go on — callers then fall back to the `shared` flags compiled into GAMES.
 */
export async function fetchSharedConfig() {
  if (!STORE_URL) return null;
  try {
    const res = await fetch(`${STORE_URL}/config`);
    if (!res.ok) return null;
    const data = await res.json();
    if (!data || typeof data !== "object" || !data.games) return null;
    cache(data.games);
    return data.games;
  } catch {
    return null;
  }
}

export async function saveSharedConfig(games) {
  if (!STORE_URL) return false;
  try {
    const res = await fetch(`${STORE_URL}/config`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "X-Write-Key": OWNER_KEY },
      body: JSON.stringify({ games, updated: new Date().toISOString() }),
    });
    if (res.ok) cache(games);
    return res.ok;
  } catch {
    return false;
  }
}
