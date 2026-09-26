# ganira-games-store

The Cloudflare Worker behind the app: sign-in, each person's own data, and the
short links the link-based games use. The whole app sits behind sign-in, and so
does every route here except `/auth/login`.

## How people are kept apart

There are two accounts, `javanshir` (id `j`, admin) and `ganira` (id `g`), and
no sign-up. The Worker works out who is asking from the session token alone and
files everything under that person's id, so no device can write the other
person's data — not by a bug, not by a crafted request.

| | |
|---|---|
| `POST /auth/login` | `{ username, password }` → `{ token, user }` |
| `POST /auth/logout` | ends this session |
| `GET /auth/me` | → `{ user }` |
| `POST /auth/password` | `{ current, next }` → `{ token }`; signs out every other device |
| `GET` / `PUT /me/doc/:name` | your own document, stored as `u:<id>:<name>` |
| `GET /users/:id/doc/:name` | the other person's document, read-only |
| `GET /khatm`, `POST /khatm/toggle`, `POST /khatm/reset` | the one shared document; the server stamps each mark with whoever is signed in and will not clear the other person's |
| `GET /config`, `PUT /config` | which games each hub lists; writing is admin-only |
| `POST /s`, `GET /s/:id` | write-once blobs behind a short id |
| `POST /c`, `GET` / `PUT /c/:id` | mutable collections; writing also needs the collection's own key |

Passwords are hashed with PBKDF2-SHA256 (100k iterations, a salt per account).
Sessions last a year and are stored under a hash of the token. Five wrong
passwords from one address lock that address out of that account for 15
minutes; thirty from anywhere lock the account for 15 minutes.

Personal documents may be up to 256 KB; everything else is capped at 16 KB.

## Accounts

`scripts/set-password.mjs` creates an account or sets a new password. It hashes
the password on your machine, so the password itself never reaches Cloudflare,
and it signs that person out everywhere.

```bash
cd worker
node scripts/set-password.mjs javanshir --remote
node scripts/set-password.mjs ganira --remote
```

There is no "forgot password" (there is no email); run the script again. Either
person can also change their own password from the hub.

## Moving to accounts (once)

Before accounts, both people's Qur'an marks and likes shared one document keyed
`j` / `g`. `scripts/migrate.mjs` copies each half to that person's own key. It
never overwrites a key that already exists and leaves the old documents in
place as a backup, so it is safe to run twice.

The order matters, because the new app cannot sign in until accounts exist and
the old app cannot write once the Worker requires sign-in:

1. `node scripts/migrate.mjs --remote --dry-run` — check what it would write.
2. `node scripts/migrate.mjs --remote`
3. `node scripts/set-password.mjs javanshir --remote`, then `ganira`.
4. `npx wrangler deploy`
5. Deploy the site.

Between 4 and 5 the old site is still live against the new Worker and cannot
load or save anything, so do them back to back.

## Deploying from scratch

You need a Cloudflare account. Everything here fits inside the free tier.

```bash
cd worker
npx wrangler login                        # opens a browser
npx wrangler kv namespace create STORE    # prints an id
```

Put that id into `wrangler.toml`, create the accounts as above, then
`npx wrangler deploy`. It prints a URL like
`https://ganira-games-store.<your-subdomain>.workers.dev`.

## Pointing the app at it

The site reads `VITE_STORE_URL` at build time; without it there is nothing to
sign in to. For the deployed site it is a repository variable named
`VITE_STORE_URL` (Settings → Secrets and variables → Actions → Variables).

Locally, with its own throwaway data:

```bash
cd worker
npx wrangler dev --local --port 8799 --persist-to .wrangler/test-state
WRANGLER_PERSIST=.wrangler/test-state PASSWORD=something-long node scripts/set-password.mjs javanshir --local
cd .. && VITE_STORE_URL=http://localhost:8799 npm run dev
```

## What this does and doesn't protect

The data now needs a password. The site itself is still a public GitHub Pages
site, so its code — and anything built into it, like the verse and Names
texts — can be read by anyone who fetches the JavaScript. Signing in guards
what the two of you save, not what ships with the app.
