/**
 * GitHub Pages has no rewrite rules, so a path like /games/jar is not a real
 * file: Pages answers it with 404.html, which loads the app but returns a 404
 * status. That is invisible in a browser but link-preview crawlers commonly
 * skip non-200 responses, and these links get shared in messaging apps.
 *
 * So after the build, drop a real copy of index.html at every route the app
 * can serve. Same URLs, same behaviour, honest status code. 404.html stays as
 * the fallback for anything not listed here.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");

const appSource = fs.readFileSync(path.join(root, "src", "App.jsx"), "utf8");

// Pull the ids out of the GAMES array rather than keeping a second list here,
// which would quietly go stale the next time a game is added.
const gamesBlock = appSource.match(/const GAMES = \[([\s\S]*?)\n\];/);
if (!gamesBlock) {
  console.error("prerender: could not find the GAMES array in src/App.jsx");
  process.exit(1);
}
const ids = [...gamesBlock[1].matchAll(/\bid:\s*"([^"]+)"/g)].map((m) => m[1]);
if (ids.length === 0) {
  console.error("prerender: found the GAMES array but no ids in it");
  process.exit(1);
}

// "sun" is also reachable at the bare /sun — the first link ever shared, kept
// working deliberately (see parseRoute in App.jsx).
const legacy = ["sun"].filter((id) => ids.includes(id));

const html = fs.readFileSync(path.join(dist, "index.html"), "utf8");

const routes = ["games", ...ids.map((id) => `games/${id}`), ...legacy];
for (const route of routes) {
  const dir = path.join(dist, route);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), html);
}

console.log(`prerender: wrote ${routes.length} routes (${ids.length} games + hub + ${legacy.length} legacy)`);
