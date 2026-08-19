/**
 * Shared-state helper for the link-based games.
 *
 * Two ways to carry a game's state in a link:
 *   ?a=<base64>  the payload inline — works with no backend at all
 *   ?i=<id>      a short id pointing at the Cloudflare Worker store
 *
 * The store is used only when VITE_STORE_URL is set AND the request succeeds;
 * otherwise this silently falls back to inline. That keeps every link that has
 * already been sent working, and means a Worker outage degrades to long URLs
 * rather than a broken game.
 */

const STORE_URL = (import.meta.env.VITE_STORE_URL || "").replace(/\/+$/, "");

export const storeConfigured = () => STORE_URL !== "";

export function encodeInline(value) {
  return btoa(unescape(encodeURIComponent(JSON.stringify(value))));
}

export function decodeInline(raw) {
  try {
    return JSON.parse(decodeURIComponent(escape(atob(raw))));
  } catch {
    return null;
  }
}

/**
 * Persist a game's state. Returns the query param name and value to put in the
 * link — callers should not care which of the two it got.
 */
export async function saveState(value) {
  if (STORE_URL) {
    try {
      const res = await fetch(`${STORE_URL}/s`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(value),
      });
      if (res.ok) {
        const { id } = await res.json();
        if (id) return { param: "i", value: id };
      }
    } catch {
      /* offline or Worker down — fall through to inline */
    }
  }
  return { param: "a", value: encodeInline(value) };
}

/**
 * Collections are the mutable counterpart to saveState: they can be written
 * again later. Creating one returns a write key that must be kept locally —
 * sharing a collection means passing on the id alone, which is read-only.
 */
export async function createCollection(data) {
  if (!STORE_URL) return null;
  try {
    const res = await fetch(`${STORE_URL}/c`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) return null;
    const { id, key } = await res.json();
    return id && key ? { id, key } : null;
  } catch {
    return null;
  }
}

export async function readCollection(id) {
  if (!STORE_URL) return null;
  try {
    const res = await fetch(`${STORE_URL}/c/${encodeURIComponent(id)}`);
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  }
}

export async function updateCollection(id, key, data) {
  if (!STORE_URL) return false;
  try {
    const res = await fetch(`${STORE_URL}/c/${encodeURIComponent(id)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "X-Write-Key": key },
      body: JSON.stringify(data),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Read state back out of the current URL. Resolves to null when there is
 * nothing to load, and to { data, param, value } when there is — the param and
 * value are handed back so a reply link can point at the same stored payload
 * instead of storing a second copy.
 */
export async function loadState(search = window.location.search) {
  const params = new URLSearchParams(search);

  const id = params.get("i");
  if (id) {
    if (!STORE_URL) return null;
    try {
      const res = await fetch(`${STORE_URL}/s/${encodeURIComponent(id)}`);
      if (!res.ok) return null;
      return { data: await res.json(), param: "i", value: id };
    } catch {
      return null;
    }
  }

  const inline = params.get("a");
  if (inline) {
    const data = decodeInline(inline);
    return data === null ? null : { data, param: "a", value: inline };
  }

  return null;
}
