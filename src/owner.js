/**
 * The two people, and the admin-side view settings.
 *
 * Who is signed in comes from auth.js and is decided by the server — this file
 * only names the ids the store files data under, and handles the per-person
 * list of apps each hub shows.
 */

import { authFetch, storeConfigured } from "./auth.js";

export const ME = "j";
export const THEM = "g";

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
 * Resolves to { j: {appId: bool}, g: {appId: bool} } — one list per person,
 * so each of them can be given a different set. Null when there is nothing to
 * go on; callers then fall back to the `shared` flags compiled into APPS.
 */
export async function fetchViews() {
  if (!storeConfigured()) return null;
  try {
    const res = await authFetch("/config");
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
  if (!storeConfigured()) return false;
  try {
    const res = await authFetch("/config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ views, updated: new Date().toISOString() }),
    });
    if (res.ok) cache(views);
    return res.ok;
  } catch {
    return false;
  }
}
