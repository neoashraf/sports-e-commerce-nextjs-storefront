# Sports E-Commerce - Customer Storefront

Customer-facing storefront for a Bangladesh sports e-commerce platform (football and
cricket boots, jerseys, turf and futsal shoes, accessories). Shoppers browse and search
the catalog, buy as a guest or with an account, pay by Cash on Delivery, bKash or
SSLCommerz, track orders, request exchanges and contact support.

This is the frontend only. It consumes the REST API of
[e-commerce-nestjs-backend](https://github.com/neoashraf/e-commerce-nestjs-backend), which
owns all data, business rules and authorization. The staff side is
[e-commerce-nextjs-admin-panel](https://github.com/neoashraf/e-commerce-nextjs-admin-panel).

## Status

Built for a fixed-scope delivery with a target date of 20 June 2026; the repo carries a
`20-06-26` tag on that date. Work continued after delivery, including customer two-factor
login (MFA) and fixes; the latest commit on `main` is from September 2026.

Known gaps, as the code stands:

- The footer newsletter field is a client-only stub. It shows a success message and makes
  no network call.
- The home page uses CMS images when the backend provides them. The static fallback
  photos are not committed (every slot in `src/components/home/home-assets.ts` is `null`),
  so without CMS images those blocks render as colour tints.
- Invoice seller details fall back to placeholder values (including BIN
  `000000000-0000`) unless the `NEXT_PUBLIC_SELLER_*` variables are set.
- `.env.production` still points at `localhost` (marked TODO in the file). Deployed builds
  get their URLs from the server's env file (see CI/CD).
- `next.config.mjs` has an empty `images.remotePatterns` list.

## Stack

Versions as declared in `package.json`.

| Concern | Choice |
| --- | --- |
| Framework | Next.js 14.2.15 (App Router), React ^18.3.1 |
| Language | TypeScript ^5.6.3 (strict) |
| Styling | Tailwind CSS ^3.4.13, lucide-react ^1.17.0 icons |
| Server state | @tanstack/react-query ^5.59.0 |
| Client state | zustand ^4.5.5 |
| Forms | react-hook-form ^7.53.0, @hookform/resolvers ^3.9.0 |
| Validation | zod ^3.23.8 (forms and API responses) |
| Tests | vitest ^2.1.9, @testing-library/react ^16.3.2, jsdom ^25.0.1 |
| Lint | eslint ^8.57.1 with eslint-config-next 14.2.15 |
| Package manager | pnpm 10.15.0; Node 20 in CI and Docker |

## Screens by module

Module codes follow the project SRS.

| Module | Routes | Notes |
| --- | --- | --- |
| Home (CMS, CAT) | `/` | Hero and banners from `/content/homepage`, featured, new and best-selling rails, category tiles |
| Catalog and search (CAT, SRCH) | `/c/[category-slug]`, `/search`, `/p/[slug]` | Faceted filters, sort and pagination in the URL; autosuggest search box; product page with gallery, variant and size selection, size guide, video, notify-me |
| Cart and checkout (CART, PAY) | `/cart`, `/checkout`, `/checkout/result` | Guest or customer cart, mini-cart drawer, coupons; COD, bKash and SSLCommerz; the result page polls the payment status from the API |
| Orders (ORD) | `/orders/[orderNo]/confirmation`, `/orders/[orderNo]/invoice`, `/track`, `/account/orders`, `/account/orders/[orderNo]`, `/account/orders/[orderNo]/exchange`, `/account/orders/[orderNo]/exchange/[exchangeId]` | Order history and detail, status tracker, cancellation, printable invoice, order tracking, exchange requests |
| Account (AUTH, MFA) | `/account`, `/account/settings`, `/account/addresses`, `/reset-password`, `/verify-email` | Sign-in is a global overlay, not a route: phone OTP, email login and registration, Google sign-in, password reset request and a 2FA step. Settings cover profile, email, phone, password, 2FA, communication preferences and account deletion |
| Wishlist (WISH) | `/wishlist` | Works for guests (stored locally) and merges into the account on login |
| Leads (LEAD) | `/help`, `/pages/contact`, `/account/enquiries`, `/account/enquiries/[reference]` | Get Help form with optional Cloudflare Turnstile, enquiry threads for signed-in customers |
| Content (CMS) | `/pages/[slug]`, `/pages/privacy-policy`, `/pages/terms-and-conditions` | CMS pages rendered from sanitized HTML; privacy and terms are static |

## State model

- **Server state: TanStack Query.** Hooks live in `src/lib/api/hooks/` (15 files). Every
  response is parsed with a Zod schema from `src/lib/api/schemas/` (11 files) before it
  reaches a component.
- **Session and client-only state: Zustand** (`src/lib/stores/`, 7 stores).
  - `auth`: tokens and the signed-in customer, persisted to localStorage.
  - `cart`: the latest server cart, badge count and drawer state. Only the guest
    `X-Cart-Token` is persisted; the cart itself is re-fetched.
  - `wishlist`: guest wishlist items, persisted until login merges them.
  - `recent-searches`: persisted.
  - `auth-ui`, `toast`, `dev-otp`: UI state only. `dev-otp` shows the OTP the backend
    echoes in development.
- **Filters: URL `searchParams`.** The listing's filters, sort and page are parsed from
  and written to the URL (`src/lib/listing/url-state.ts`), so results are shareable.
- **Forms: React Hook Form + zod**, used in 7 forms: address, profile, password, email
  login, email registration, reset request and new password. API field errors are mapped
  onto form fields by `src/lib/api/form-errors.ts`.

## Design

- **Where the designs live.** The screen designs, design system and screen specs are in
  `docs/design/` of the private `e-commerce-workspace` repository. They were developed in
  Claude Design and pulled into the workspace through MCP.
- **Theme.** The design system is "SportsVault": an ink and white canvas with volt
  (`#C8FF00`) and cyan (`#00E5FF`) accents. Fonts are Inter and Hind Siliguri (Bangla),
  loaded from Google Fonts.
- **How the tokens are set up.** The tokens are copied into this repo, not imported from a
  shared package:
  - `tailwind.config.ts` maps them to Tailwind colours.
  - `src/app/globals.css` defines them as CSS variables.
  - Both files name their source: `docs/design/design-files/tokens/*.css`.
- **Not shared with the admin panel.** The admin panel has its own, unrelated theme.

## Architecture

```text
src/
  app/                  routes (App Router); page.tsx files are thin and render a view
    layout.tsx          QueryProvider, Header, Footer, AppChrome, site metadata
  components/
    AppChrome.tsx       global overlays: AuthSheet, MiniCartDrawer, toasts, DevOtpBanner,
                        GuestSessionSync (merges guest cart and wishlist on login)
    <domain>/           account, auth, cart, catalog, cms, filter, home, leads, listing,
                        orders, pdp, search, shell, wishlist
    ui/                 shared primitives (Button, Sheet, ConfirmDialog, fields, ...)
  lib/
    api/client.ts       typed fetch wrapper: Bearer token, one refresh-and-retry on 401
    api/errors.ts       ApiError for the backend error envelope
    api.ts              auth, me and address endpoints as named methods
    api/hooks/          TanStack Query hooks per domain
    api/schemas/        Zod schemas per domain
    stores/             Zustand stores
    env.ts              validated public env access (throws if NEXT_PUBLIC_API_URL is missing)
```

- **Rendering.** Most route files are Server Components that set metadata and render a
  client view from `src/components/<domain>/`. The account home, settings and addresses
  pages are Client Components. All `/account/*` routes sit behind `AccountGuard`.
- **API access.** Nothing calls `fetch` directly; everything goes through
  `src/lib/api/client.ts`.
- **Indexing.** The storefront is public and indexable.
- **Auth tokens.** Tokens are kept in localStorage. `src/lib/stores/auth.ts` notes the XSS
  tradeoff of this choice.

## Testing

| Kind | Files | Tests | Command |
| --- | --- | --- | --- |
| Component (Vitest + React Testing Library, jsdom) | 15 | 48 | `pnpm test` |

- **Watch mode:** `pnpm test:watch`.
- **Location:** tests sit next to the code they cover (`*.test.tsx` under `src/`).
- **Setup:** `vitest.setup.ts` loads jest-dom and sets a default `NEXT_PUBLIC_API_URL`.
- **Not covered:** there are no unit-only or end-to-end tests in this repo.

## CI/CD

`.github/workflows/ci-cd.yml` runs on every push to `main` or `dev`, and on manual
dispatch. Pushes to other branches and pull requests do not trigger it.

| Job | When | Runs on | What it does |
| --- | --- | --- | --- |
| Lint, typecheck & test | every run | `ubuntu-latest` | `pnpm install --frozen-lockfile`, `pnpm lint`, `pnpm typecheck`, `pnpm test` |
| Deploy to Home Server | push to `dev` | self-hosted runner `sports-ecommerce-home` | copies the server's `.env`, `docker compose up -d --build`, waits for `http://localhost:6003/` |
| Deploy to Hostinger VPS | push to `main` | self-hosted runner `sports-ecommerce-hostinger` | same steps on the VPS |

`docker compose` passes `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_SITE_URL` from that env
file as build arguments. The image is a standalone Next.js build on `node:20-alpine`,
published on host port 6003.

## Getting started

```bash
pnpm install
pnpm dev                     # http://localhost:3000
```

`pnpm dev` loads `.env.development`, which points at the team's shared backend on the
office LAN. To use your own backend, create `.env.local`:

```ini
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

(8000 is the backend's default port.) See `.env.example` for every variable.

To run the production image locally:

```bash
docker compose up --build    # http://localhost:6003
```

## Scripts

| Script | Command |
| --- | --- |
| `pnpm dev` | `next dev` |
| `pnpm build` | `next build` |
| `pnpm start` | `next start` |
| `pnpm lint` | `next lint` |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm test` | `vitest run` |
| `pnpm test:watch` | `vitest` |

## Environment

All variables are public (`NEXT_PUBLIC_*`) and baked into the bundle at build time.

- **Which file applies.** `.env.development` and `.env.production` are committed.
  `.env.local` (gitignored) overrides them.
- **Precedence.** `.env.local` beats `.env.development` / `.env.production`, which beat
  `.env`.

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | yes | Backend REST API base, including `/api/v1` |
| `NEXT_PUBLIC_SITE_URL` | no | Public storefront URL for canonical and Open Graph metadata (default `http://localhost:3000`) |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | no | Google OAuth Web client id; must match the backend's `GOOGLE_CLIENT_ID`. Blank hides the Google button |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | no | Cloudflare Turnstile site key for the Get Help form. Blank skips the widget |
| `NEXT_PUBLIC_SELLER_NAME` | no | Seller name on invoices |
| `NEXT_PUBLIC_SELLER_ADDRESS` | no | Seller address on invoices |
| `NEXT_PUBLIC_SELLER_PHONE` | no | Seller phone on invoices |
| `NEXT_PUBLIC_SELLER_EMAIL` | no | Seller email on invoices |
| `NEXT_PUBLIC_SELLER_BIN` | no | Seller BIN on invoices |

The Google client id committed in `.env.development` and `.env.production` is a public
OAuth Web client id. It is not a secret: it ships in the browser bundle by design.
