# Shravs Saree Collection — Next.js E-Commerce Platform

A full e-commerce storefront with an admin panel, Razorpay payments, PDF invoice downloads, and WhatsApp integration for customer inquiries and order sharing.

## Stack

- **Next.js 16** (App Router, TypeScript, Tailwind CSS v4)
- **Prisma + Postgres** for data (products, categories, orders, admin users)
- **Razorpay** for online payments (with Cash on Delivery as a fallback method)
- **pdf-lib** for generating downloadable invoices
- **Zustand** for cart state (persisted to localStorage)
- **jose + bcryptjs** for a lightweight, cookie-based admin session (no third-party auth provider)

## Getting started

1. Provision a Postgres database — [Neon](https://neon.tech), [Supabase](https://supabase.com), and [Vercel Postgres](https://vercel.com/storage/postgres) all have free tiers. Copy its connection string into `DATABASE_URL` in `.env` (copy `.env.example` to `.env` first).
2. Install, sync the schema, and seed:

```bash
npm install
npx prisma db push       # creates the tables from the schema
npm run db:seed          # seeds categories, sample products, and the admin account
npm run dev
```

The app runs at http://localhost:3000 (or the next free port if 3000 is taken).

### Default admin login

Set in `.env` (`ADMIN_EMAIL` / `ADMIN_PASSWORD`), applied when you run `npm run db:seed`:

- Email: `admin@store.com`
- Password: `Admin@123`

Admin panel: `/admin/login`

## Environment variables (`.env`)

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection string, e.g. from Neon/Supabase/Vercel Postgres |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | Server-side Razorpay credentials. Get test keys from the [Razorpay dashboard](https://dashboard.razorpay.com/app/keys). |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Same key ID, exposed to the client checkout widget |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Seed credentials for the admin account |
| `AUTH_SECRET` | Secret used to sign the admin session cookie — change this for production |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | WhatsApp Business number (country code + number, no `+` or spaces), e.g. `919876543210` |
| `NEXT_PUBLIC_STORE_NAME` | Store name shown across the site and in invoices |
| `NEXT_PUBLIC_SITE_URL` | Public site URL, used to build shareable product links |

**Without real Razorpay keys**, the "Pay online" checkout option will fail at the payment step — use **Cash on delivery** at checkout to test the full order → invoice → WhatsApp flow end to end.

## Testing payments (Razorpay test mode)

With test keys (`rzp_test_...`) configured, no real money moves. Use a **domestic (Indian) test card** — generic international test numbers like `4111 1111 1111 1111` get rejected with "International cards are not supported" on Indian Razorpay accounts.

| Network | Card Number | Type |
|---|---|---|
| Visa | `4100 2800 0000 1007` | Debit |
| Mastercard | `5555 5100 0008 1006` | Credit |
| RuPay | `6527 6589 0000 1005` | Credit |

For any of these:
- **Expiry**: any future date (e.g. `12/28`)
- **CVV**: any 3 digits
- **OTP** (if prompted): any 4–10 digit number

Source: [Razorpay test card docs](https://razorpay.com/docs/payments/payments/test-card-details/).

## Feature tour

- **Storefront** (`/`, `/shop`, `/product/[slug]`): filterable/sortable product catalog (category, price, search, sort), product detail pages with color/size variants, quick-add and buy-now.
- **Cart**: persistent slide-over cart (Zustand + localStorage).
- **Checkout** (`/checkout`): address form, Razorpay Checkout widget or Cash on Delivery, server-side stock validation and signature verification.
- **Orders** (`/orders/[id]`, `/orders/track`): order confirmation page, PDF invoice download, "Share on WhatsApp" (prefilled order summary), and a public order-tracking lookup by order number + email.
- **WhatsApp integration**: floating "Chat with us" button site-wide, per-product inquiry link, and order-sharing/status-inquiry links — all built from `src/lib/whatsapp.ts`.
- **Admin panel** (`/admin`): dashboard stats, product CRUD, category management, and order management with status updates — protected by a signed cookie session and enforced in `src/proxy.ts`.

## Useful scripts

```bash
npm run db:studio   # browse/edit the database with Prisma Studio
npm run db:push     # sync schema changes to the database
npm run db:seed     # re-seed categories, products, and the admin account
npm run build        # production build
```

## Deploying to Vercel

1. Push this repo to GitHub (already done) and import it into Vercel.
2. In the Vercel project's **Settings → Environment Variables**, add every variable from the table above (with real values — `AUTH_SECRET` should be a new random string, not the dev one). `DATABASE_URL` must point at the same Postgres instance you used locally (or a separate production database).
3. Vercel installs devDependencies during build, and `postinstall` runs `prisma generate` automatically — no extra build configuration needed.
4. After the first deploy, run `npx prisma db push` and `npm run db:seed` once (locally, with `DATABASE_URL` pointed at the production database) to create the tables and the admin account.
5. If the deployed URL redirects to `vercel.com/sso-api` and shows no UI, that's Vercel's **Deployment Protection**, not an app bug — either visit your canonical `*.vercel.app` production domain (Project → Domains), or turn protection off/scope it to previews only in **Settings → Deployment Protection**.
