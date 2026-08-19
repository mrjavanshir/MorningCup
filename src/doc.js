/**
 * Named documents both people read and write — currently just the khatm.
 *
 * Writes go through read-merge-write rather than a blind overwrite: two people
 * marking juz around the same time would otherwise clobber each other, and
 * losing someone's progress is the one failure that would actually matter here.
 */

import { OWNER_KEY } from "./owner.js";

const STORE_URL = (import.meta.env.VITE_STORE_URL || "").replace(/\/+$/, "");

export const docsAvailable = () => STORE_URL !== "";

const cacheKey = (name) => `doc-cache-${name}`;

export function cachedDoc(name) {
  try {
    const raw = localStorage.getItem(cacheKey(name));
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function cache(name, value) {
  try {
    localStorage.setItem(cacheKey(name), JSON.stringify(value));
  } catch {
    /* private mode */
  }
}

export async function readDoc(name) {
  if (!STORE_URL) return null;
  try {
    const res = await fetch(`${STORE_URL}/doc/${name}`);
    if (!res.ok) return null;
    const data = await res.json();
    cache(name, data);
    return data;
  } catch {
    return null;
  }
}

async function writeDoc(name, value) {
  if (!STORE_URL) return false;
  try {
    const res = await fetch(`${STORE_URL}/doc/${name}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "X-Write-Key": OWNER_KEY },
      body: JSON.stringify(value),
    });
    if (res.ok) cache(name, value);
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Applies `change` to the newest copy of the document rather than to whatever
 * this device last saw, so a mark made elsewhere in the meantime survives.
 * Returns the document actually written, or null if it could not be saved.
 */
export async function updateDoc(name, change) {
  if (!STORE_URL) return null;
  const latest = (await readDoc(name)) || {};
  const next = change(latest);
  const ok = await writeDoc(name, next);
  return ok ? next : null;
}
