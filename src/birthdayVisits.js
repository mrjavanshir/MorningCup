/**
 * Visit log for the birthday card — admin-only to read, and Ganira has no way
 * to reach it from the UI. Rides on the same named-document store as the
 * khatm (see doc.js for the read-merge-write mechanics), under its own
 * document name so it never collides with anything else there.
 *
 * Deliberately tracks nothing about what happens inside the card — only that
 * it was opened, when, and for how long.
 */

import { docsAvailable, readDoc, writeDoc } from "./doc.js";

const DOC = "birthday-visits";
// Keeps the document well under the Worker's 16 KB payload cap (each session
// is well under 100 bytes as JSON) while still holding a long history.
const MAX_SESSIONS = 300;

const randomId = () =>
  Array.from(crypto.getRandomValues(new Uint8Array(6)), (b) => b.toString(36).padStart(2, "0")).join("");

export const visitsAvailable = docsAvailable;

/**
 * Call once when the card mounts. The read happens here, with no time
 * pressure — not in endVisit, which fires from a pagehide/visibilitychange
 * handler where there is no time left for a round trip before the tab is
 * gone. Returns a handle to pass to endVisit (carrying the session id and
 * the sessions list already fetched), or null if there is no store
 * configured, or the write failed.
 */
export async function startVisit() {
  if (!docsAvailable()) return null;
  const doc = await readDoc(DOC);
  const sessions = Array.isArray(doc?.sessions) ? doc.sessions : [];
  const id = randomId();
  const at = new Date().toISOString();
  const next = [...sessions, { id, at, ms: 0 }].slice(-MAX_SESSIONS);
  const ok = await writeDoc(DOC, { sessions: next });
  return ok ? { id, sessions: next } : null;
}

/**
 * Call when the tab hides or is about to unload, with elapsed ms so far.
 * A single write, patched into the snapshot startVisit already fetched —
 * not a fresh read-merge-write, which wouldn't reliably land in time. Not
 * awaited: the caller is racing page teardown, not waiting on a result.
 * The trade-off is that a concurrent visit's write in the same window could
 * be overwritten, which is an acceptable risk for a personal birthday card.
 */
export function endVisit(handle, ms) {
  if (!handle) return;
  const sessions = handle.sessions.map((s) => (s.id === handle.id ? { ...s, ms } : s));
  writeDoc(DOC, { sessions }, { keepalive: true });
}

/** Admin-only read: every recorded visit, newest first. */
export async function fetchVisits() {
  const doc = await readDoc(DOC);
  const sessions = doc && Array.isArray(doc.sessions) ? doc.sessions : [];
  return [...sessions].reverse();
}
