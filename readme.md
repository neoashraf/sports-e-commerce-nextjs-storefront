# Sports E-Commerce — Customer Storefront (Frontend)

Customer-facing storefront for the Sports E-Commerce platform. Next.js 14
(App Router) + TypeScript + Tailwind CSS, consuming the backend NestJS REST API.
Frontend only — no DB or server business logic; the backend owns authorization.

> Part of the `e-commerce-workspace`. Specs live in the workspace `docs/`
> (`docs/srs/`, `docs/api-contracts/`, `docs/design/`); this app implements the
> customer-facing modules (AUTH, catalog, search, cart/checkout, orders,
> wishlist, …).

## Stack

| Concern | Choice |
| --- | --- |
| Framework | Next.js 14 App Router |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS (mobile-first) |
| Server state | TanStack React Query |
| Client state | Zustand (auth/session) |
| Forms | React Hook Form + Zod |
| Validation | Zod (also validates API responses at the boundary) |

## Getting started

```bash
pnpm install
cp .env.example .env.local   # set NEXT_PUBLIC_API_URL to the backend
pnpm dev                     # http://localhost:3000
```

Other scripts: `pnpm build`, `pnpm start`, `pnpm lint`, `pnpm typecheck`.

## Environment

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | Backend REST API base, incl. `/api/v1` prefix. |
| `NEXT_PUBLIC_SITE_URL` | Public storefront base URL, for canonical/SEO metadata. |

## Project structure

```
src/
  app/
    layout.tsx                 # root layout: React Query provider, indexable SEO metadata
    page.tsx                   # public landing (scaffold placeholder)
    not-found.tsx
    globals.css
  components/                  # shared UI (added per module)
  lib/
    env.ts                     # validated public env access
    format.ts                  # BDT ৳ + DD/MM/YYYY formatters
    query-client.tsx           # React Query provider + retry policy
    api/
      client.ts                # typed fetch wrapper; attaches customer token when present
      errors.ts                # ApiError (platform error envelope)
      form-errors.ts           # map API field errors → RHF setError
      schemas/                 # Zod schemas per domain (added per module)
      hooks/                   # React Query hooks (added per module)
    stores/auth.ts             # Zustand customer session (persisted)
```

## Conventions

- All API access goes through `lib/api/client.ts`; never scatter raw `fetch`.
  Responses are validated with Zod (`schema` option) — the backend shape is
  treated as external input.
- Server data lives in **React Query**, client/session state in **Zustand**,
  shareable filters in **URL `searchParams`**, form state in **React Hook Form**.
- Money is transferred as numbers, rendered as BDT `৳` (`lib/format.ts`).
- The storefront is **public and indexable**; browse/search/product endpoints
  work without a token. Account/order screens require the customer session.
- Mobile-first @360px, 44px touch targets, WCAG 2.1 AA (docs/srs/00-overview.md §8).

## Status

Foundation only: app init, data layer (API client + error envelope + React
Query), customer auth store, and a landing placeholder. Feature modules are
scaffolded next, one per the workspace SRS, starting with `AUTH` (phone-OTP
login) — see `briefs/BUILD-SEQUENCE.md`.
