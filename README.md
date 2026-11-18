# QuoteFlow

Instant price quotes and lead management for small service businesses: blinds, cleaning, repairs.

A customer opens the business's public calculator, enters sizes or hours, sees the price immediately
and sends a request. The owner gets the request on the dashboard and in Telegram, then moves it through
`new → contacted → quoted → won / lost`.

**Live demo:** https://quoteflow-khaki.vercel.app. The seeded calculator is at
[/b/demo](https://quoteflow-khaki.vercel.app/b/demo); sign up to get a dashboard of your own.

## Features

- **Public calculator** at `/b/<slug>`: three pricing models (per m², per hour, fixed per item), minimum
  order, flat and percentage surcharges. The price is recalculated on the server before a lead is saved.
- **Leads**: duplicate submits are ignored (idempotency key), and each lead keeps a snapshot of the quote
  the customer saw.
- **Dashboard**: recent requests and status changes; every change is recorded, and two tabs cannot
  overwrite each other's change.
- **Services**: owners add and edit services and hide or show them in the calculator. Editing a price
  changes only new requests; earlier leads keep the quote they were sent with.
- **Options**: each service can have up to 10 paid options (a fixed amount or a percent of the price),
  added and removed from the dashboard; customers tick them in the calculator.
- **Telegram notifications**: "Connect Telegram" with a one-time link or QR code, no chat ID to copy.
- **Accounts**: sign-up, sign-in and sign-out with database sessions; rate limiting on every public form.

## Tech stack

Next.js 16 (App Router, Server Actions, Cache Components) · TypeScript · PostgreSQL (Neon) with
Drizzle ORM · Zod · Tailwind CSS · Vitest with PGlite · GitHub Actions.

## Getting started

Requirements: Node.js 22 and a PostgreSQL database (a free [Neon](https://neon.tech) project works).

```bash
npm install
cp .env.example .env.local   # then set DATABASE_URL; TELEGRAM_BOT_TOKEN is optional
npm run db:migrate
npm run db:seed              # optional: demo business at /b/demo
npm run dev
```

Open http://localhost:3000/sign-up to create a business, or http://localhost:3000/b/demo for the
seeded calculator.

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm test` | Unit and repository tests (no database or secrets needed) |
| `npm run test:e2e` | Browser test of the main flow; needs `npm run build` and a database it may write to |
| `npm run lint` / `npm run typecheck` | ESLint and TypeScript |
| `npm run build` | Production build |
| `npm run db:generate` | New migration from `src/db/schema.ts` |
| `npm run telegram:webhook` | Register the production webhook with Telegram (`--delete` removes it) |

CI runs lint, typecheck, tests and build on every pull request, and in a parallel job the browser test
against a fresh Postgres container.

## Project structure

```
src/
  domain/   Pure TypeScript business logic: pricing, leads, auth, rate limits, Telegram linking.
            No Next.js, no database, no fetch. Covered by unit tests.
  db/       Drizzle schema and repositories that implement the domain interfaces.
  lib/      Server glue: sessions, password hashing, Telegram API, rate limiter, formatting.
  app/      Routes, Server Actions and components. Input is validated with Zod here.
drizzle/    SQL migrations.
e2e/        Playwright test of the main flow in a real browser.
design/     Mockups and the design system (pen.dev file).
```

The domain defines what it needs as interfaces (`LeadRepository`, `PasswordHasher`, ...) and gets the
implementations passed in, so the same code runs against Postgres in production and fakes in tests.

## Engineering decisions

### Money in integer kopiykas
Prices and totals are integers in minor units, never floats: `0.1 + 0.2` problems cannot appear in a
bill. Form input such as `1 200,50` is parsed into kopiykas without going through a float.

### Pricing models as strategies
Each pricing kind (per area, per hour, fixed) is a strategy behind one interface, and the rule is stored
as a discriminated union in a `jsonb` column. A new pricing model is a new strategy, not a new branch in
every function.

Options (surcharges) live in a `jsonb` array on the service. Adding or removing one is a single
`UPDATE` that changes the array in place (`surcharges || new_option`, or rebuilding it without one id),
not read, modify and write back, so two tabs editing options at once cannot overwrite each other. The
10-option limit is part of the same `UPDATE`, so it cannot be bypassed by parallel requests either.

### The server recalculates every price
The calculator shows a preview, but the lead is saved with a quote calculated on the server from the
stored service, so a changed request body cannot set its own price. The quote is stored as a snapshot,
so later price changes do not rewrite old leads.

Numbers typed by people go through one strict parser (`parseDecimal`): digits with an optional `.` or
`,` part. `Number()` or `z.coerce.number()` would also accept `0x10`, `1e3` or `Infinity` and read an
empty field as 0. The preview and the server share the parser, so the calculator never shows a price
the server then refuses.

### The calculator shows its arithmetic
The receipt next to the form lists every line and the total, and under it the calculation itself
(`210 × 160 cm = 3,36 m² × 1 000 ₴ = 3 360 ₴`, or why a minimum applied). A customer who can check
the price trusts it, and the owner gets fewer "why so much?" calls. The explanation is a pure function
next to the preview, tested with the same numbers as the pricing rules. Whole prices are shown without
kopiykas (`3 860 ₴`), partial ones with them (`1 348,54 ₴`).

If the owner removes an option while a customer has it ticked, the server refuses the request (it
never prices from the browser) and reloads the service. The form then shows the option as no longer
available, drops it from the total and asks the customer to check the new price and send again,
instead of failing with a generic error.

### Lead status as a state machine
Allowed transitions live in one table in the domain. A status change is saved with compare-and-set
(`where status = from`), so two tabs cannot both apply a change; the second one gets a conflict message
and the latest status.

### Database sessions instead of JWT
The cookie holds a random token, and the database stores only its SHA-256 hash. Sign-out and revoking
a session work immediately, and a leaked table cannot be replayed. The session is replaced on every
sign-in. Passwords are hashed with scrypt.

### Notifications as listeners
Creating a lead publishes a `lead.created` event; Telegram is one listener. It runs after the response
is sent (`after()`), so a slow Telegram never delays the customer, and one failing listener does not
stop the others.

### Tests against real Postgres without Docker
Repository tests run the real migrations on PGlite (Postgres compiled to WASM), so SQL, constraints and
upserts are tested without a database server or secrets in CI.

### One end-to-end test for the main flow
A single Playwright test walks the path that makes the product useful: an owner signs up, adds a service
priced by area with a paid option, a customer in a separate browser context gets the price (2 m² at
1 000 ₴/m² plus 500 ₴ installation) and sends a request, and the owner sees it on the dashboard and
marks it contacted. It runs against the production build, so the CSP, cookies and prerendering are the
real ones, and in CI against a throwaway Postgres container. Each run uses a random business address, so
it never collides with existing data.

Trade-off: only the main flow is tested in the browser. Every rule (pricing, validation, status
transitions, rate limits) is already covered by fast unit and repository tests; browser tests are slow
and flaky by nature, so they check that the pieces are wired together, not every branch.

### Rate limiting in Postgres
Sign-in (per IP and per email), sign-up (per IP) and lead submission (per IP) are limited with a
fixed window counter in the `rate_limits` table. One atomic upsert per attempt, so parallel requests
cannot both pass. Postgres instead of in-memory counters, because serverless instances do not share
memory; instead of Redis, because the app already has a database and the traffic is small.
The check runs before scrypt, so blocked attempts are cheap. IPs and emails are stored as SHA-256 hashes.

Trade-offs: a fixed window lets up to twice the limit through around a window edge; the per-email
limit lets anyone lock an account's sign-in for 15 minutes; the client IP comes from `x-forwarded-for`,
which is trustworthy only behind a proxy that sets it (Vercel does).

### Telegram is connected with a one-time deep link
The owner never types a chat ID. "Connect Telegram" creates a one-time token (stored hashed, valid for
10 minutes) and shows a `t.me/<bot>?start=<token>` link plus a QR code for owners without Telegram on
the computer. Pressing Start sends `/start <token>` to the bot, and the chat that sent it is linked.
Only the owner sees the token, so nobody can point the bot (and customer-written lead text) at someone
else's chat. Messages are plain text with no `parse_mode`, so lead text cannot inject markup.

In production Telegram delivers `/start` to a webhook, `/api/telegram/webhook`. Telegram sends the
secret registered with `setWebhook` in the `X-Telegram-Bot-Api-Secret-Token` header; the route compares
it in constant time and rejects any other caller, so nobody can fake a `/start` from someone else's
chat. The route answers 200 to updates it does not care about, because any other status makes Telegram
retry them. Without `TELEGRAM_WEBHOOK_SECRET` (local development has no public URL) the dashboard falls
back to polling `getUpdates`. Both paths parse the update and call the same linking code; only the
delivery differs.

Trade-off: the dashboard still polls its own server every few seconds while a link is pending, to
notice that the webhook has connected the chat. A push channel (Server-Sent Events) would be instant,
but a pending link lasts at most 10 minutes and each poll is a couple of primary-key lookups.

### Expired rows are purged by a daily job
Expired sessions, unused Telegram link tokens and finished rate limit windows are deleted once a day by
Vercel Cron calling `/api/cron/purge`. Without it the tables only grow: an expired session is removed
only if someone presents it, and every email tried at sign-in leaves a `rate_limits` row. The job runs
outside user requests, so sign-in never pays for cleanup. The route accepts only
`Authorization: Bearer $CRON_SECRET` (compared in constant time) and stays closed when the secret is
not set. A rate limit row does not store its policy, so it is kept until the longest window (1 hour)
has ended; deleting it earlier could reset a live counter.

Trade-off: no index on the timestamp columns. The tables stay small once they are purged daily, and
an index on `rate_limits.window_start` would slow down every rate-limited request to speed up one
query a day.

### Security headers on every response
`next.config.ts` sends a Content Security Policy, HSTS, `X-Frame-Options: DENY`,
`X-Content-Type-Options: nosniff`, a strict `Referrer-Policy` and a `Permissions-Policy`, and drops
`X-Powered-By`. The CSP allows scripts, styles, requests and form posts only to this site, forbids
plugins and `<base>` changes, and blocks framing (`frame-ancestors 'none'`), so the calculator cannot
be embedded for clickjacking. The QR code is a `data:` image, which `img-src` allows.

Trade-off: `script-src` includes `'unsafe-inline'`, because Next.js inlines its hydration data. The
strict alternative, a per-request nonce, makes every page fully dynamic and switches off the
prerendered shells of Cache Components. So the CSP here limits where code can come from, and XSS
protection itself relies on React escaping all output (the app never uses `dangerouslySetInnerHTML`).
HSTS is sent without `preload`: preloading is hard to undo and should wait for a real domain.

### One design system, as Tailwind tokens
The mockups in `design/` define a small system: paper and ink colors, one accent for actions and
totals, status colors, a serif for headings and prices and Inter for the interface. In code these are
Tailwind theme tokens in `globals.css` (`bg-paper`, `text-muted`, `bg-accent`, ...), and shared
input and button styles live in `src/components`. Pages use the tokens, never raw palette colors, so
a color change is one line. Headings use Literata instead of the mockup's first choice, Fraunces,
because Fraunces has no Cyrillic and business and customer names are usually written in Ukrainian.

Motion follows the same idea: one easing curve, three durations (150, 240 and 400 ms) and a few named
animations in the theme (`animate-rise`, `animate-pop`, `animate-shake`, `animate-draw`). The total
in the calculator counts to the new price instead of jumping, so the customer sees that their change
moved it; every frame is a whole number of kopiykas, and screen readers hear only the final price.
Under `prefers-reduced-motion` everything appears instantly.

Trade-off: the app is light-only for now. The old dark variant was a set of generic grays; a real dark
theme needs its own designed palette, and the tokens make it a matter of adding values, not editing
pages.

## Known limitations

- **Sign-up reveals whether an email is registered.** Sign-in hides it (same message, same timing),
  but sign-up has to tell the user the email is taken. Rate limiting (5 sign-ups per hour per IP) slows
  down enumeration but does not stop it. The proper fix is email verification: sign-up always answers
  "check your inbox", and an existing owner gets a "someone tried to register" email instead.
- **Options cannot be edited in place**; to change an option's price, remove it and add it again.
