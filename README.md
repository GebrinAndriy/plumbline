# Plumbline

Instant price quotes and lead management for small service businesses: blinds, cleaning, repairs.

A customer opens the business's public calculator, enters sizes or hours, sees the price immediately
and sends a request. The owner gets the request on the dashboard and in Telegram, then moves it through
`new → contacted → quoted → won / lost`.

**Live demo:** https://plumblinebusiness.vercel.app. The seeded calculator is at
[/b/demo](https://plumblinebusiness.vercel.app/b/demo); sign up to get a dashboard of your own.

## Features

- **Public calculator** at `/b/<slug>`: three pricing models (per m², per hour, fixed per item), minimum
  order, flat and percentage surcharges. The price is recalculated on the server before a lead is saved.
  The page shows the business's phone (a tap-to-call link) and address (with a map link).
- **Leads**: duplicate submits are ignored (idempotency key), and each lead keeps a snapshot of the quote
  the customer saw.
- **Dashboard**: requests 50 per page, a search by name or phone, and status changes; every change is
  recorded, and two tabs cannot overwrite each other's change.
- **Services**: owners add and edit services and hide or show them in the calculator. Editing a price
  changes only new requests; earlier leads keep the quote they were sent with.
- **Options**: each service can have up to 10 paid options (a fixed amount or a percent of the price),
  added and removed from the dashboard; customers tick them in the calculator.
- **Contacts**: owners set the phone and address shown on their page from the dashboard.
- **Telegram notifications**: every request arrives with the sizes, options, total and a link to it on the
  dashboard. "Connect Telegram" with a one-time link or QR code, no chat ID to copy.
- **Accounts**: sign-up, sign-in and sign-out with database sessions, password reset by email; rate
  limiting on every public form.

## Tech stack

Next.js 16 (App Router, Server Actions, Cache Components) · TypeScript · PostgreSQL (Neon) with
Drizzle ORM · Zod · Tailwind CSS · Phosphor Icons · Vercel Blob · Vitest with PGlite · GitHub Actions.

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

### Money in integer cents
Prices and totals are integers in minor units, never floats: `0.1 + 0.2` problems cannot appear in a
bill. Form input such as `1,200.50` (or `12,50` with a decimal comma) is parsed into cents without going
through a float.

### One market, set in one file
Plumbline targets small service businesses in Ireland: English interface, prices in euro, Irish mobile
numbers. The locale (`en-IE`), currency (`EUR`) and time zone (`Europe/Dublin`) live in
`src/lib/market.ts`, and every price, number and date is formatted through it, so moving to another
euro country is a one-line change plus the phone format. The currency is not stored with each price:
an account has one currency, and a per-business currency would add a column and conversions nobody
needs yet. The symbol is the narrow one (`€`), because Node and browsers ship different ICU data and a
different symbol on the server would break hydration.

### Pricing models as strategies
Each pricing kind (per area, per hour, fixed) is a strategy behind one interface, and the rule is stored
as a discriminated union in a `jsonb` column. A new pricing model is a new strategy, not a new branch in
every function.

Options (surcharges) live in a `jsonb` array on the service. Adding or removing one is a single
`UPDATE` that changes the array in place (`surcharges || new_option`, or rebuilding it without one id),
not read, modify and write back, so two tabs editing options at once cannot overwrite each other. The
10-option limit is part of the same `UPDATE`, so it cannot be bypassed by parallel requests either.

### Choice groups: one pick per group
Options are ticked independently, which cannot describe "Basic, Blackout or Linen fabric". A choice
group (`services.choices`, `jsonb`) holds options the customer picks exactly one of, rendered as radio
buttons named `choice.<group id>`, so a plain form post carries the picks. Each option either adds to
the rate (€ per m², per hour or per item) or adds once; zero means "included". Strategies now expose
`units()` (m², billable hours, items), so a per-rate choice is `units × amount` for every pricing kind
without a branch per kind.

The order is fixed and tested: base price, then one line per group (a free pick is still a line, so
the receipt, Telegram and the lead record what was chosen), then percent options on that subtotal, so
"Urgent +10%" costs more with a dearer fabric. A quote without a pick in every group is refused, and
the first option is preselected so the price appears as soon as the size is in. Options carry an
optional `imageUrl` for a photo.

An option's photo is uploaded from the dashboard and shown on the customer's card: once one option in
a group has a photo, the whole group becomes a grid of photo cards, so options line up whether or not
each has one. Logos and option photos share `src/domain/catalog/image-file.ts` (type read from the
first bytes, 1 MB limit) and one `ImageStorage` behind Vercel Blob, under `logos/` and
`choices/<business>/<option>`. The photo sits deep inside the `choices` jsonb, so `setChoiceImage`
locks the service row (`SELECT … FOR UPDATE`), changes it in code and writes it back in one
transaction, and returns the photo it replaced so the old file is deleted. Removing a group returns its
photos too, so no file is left behind in the store.

A group is edited in place with the same form used to add it. Each option posts its id, so an edited
option keeps its photo; `updateChoiceGroup` locks the service row, carries photos over only from the
same option of the same group (never from the form), and returns the photos of options that were
dropped, which are then deleted from storage. Old leads are untouched: they keep the labels and prices
the customer saw.

Trade-off: the minimum price applies to the base line only.

### Several items in one request
A customer measuring four windows sends one request, not four. The form edits one item at a time;
"Add another item" moves it to a list above, where it can be edited or removed, and the receipt adds
up every item. The open item is sent too unless it was left untouched. The items travel as one JSON
field, each checked by the same Zod schema as before, and the server prices each against its own
service; an error in an item already in the list is reported by its number, because its fields are no
longer on screen.

A lead stores its items in `leads.items` (`jsonb`). This is an expand step: the old `service_id`,
`input` and `quote` columns are still written (the first item, and every line in the quote), so a
deployment that predates the column keeps rendering leads while the new one rolls out, and leads
saved before the column are read as one item from those columns. Dropping them is a later change.

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
(`210 × 160 cm = 3.36 m² × €50 = €168`, or why a minimum applied). A customer who can check
the price trusts it, and the owner gets fewer "why so much?" calls. The explanation is a pure function
in `src/lib`, tested with the same numbers as the pricing rules. Whole prices are shown without
cents (`€3,860`), partial ones with them (`€1,348.54`).

If the owner removes an option while a customer has it ticked, the server refuses the request (it
never prices from the browser) and reloads the service. The form then shows the option as no longer
available, drops it from the total and asks the customer to check the new price and send again,
instead of failing with a generic error.

### Landing prices come from the pricing engine
The landing page shows the same calculator a customer would see, with three examples to switch
between (per m², per hour, fixed price) and the Telegram message the owner would get. Its prices are
not typed into the markup: each example is a real service passed through `calculateQuote`, and a unit
test pins the totals. If the pricing rules change, the landing changes with them or the test fails,
so the marketing page cannot promise a price the product would not give.

### Lead status as a state machine
Allowed transitions live in one table in the domain. A status change is saved with compare-and-set
(`where status = from`), so two tabs cannot both apply a change; the second one gets a conflict message
and the latest status. Won and lost are closed but not final: a won lead can go back to quoted
(a mis-click or a cancelled job) and a lost one back to contacted, so no click is irreversible. The
dashboard totals follow the current status, so reopening a won lead takes it out of the won value.
Each change is also written to `lead_status_changes` as an audit log. Nothing in
the app reads it yet, so leads are loaded without their history, and there is no note field until a
screen asks for one.

### Each request has its own page
`/dashboard/leads/[id]` shows one request: contacts with Call and WhatsApp buttons, the customer's
comment, the quoted receipt, the status control and the status history from `lead_status_changes`.
Telegram messages link here, so a request opens wherever it sits in the list. The lead is looked up by
id and business together, so another owner's id gives the same 404 as a missing one and a link cannot
reveal that a request exists. WhatsApp needs the international number, so national numbers are
rewritten with the calling code from `MARKET`, and the chat opens with a greeting that names the
service and the quoted price.

The page also holds the owner's notes ("call back on Thursday", "measure on Saturday"), in their own
`lead_notes` table rather than a text column on the lead: each note keeps its time, one can be
deleted without rewriting the others, and the list grows without a size limit on one row. Adding
checks the lead belongs to the owner's business first, and deleting is scoped by business in the same
`DELETE`, so a guessed note id of another owner removes nothing.

A request can carry a follow-up day ("call back on Thursday"), set on its page with a date field or
the Tomorrow and Next week shortcuts; the list shows "Call back today", "Overdue · Tue 25 Nov" or the
day, and hides it once the request is won or lost. It is a `date` column, not a timestamp, because
the owner means a day, not an hour. "Today" is taken in Dublin (`MARKET.timeZone`), not on the server,
which runs in UTC on Vercel: in summer the two disagree for an hour each night. Once today is known,
ISO days compare as text, so the domain needs no time zone code at all.

Trade-off: messages sent before this change still link to `/dashboard#lead-<id>`, which finds the
request only on the first page of the list.

### Removing an option asks first
Removing a paid option changes the price customers see, and there is no undo. The × button turns into
an inline "Remove? / Keep" pair instead of a browser `confirm()` dialog: it matches the design, does
not block the page, and keyboard users land on "Keep", with Escape to cancel. Reversible actions, like
status changes, stay one click.

### Dashboard numbers come from one grouped query
The dashboard shows how many requests are new, in progress and won, and what the won jobs are worth.
These come from a single `GROUP BY status` with `count` and `sum` over the stored totals, not from
the page of leads on screen, so they stay right when there are more requests than one page holds.
The same counts label the status filter (`?status=quoted`); an unknown value in the address falls back
to all requests instead of an error. Each request shows the size and options the customer chose,
so the owner can call back already knowing the job.

### Search and pages live in the address
The status filter, the search and the page are query parameters (`?status=quoted&q=087&page=2`), read
through one Zod schema that falls back to the first page of all requests for anything odd. A link can
be bookmarked or shared, Back works, and the search is a plain GET form that works without JavaScript
(`next/form` adds client-side navigation on top). Changing the filter or the search starts again at
page 1.

- **Search** matches part of the customer's name (`ilike`) or, when the query looks like a phone, part
  of the stored number. A national `087 123 4567` matches the stored `+353871234567`, because the
  digits are compared without leading zeros. `%` and `_` are escaped, so they match literally.
- **Pages** use `limit`/`offset`, ordered by creation time with the id as a tie-break, so a page
  boundary never repeats or skips a request. One extra row is fetched to know whether an older page
  exists, instead of counting every match. Trade-off: a request that arrives while the owner is on
  page 2 shifts the list by one. Keyset pagination (`created_at < cursor`) avoids that and stays fast
  on deep pages, but gives no page numbers and needs a second query shape for "newer"; for one
  business's requests offset is simpler and fast enough. Search is a sequential scan within one
  business; a `pg_trgm` index is the next step if a business gets tens of thousands of requests.
- The status counts stay the totals of all requests, so a search never hides how many are waiting.

### The services form shows what a customer would pay
While the owner types a price, the form quotes a typical order (200 × 150 cm, 3 hours or 2 items)
and writes out the arithmetic, including when the minimum order kicks in. It reads the half-filled
form through the same Zod schema the server uses and prices it with `calculateQuote`, so the example
is exactly what the calculator will charge. A price typo shows up as a strange total before it reaches
a customer.

### The page address is suggested from the business name
A page address has to be plain latin, and business names often are not. While the owner types
"Ó Briain Blinds", the address field fills in `o-briain-blinds`: accents are dropped through Unicode
normalization (NFKD), and the few letters without a base form (`ß`, `ø`, `æ`, `ł`) are spelled out.
The owner can edit it by hand. The same Zod schema the server uses checks the
address as they type and shows the final link, so a bad address is caught before the request. Whether
the address is free is still decided by the server, because only the database knows.

### Shared links show the business and its prices
Owners share their page in Instagram, WhatsApp, Telegram and Viber, so the link preview is the first
thing a customer sees. Each `/b/<slug>` page sets its own title ("Ó Briain Blinds · Instant prices")
and a description with up to three headline prices, and `opengraph-image.tsx` draws a 1200×630 card
with the same prices through `next/og`. Both come from the services in the database, so the preview
changes with the prices. The page and its metadata share one lookup per request through React
`cache()`.

Next.js streams metadata to most clients and puts it in `<head>` only for bots that cannot run
JavaScript. Its list includes Facebook (Instagram uses it) and WhatsApp but not Telegram or Viber, so
`htmlLimitedBots` in `next.config.ts` extends it. `metadataBase` comes from `APP_URL`, because image
links must be absolute and Vercel's own production URL can still be the project's first address.

### Business contacts as two optional columns
The phone and address are nullable columns on `businesses`, not a separate table: a business has one
of each, and both are read with the business on every page view. The address is free text, one line per
row, because Irish addresses vary (Eircode, townland, county) and customers only read it or open it on
the map; nothing in the app searches by it. The phone goes through the same Zod schema as customer
phones, so both are stored without spaces and shown in one format.

The logo is the third part of the page header; see "Logos in Vercel Blob".

On phones the contacts shrink to one row of two buttons, Call and Map, and the address opens under
Map. The full block took half of the first screen, so a customer had to scroll before seeing the
service picker. The icons come from Phosphor, imported one file per icon so the bundle carries only
the four in use.

### Each business picks its accent colour
The owner picks a brand colour in the dashboard, from nine presets, the colour picker or a hex code.
The public page sets `--color-accent`, `--color-accent-hover` and `--color-accent-soft` inline on its
wrapper, so every `bg-accent` and `text-accent` inside follows without new classes; the hover and tint
are mixed from the one colour in `src/domain/catalog/accent-color.ts`. The link-preview image uses it
too. The dashboard and the "Made with Plumbline" footer keep the Plumbline orange.

The accent is used as text on the page and behind white button text, so a colour below 4.5:1 against
the page background is refused, in the form as you type and again by the Zod schema in the action.
Many brand colours (yellow, lime, sky blue) fail that, so instead of a bare error the form offers the
closest readable shade: the same hue darkened in 5% steps. Choosing the default stores `null`, so a
business that never picked a colour follows a future change of the Plumbline accent.

Trade-off: the colour is not checked against text in a colour other than white on the accent, because
the design has none. A business that wants a light brand colour gets the darker shade, not its exact
brand colour.

### Logos in Vercel Blob
Functions on Vercel have no lasting disk, so the logo file goes to a public Vercel Blob store and the
database keeps only its URL (`businesses.logo_url`). The upload is a Server Action: the file passes
through our server, which checks it before anything is stored. Uploading straight from the browser
(client upload) would skip the 4.5 MB function limit, but needs a token route and is only worth it for
large files; a logo is capped at 1 MB, so the Server Action body limit is raised to 2 MB in
`next.config.ts` to leave room for the multipart overhead.

The type is read from the first bytes of the file (PNG, JPEG or WebP), not from its name or the
browser's `Content-Type`, which the sender controls. SVG is refused on purpose: it can carry scripts.
`replaceLogo` in `src/domain/catalog/logo.ts` uploads the new file, saves its URL, then deletes the old
file; if saving fails it deletes the new upload, so a failed save leaves neither an orphan file nor a
broken link. Storage sits behind a `LogoStorage` interface, so the unit tests use an in-memory fake.

Every upload gets a random suffix and a one-year cache, so a replaced logo can never be served from a
stale CDN copy. The page shows it through `next/image`, which resizes it and serves WebP from this site,
so the CSP needs no new image host; `remotePatterns` allows only `/logos/**` on Vercel Blob hosts. The
logo has an empty `alt`, because the business name follows in the heading.

Trade-off: the link-preview image does not show the logo yet, since Satori cannot draw WebP. Without
`BLOB_READ_WRITE_TOKEN` the dashboard says uploads are not set up instead of failing.

### Own pages for missing addresses and errors
A customer who follows an old or mistyped link lands on `app/not-found.tsx` instead of Next's default
page. It serves unknown URLs and every `notFound()` call, such as a business address that no longer
exists, and offers the home page and the demo. A missing business is checked in `generateMetadata`
too, so link-preview bots, which wait for metadata, get a real 404; browsers get the page shell
first, so their status stays 200 with a `noindex` tag. `app/error.tsx` catches errors thrown while rendering any
page under the root layout and offers "Try again", which re-fetches the failed part through `retry()`.
In production the browser receives only the error's digest, never its message, so the page shows that
reference and the details stay in the server logs.

Trade-off: there is no `global-error.tsx`. It would only catch errors in the root layout itself, which
reads no data, and it must ship its own `<html>`, styles and fonts.

### Database sessions instead of JWT
The cookie holds a random token, and the database stores only its SHA-256 hash. Sign-out and revoking
a session work immediately, and a leaked table cannot be replayed. The session is replaced on every
sign-in. Passwords are hashed with scrypt.

### Password reset with a one-time email link
"Forgot password?" emails a link that works once, for 30 minutes. As with sessions, the database keeps
only the SHA-256 of the token, one row per user (a new request replaces the earlier link), and the link
is spent with a single `DELETE … RETURNING`, so two tabs cannot both use it. Setting the new password
also deletes every session of that user in the same transaction: whoever had the old password is
signed out everywhere, and the owner is signed in on this device.

The form gives the same answer whether or not the email has an account, and the email goes out in
`after()`, once the response is sent, so the response time does not reveal it either. Requests are
limited per IP and per email (3 an hour), so the form cannot be used to flood someone's inbox.
Emails are sent through the Resend HTTP API with `fetch`, without an SDK. Without `RESEND_API_KEY` in
development the email is printed to the server log; in production it is never logged, because the
link signs the owner in. Links are built from `APP_URL`, not from the request's `Host` header, which
an attacker could forge to get a reset link pointing at their own site.

Trade-off: the reset page does not check the token before showing the form. An expired link is
reported after the owner submits a new password, which saves a query on every page view.

### Notifications as listeners
Creating a lead publishes a `lead.created` event; Telegram is one listener. It runs after the response
is sent (`after()`), so a slow Telegram never delays the customer, and one failing listener does not
stop the others.

The message carries everything the owner needs to call back without opening the app: the customer's name
and phone, the sizes or hours, the chosen options, the total and the comment, as plain text so customer
input cannot inject Telegram markup. It ends with a link to `/dashboard#lead-<id>`, which scrolls to
that request and highlights it. In production the link is built from `APP_URL`, never from the request's
Host header. Trade-off: there is no page per request yet, so the link only finds requests on the
dashboard's first page (without a filter), which is where a new one always is.

### Tests against real Postgres without Docker
Repository tests run the real migrations on PGlite (Postgres compiled to WASM), so SQL, constraints and
upserts are tested without a database server or secrets in CI.

### One end-to-end test for the main flow
A single Playwright test walks the path that makes the product useful: an owner signs up, adds a service
priced by area with a paid option, a customer in a separate browser context gets the price (2 m² at
€50/m² plus €30 installation) and sends a request, and the owner sees it on the dashboard and
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
Expired sessions, password reset links, unused Telegram link tokens and finished rate limit windows are deleted once a day by
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
a color change is one line. Headings use Literata instead of the mockup's first choice, Fraunces:
it covers Cyrillic and Greek as well as accented latin, so any customer name renders in one font.

Motion follows the same idea: one easing curve, three durations (150, 240 and 400 ms) and a few named
animations in the theme (`animate-rise`, `animate-pop`, `animate-shake`, `animate-draw`). The total
in the calculator counts to the new price instead of jumping, so the customer sees that their change
moved it; every frame is a whole number of cents, and screen readers hear only the final price.
Under `prefers-reduced-motion` everything appears instantly.

Accessibility is checked against the tokens, not page by page. Field borders use their own
`--color-control` (at least 3:1 on every background, WCAG 1.4.11); the lighter `--color-rule` stays
for cards and dividers, which are decoration. `design-tokens.test.ts` reads `globals.css` and fails if
a token edit breaks either ratio or the 4.5:1 for text. Every tap target is at least 44 × 44 px on a
phone: compact links and buttons get a `tap-target` utility that grows an invisible `::after` around
them, so the hit area grows while the layout stays as designed. Where an ancestor clips overflow (the
scrolling status tabs, the quantity stepper) or the grown area would cover a neighbour ("Forgot
password?" under the password field), the element itself is 44 px instead. Links inside a
sentence keep their text size; WCAG exempts them.

Dropdowns stay native `<select>` elements, styled with customizable select (`appearance:
base-select`): the open list uses the tokens, rows are 44 px with a tick on the chosen one, and the
arrow turns when it opens. A custom listbox in JavaScript was the alternative, but the native element
already handles arrow keys, type-ahead, Escape, screen readers, form posts and the phone's own
picker, all of which a hand-written one has to rebuild. Browsers without support (Safari and Firefox
for now) keep their own list, still inside our styled field. A long label cannot be cut with an
ellipsis there without `<selectedcontent>` markup, so labels are kept short instead.

The dark theme follows the system setting (`prefers-color-scheme`). It redefines every color token in
one block of `globals.css`: a warm near-black paper with paper-white ink instead of generic grays, so
it reads as the same brand. Two tokens made it possible without touching layouts: `field` replaced the
hardcoded white of inputs and cards, and `on-accent` the white text on filled buttons, which turns dark
on the lighter dark-mode accent. Dark bands and the phone mockup use `band`, which stays dark in both
themes. The token test runs every contrast pair for both themes and fails if a dark value is missing.

A business's own colour gets a dark-mode shade too: `darkAccentPalette` lightens the same hue until it
reads on the dark page, and the `.brand-accent` rule switches between the two sets that `accentProps`
puts inline. Logos are drawn for light paper, so a business logo sits on a white card in dark mode; the
Plumbline logo is inverted and hue-rotated back, which turns its lettering white and keeps the plumb
bob orange. The Telegram QR code keeps its white background so cameras can read it.

Trade-off: there is no manual light/dark switch. It needs a stored preference and a script before the
first paint to avoid a flash, so it is a separate change.

## Known limitations

- **Sign-up reveals whether an email is registered.** Sign-in hides it (same message, same timing),
  but sign-up has to tell the user the email is taken. Rate limiting (5 sign-ups per hour per IP) slows
  down enumeration but does not stop it. The proper fix is email verification: sign-up always answers
  "check your inbox", and an existing owner gets a "someone tried to register" email instead.
- **Options cannot be edited in place**; to change an option's price, remove it and add it again.
