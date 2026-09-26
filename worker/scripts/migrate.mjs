/**
 * One-off: splits the old shared documents into one per person.
 *
 *   node scripts/migrate.mjs --remote --dry-run   # print what it would write
 *   node scripts/migrate.mjs --remote
 *
 * Before accounts existed, both people's reading marks and likes sat side by
 * side in one document, keyed "j" and "g". Each half now moves to that
 * person's own key. The old documents are left where they are as a backup,
 * and a person's new document is never overwritten if it already exists — so
 * running this twice, or after someone has started using the new version,
 * loses nothing.
 */
import { kvGet, kvPut, target } from "./kv.mjs";

const where = target(process.argv);
const dryRun = process.argv.includes("--dry-run");
const PEOPLE = ["j", "g"];

const pick = (obj, id) => (obj && typeof obj === "object" ? obj[id] : undefined);

/** doc:<name> as it was → what each person's u:<id>:<name> should hold. */
const SPLITS = {
  reading: (old, id) => {
    const out = {};
    if (pick(old.marks, id)) out.mark = pick(old.marks, id);
    if (pick(old.read, id)) out.read = pick(old.read, id);
    if (pick(old.likes, id)) out.likes = pick(old.likes, id);
    return out;
  },
  names: (old, id) => (pick(old.likes, id) ? { likes: pick(old.likes, id) } : {}),
};

let wrote = 0;
for (const [name, split] of Object.entries(SPLITS)) {
  const old = kvGet(`doc:${name}`, where);
  if (!old) {
    console.log(`doc:${name}: nothing there, skipped`);
    continue;
  }
  for (const id of PEOPLE) {
    const key = `u:${id}:${name}`;
    const next = split(old, id);
    if (Object.keys(next).length === 0) {
      console.log(`${key}: nothing of ${id}'s in doc:${name}`);
      continue;
    }
    if (kvGet(key, where)) {
      console.log(`${key}: already exists, left alone`);
      continue;
    }
    console.log(`${key}: ${JSON.stringify(next).length} bytes${dryRun ? " (dry run)" : ""}`);
    if (!dryRun) kvPut(key, { ...next, migrated: new Date().toISOString() }, where);
    wrote++;
  }
}

// The visit log was only ever written by the card's viewer; it becomes hers.
const visits = kvGet("doc:birthday-visits", where);
if (visits && !kvGet("u:g:birthday-visits", where)) {
  console.log(`u:g:birthday-visits: ${(visits.sessions || []).length} visits${dryRun ? " (dry run)" : ""}`);
  if (!dryRun) kvPut("u:g:birthday-visits", visits, where);
  wrote++;
}

// doc:khatm stays exactly where it is — it is still the one shared document.
console.log(dryRun ? `Dry run: would write ${wrote} key(s).` : `Done: wrote ${wrote} key(s). Old documents kept as a backup.`);
