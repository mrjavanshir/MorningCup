/**
 * Reads and writes the STORE namespace through wrangler, for the scripts in
 * this folder. `--local` targets the store `wrangler dev` uses; `--remote` the
 * deployed one. There is deliberately no default, so a script never touches
 * the live data by accident.
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const workerDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export function target(argv) {
  const remote = argv.includes("--remote");
  const local = argv.includes("--local");
  if (remote === local) {
    console.error("Pass exactly one of --local (wrangler dev) or --remote (the deployed store).");
    process.exit(1);
  }
  return remote ? "--remote" : "--local";
}

// For --local: the state folder `wrangler dev --persist-to` was pointed at, if not the default.
const persist = (where) => (where === "--local" && process.env.WRANGLER_PERSIST ? ["--persist-to", process.env.WRANGLER_PERSIST] : []);

function wrangler(args) {
  const res = spawnSync("npx", ["-y", "wrangler", "kv", "key", ...args, ...persist(args[args.length - 1]), "--binding", "STORE"], {
    cwd: workerDir,
    encoding: "utf8",
  });
  if (res.status !== 0) throw new Error(`wrangler kv key ${args[0]} failed:\n${res.stderr || res.stdout}`);
  return res.stdout;
}

/** The stored JSON under `key`, or null when there is none. */
export function kvGet(key, where) {
  const res = spawnSync("npx", ["-y", "wrangler", "kv", "key", "get", key, "--binding", "STORE", where, ...persist(where), "--text"], {
    cwd: workerDir,
    encoding: "utf8",
  });
  const out = (res.stdout || "").trim();
  if (res.status !== 0 || out === "" || /^Value not found/i.test(out)) return null;
  try {
    return JSON.parse(out);
  } catch {
    throw new Error(`${key} is not JSON: ${out.slice(0, 80)}`);
  }
}

export function kvPut(key, value, where) {
  wrangler(["put", key, JSON.stringify(value), where]);
}
