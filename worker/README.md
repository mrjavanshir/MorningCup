# ganira-games-store

A ~90-line Cloudflare Worker backing the link-based games. It stores an opaque
JSON blob and hands back a short id, so a link can be
`…/games/truths?i=xzhmkvrmy3` instead of a 250-character base64 blob.

It is deliberately dumb: it never interprets what the games store in it.

| | |
|---|---|
| `POST /s` | body: any JSON → `201 { "id": "xzhmkvrmy3" }` |
| `GET /s/:id` | → the stored JSON, or `404` |

Payloads are capped at 16 KB, ids are 10 random characters from a 31-character
alphabet (no `0`/`o`/`1`/`l`/`i`), and entries expire after ~13 months.

## Deploying

You need a Cloudflare account. Everything here fits inside the free tier —
Workers allow 100,000 requests/day and KV allows 100,000 reads and 1,000 writes
a day, which this app will not come close to. Unlike Supabase's free tier,
nothing pauses after a week of inactivity.

```bash
cd worker
npx wrangler login                        # opens a browser
npx wrangler kv namespace create STORE    # prints an id
```

Put that id into `wrangler.toml`, replacing `REPLACE_WITH_YOUR_KV_NAMESPACE_ID`,
then:

```bash
npx wrangler deploy
```

It prints a URL like `https://ganira-games-store.<your-subdomain>.workers.dev`.

## Pointing the app at it

The site reads `VITE_STORE_URL` at build time. For local development:

```bash
VITE_STORE_URL=http://localhost:8788 npm run dev   # with `npx wrangler dev` running
```

For the deployed site, add the Worker URL as a repository variable named
`VITE_STORE_URL` (Settings → Secrets and variables → Actions → Variables), which
the Pages workflow already passes through to the build.

**If `VITE_STORE_URL` is unset the app still works** — every game falls back to
packing its state into the URL as base64, exactly as it did before this existed.
The same fallback happens if the Worker is unreachable, so an outage means long
links rather than broken ones.

## A note on what this does and doesn't protect

A static site cannot hold a secret: anything shipped in the JavaScript is
readable by anyone who opens the page. So this Worker assumes its endpoint is
public. What actually protects the contents is that ids are unguessable
(31^10 ≈ 8×10^14 combinations) — not the CORS allowlist, which only stops other
*websites* calling it, not `curl`.

That is proportionate for mood scores and personal notes shared between two
people. It would not be enough for anything genuinely sensitive.
