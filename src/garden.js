/**
 * The shared garden: three plants, each grown by one part of the app.
 *
 * The Worker keeps a watering log — who watered which plant on which day —
 * and everything else (how big each plant is, whether it looks thirsty) is
 * worked out from that log here, so the rules can change without touching
 * stored data.
 */

import { authFetch, readSession, storeConfigured } from "./auth.js";

export const PLANTS = [
  { id: "olive", name: "Olive", source: "grows when you read the Qur'an", app: "quran" },
  { id: "pomegranate", name: "Pomegranate", source: "grows when you say 33 zikr in a day", app: "zikr" },
  { id: "rose", name: "Rose", source: "grows when you open a new Name", app: "names" },
];

// Points needed for each stage. A day one of you waters is worth 1, a day you
// both do is worth 3 — so together, full grown is about three weeks away.
export const STAGES = [
  { at: 0, name: "Seed" },
  { at: 2, name: "Sprout" },
  { at: 8, name: "Sapling" },
  { at: 20, name: "Leafing out" },
  { at: 40, name: "In bloom" },
  { at: 70, name: "Full grown" },
];

// Days without anyone watering before a plant starts to look thirsty.
const THIRSTY_AFTER = 3;

/** Today in Baku, as the Worker counts days: "2026-09-26". */
export const gardenDay = (at = new Date()) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Baku", year: "numeric", month: "2-digit", day: "2-digit" }).format(at);

const daysBetween = (a, b) => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000);

/** Everything the garden screens show about one plant, from the raw log. */
export function plantState(doc, plantId, today = gardenDay()) {
  const days = (doc && doc.log && doc.log[plantId]) || {};
  let points = 0;
  let last = null;
  const byPerson = {};
  for (const [day, who] of Object.entries(days)) {
    const people = Object.keys(who);
    points += people.length === 2 ? 3 : people.length;
    people.forEach((p) => (byPerson[p] = (byPerson[p] || 0) + 1));
    if (!last || day > last.day) last = { day, who: people };
  }
  let stage = 0;
  STAGES.forEach((s, i) => {
    if (points >= s.at) stage = i;
  });
  const next = STAGES[stage + 1];
  const since = last ? daysBetween(last.day, today) : null;
  return {
    points,
    stage,
    stageName: STAGES[stage].name,
    // 0..1 of the way to the next stage; 1 when fully grown.
    progress: next ? (points - STAGES[stage].at) / (next.at - STAGES[stage].at) : 1,
    toNext: next ? next.at - points : 0,
    last,
    daysSince: since,
    thirsty: points > 0 && since !== null && since >= THIRSTY_AFTER,
    byPerson,
    wateredToday: days[today] || {},
  };
}

const cacheKey = "doc-cache-shared-garden";

export function cachedGarden() {
  try {
    const parsed = JSON.parse(localStorage.getItem(cacheKey) || "null");
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function cache(doc) {
  try {
    localStorage.setItem(cacheKey, JSON.stringify(doc));
  } catch {
    /* private mode */
  }
}

export async function readGarden() {
  if (!storeConfigured()) return null;
  try {
    const res = await authFetch("/garden");
    if (!res.ok) return null;
    const doc = await res.json();
    cache(doc);
    return doc;
  } catch {
    return null;
  }
}

/**
 * Waters a plant for whoever is signed in. Safe to call on every qualifying
 * action: the Worker counts one watering per person per plant per day, and
 * this skips the request entirely once today's has gone through.
 */
export async function water(plant) {
  if (!storeConfigured()) return null;
  const who = readSession()?.user.id;
  if (!who) return null;
  const doneKey = `garden-watered-${who}-${plant}`;
  const today = gardenDay();
  try {
    if (localStorage.getItem(doneKey) === today) return null;
  } catch {
    /* private mode — just send it */
  }
  try {
    const res = await authFetch("/garden/water", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plant }),
    });
    if (!res.ok) return null;
    const doc = await res.json();
    cache(doc);
    try {
      localStorage.setItem(doneKey, today);
    } catch {
      /* private mode */
    }
    return doc;
  } catch {
    return null;
  }
}
