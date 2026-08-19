/**
 * Who you are, and what you are allowed to do — deliberately two things.
 *
 * `identity` is whose data this device writes: "j" or "g". It is decided once
 * and never moves, because the khatm and the reading marks are stored per
 * person and a device that changed identity would write into the other one's
 * record.
 *
 * `isAdmin` is only permission: see every game, open the settings. An admin
 * previewing the user view keeps their identity, so anything they mark while
 * previewing is still filed under them. That separation is the whole point —
 * previously one flag meant both, so previewing silently wrote as the other
 * person.
 *
 * A static site cannot keep a secret: ADMIN_KEY ships in the bundle and is
 * readable by anyone who looks. It is a latch, not a lock — enough to keep the
 * full list and the settings out of the way of someone casually opening the
 * hub. The same value gates config writes on the Worker (see OWNER_KEY in
 * worker/wrangler.toml — keep the two equal).
 */

const STORE_URL = (import.meta.env.VITE_STORE_URL || "").replace(/\/+$/, "");

export const ADMIN_KEY = "q7m2-havaland-4tx9";
export const OWNER_KEY = ADMIN_KEY; // the Worker still calls it this
export const ME = "j";
export const THEM = "g";

const ADMIN_FLAG = "is-admin";
const IDENTITY_KEY = "identity";
const LEGACY_FLAG = "is-owner";
const CONFIG_CACHE = "shared-config";
const AS_USER_KEY = "view-as-user";

/** Admins can sit in the user view for as long as they like, not just peek. */
export function readAsUser() {
  try {
    return localStorage.getItem(AS_USER_KEY) === "1";
  } catch {
    return false;
  }
}

export function setAsUser(on) {
  try {
    if (on) localStorage.setItem(AS_USER_KEY, "1");
    else localStorage.removeItem(AS_USER_KEY);
  } catch {
    /* private mode */
  }
}

/** Devices unlocked before roles existed carried one flag meaning both. */
function migrateLegacy() {
  if (localStorage.getItem(LEGACY_FLAG) === "1") {
    localStorage.setItem(ADMIN_FLAG, "1");
    localStorage.setItem(IDENTITY_KEY, ME);
    localStorage.removeItem(LEGACY_FLAG);
  }
}

function grantAdmin() {
  localStorage.setItem(ADMIN_FLAG, "1");
  localStorage.setItem(IDENTITY_KEY, ME);
}

export function readSession() {
  try {
    migrateLegacy();
    const param = new URLSearchParams(window.location.search).get("owner");
    if (param === ADMIN_KEY) {
      grantAdmin();
      // Drop the key from the address bar so it is not left in history or
      // copied by accident when sharing the hub link.
      const url = new URL(window.location.href);
      url.searchParams.delete("owner");
      window.history.replaceState({}, "", url);
    }
    return {
      isAdmin: localStorage.getItem(ADMIN_FLAG) === "1",
      identity: localStorage.getItem(IDENTITY_KEY) === ME ? ME : THEM,
    };
  } catch {
    return { isAdmin: false, identity: THEM };
  }
}

/**
 * Unlock without a URL. An installed PWA has no address bar, and its storage
 * can be separate from the browser it was installed from, so the ?owner= link
 * cannot always reach it.
 */
export function unlockAdmin(key) {
  if (key.trim() !== ADMIN_KEY) return false;
  try {
    grantAdmin();
  } catch {
    return false;
  }
  return true;
}

/**
 * Hand the device over entirely — clears the role AND the identity, so it
 * becomes an ordinary user device. Distinct from previewing the user view,
 * which must not touch identity.
 */
export function signOut() {
  try {
    localStorage.removeItem(ADMIN_FLAG);
    localStorage.removeItem(IDENTITY_KEY);
    localStorage.removeItem(LEGACY_FLAG);
  } catch {
    /* private mode */
  }
}

/** Last views this device saw, so the hub still filters correctly offline. */
export function cachedViews() {
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
 * Resolves to { j: {gameId: bool}, g: {gameId: bool} } — one list per person,
 * so each of them can be given a different set. Null when there is nothing to
 * go on; callers then fall back to the `shared` flags compiled into GAMES.
 */
export async function fetchViews() {
  if (!STORE_URL) return null;
  try {
    const res = await fetch(`${STORE_URL}/config`);
    if (!res.ok) return null;
    const data = await res.json();
    const views = normaliseViews(data);
    if (!views) return null;
    cache(views);
    return views;
  } catch {
    return null;
  }
}

/**
 * Accepts the old single-list shape as well. That config only ever described
 * her view, so it becomes hers and his is left unset (meaning: show him
 * everything the code marks shared).
 */
function normaliseViews(data) {
  if (!data || typeof data !== "object") return null;
  if (data.views && typeof data.views === "object") return { [ME]: data.views[ME] || {}, [THEM]: data.views[THEM] || {} };
  if (data.games && typeof data.games === "object") return { [ME]: {}, [THEM]: data.games };
  return null;
}

export async function saveViews(views) {
  if (!STORE_URL) return false;
  try {
    const res = await fetch(`${STORE_URL}/config`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "X-Write-Key": OWNER_KEY },
      body: JSON.stringify({ views, updated: new Date().toISOString() }),
    });
    if (res.ok) cache(views);
    return res.ok;
  } catch {
    return false;
  }
}
