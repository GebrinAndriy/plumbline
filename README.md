# QuoteFlow

Instant price quotes and lead management for small service businesses: blinds, cleaning, repairs.

A customer opens the business's public calculator, enters sizes or hours, sees the price immediately
and sends a request. The owner gets the request on the dashboard and in Telegram, then moves it through
`new → contacted → quoted → won / lost`.

## Features

- **Public calculator** at `/b/<slug>`: three pricing models (per m², per hour, fixed per item), minimum
  order, flat and percentage surcharges. The price is recalculated on the server before a lead is saved.
- **Leads**: duplicate submits are ignored (idempotency key), and each lead keeps a snapshot of the quote
  the customer saw.
- **Dashboard**: recent requests and status changes; every change is recorded, and two tabs cannot
  overwrite each other's change.
- **Services**: owners add services and hide or show them in the calculator.
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
| `npm run lint` / `npm run typecheck` | ESLint and TypeScript |
| `npm run build` | Production build |
| `npm run db:generate` | New migration from `src/db/schema.ts` |

CI runs lint, typecheck, tests and build on every pull request.

## Project structure

```
src/
  domain/   Pure TypeScript business logic: pricing, leads, auth, rate limits, Telegram linking.
            No Next.js, no database, no fetch. Covered by unit tests.
  db/       Drizzle schema and repositories that implement the domain interfaces.
  lib/      Server glue: sessions, password hashing, Telegram API, rate limiter, formatting.
  app/      Routes, Server Actions and components. Input is validated with Zod here.
drizzle/    SQL migrations.
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

### The server recalculates every price
The calculator shows a preview, but the lead is saved with a quote calculated on the server from the
stored service, so a changed request body cannot set its own price. The quote is stored as a snapshot,
so later price changes do not rewrite old leads.

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

Trade-off: there is no public URL yet, so the dashboard polls and the server reads `/start` messages with
`getUpdates` instead of a webhook. Telegram keeps at most 100 unread updates for 24 hours, which is fine
for a few owners; after deploy, a webhook replaces only the delivery, the domain logic stays the same.

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

## Known limitations

- **Sign-up reveals whether an email is registered.** Sign-in hides it (same message, same timing),
  but sign-up has to tell the user the email is taken. Rate limiting (5 sign-ups per hour per IP) slows
  down enumeration but does not stop it. The proper fix is email verification: sign-up always answers
  "check your inbox", and an existing owner gets a "someone tried to register" email instead.
- **Telegram uses `getUpdates` polling** because there is no public URL yet; a webhook replaces it
  after deploy.
- **Services cannot be edited yet**, and surcharges can only be added through the seed script.
