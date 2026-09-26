/**
 * Creates an account, or sets a new password on one:
 *
 *   node scripts/set-password.mjs ganira --remote --must-change
 *
 * The password is hashed here, so it never leaves this machine — only the
 * salt and hash are written to KV. Setting a password signs that person out
 * of every device. Set PASSWORD in the environment to skip the prompt.
 *
 * --must-change makes them choose their own password the first time they sign
 * in, so the one you typed here stops working — use it for anyone but you.
 */
import { webcrypto as crypto } from "node:crypto";
import readline from "node:readline";
import { kvGet, kvPut, target } from "./kv.mjs";

// Must match PBKDF2_ITERATIONS in src/index.js (Workers allows at most 100k).
const ITERATIONS = 100_000;

// The ids are what the app files data under ("j" / "g"); they never change.
const ACCOUNTS = {
  javanshir: { id: "j", name: "Javanshir", admin: true },
  ganira: { id: "g", name: "Ganira", admin: false },
};

const toHex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");

async function hash(password, saltHex) {
  const salt = new Uint8Array(saltHex.match(/../g).map((h) => parseInt(h, 16)));
  const material = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations: ITERATIONS }, material, 256);
  return toHex(bits);
}

function askHidden(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    rl._writeToOutput = (s) => {
      if (s.startsWith(question)) rl.output.write(question);
    };
    rl.question(question, (answer) => {
      rl.output.write("\n");
      rl.close();
      resolve(answer);
    });
  });
}

const username = (process.argv[2] || "").toLowerCase();
const account = ACCOUNTS[username];
if (!account) {
  console.error(`Usage: node scripts/set-password.mjs <${Object.keys(ACCOUNTS).join("|")}> --local|--remote`);
  process.exit(1);
}
const where = target(process.argv);
const mustChange = process.argv.includes("--must-change");

let password = process.env.PASSWORD;
if (!password) {
  password = await askHidden(`New password for ${username}: `);
  const again = await askHidden("Again: ");
  if (password !== again) {
    console.error("The two did not match; nothing was changed.");
    process.exit(1);
  }
}
if (password.length < 8) {
  console.error("Use at least 8 characters; nothing was changed.");
  process.exit(1);
}

const existing = kvGet(`user:${username}`, where);
const salt = toHex(crypto.getRandomValues(new Uint8Array(16)));
kvPut(
  `user:${username}`,
  {
    ...account,
    salt,
    iterations: ITERATIONS,
    hash: await hash(password, salt),
    ver: (existing?.ver || 0) + 1,
    ...(mustChange ? { mustChange: true } : {}),
  },
  where
);
console.log(`${existing ? "Updated" : "Created"} ${username} (${where.slice(2)}). Any device signed in as ${username} is now signed out.`);
if (mustChange) console.log(`${username} will be asked to choose a new password on first sign-in.`);
