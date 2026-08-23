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

/**
 * The birthday card is a one-off link sent to one person, not an entry point
 * into "Nook" — she should never see that name, get offered an install of an
 * app that turns out to hold a dozen unrelated games, or land on the hub if
 * she ever taps a home-screen icon she added out of curiosity. So its HTML
 * strips every PWA/identity signal the rest of the site intentionally has:
 * the manifest link and the service-worker registration script (so nothing
 * about this visit ever gets installed or cached as "Nook"), the
 * apple-mobile-web-app-* meta that makes "Add to Home Screen" open full-
 * screen under that name, and the shared favicon/apple-touch-icon. Title and
 * description are swapped for something that stands on its own.
 */
function stripPwa(html) {
  return html
    .replace(/<link rel="manifest"[^>]*>\s*/, "")
    .replace(/<script id="vite-plugin-pwa:register-sw"[^>]*><\/script>\s*/, "")
    .replace(/<meta name="apple-mobile-web-app-capable"[^>]*\/>\s*\n?/, "")
    .replace(/<meta name="apple-mobile-web-app-status-bar-style"[^>]*\/>\s*\n?/, "")
    .replace(/<meta name="apple-mobile-web-app-title"[^>]*\/>\s*\n?/, "")
    .replace(/<meta name="mobile-web-app-capable"[^>]*\/>\s*\n?/, "")
    .replace(/<link rel="apple-touch-icon"[^>]*>\s*\n?/, "")
    .replace(
      /<link rel="icon"[^>]*>/,
      `<link rel="icon" href="data:image/svg+xml,${encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="82" font-size="80">🎂</text></svg>',
      )}" />`,
    )
    .replace(/<meta name="description"[^>]*\/>/, '<meta name="description" content="A little birthday surprise." />')
    .replace(/<title>[^<]*<\/title>/, "<title>Happy Birthday</title>");
}

const birthdayHtml = ids.includes("birthday") ? stripPwa(html) : null;

const routes = ["games", ...ids.map((id) => `games/${id}`), ...legacy];
for (const route of routes) {
  const dir = path.join(dist, route);
  fs.mkdirSync(dir, { recursive: true });
  const body = route === "games/birthday" && birthdayHtml ? birthdayHtml : html;
  fs.writeFileSync(path.join(dir, "index.html"), body);
}

console.log(`prerender: wrote ${routes.length} routes (${ids.length} games + hub + ${legacy.length} legacy)`);
