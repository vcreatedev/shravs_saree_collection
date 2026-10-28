# Shravs Saree Collection

The Shravs storefront: catalogue and content in Sanity, payments with Razorpay, order emails through Resend, and delivery through Shiprocket (every courier partner it works with). Store staff run everything from the Sanity Studio at `/admin`.

## Stack

- **Next.js 16** (App Router, TypeScript, Tailwind CSS v4)
- **Sanity** for products, categories, homepage, pages, settings and orders, with the Studio embedded at `/admin`
- **Razorpay** for online payments (cards, UPI, netbanking, wallets)
- **Resend** for order, shipping and delivery emails; **pdf-lib** for the invoice PDF
- **Shiprocket** for courier rates, booking, pickups, labels and tracking (Delhivery, Blue Dart, DTDC, Xpressbees, Ekart, Ecom Express, Shadowfax and more)
- **Lenis** for smooth scrolling on mouse and trackpad (touch screens keep native scrolling)
- **Zustand** for the cart (kept in the browser)

## Getting started

```bash
cp .env.example .env.local   # then fill it in (see below)
npm install
npm run dev
```

The site runs at http://localhost:3000. Locally it reads the Sanity **development** dataset, so nothing you do there touches the live shop.

## Environment variables

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | Sanity project (`l6u3st01`) |
| `NEXT_PUBLIC_SANITY_DATASET` | `development` locally, `production` on the live site |
| `SANITY_API_WRITE_TOKEN` | Editor token (sanity.io/manage → API → Tokens). The server uses it to save orders and reduce stock. Never expose it to the browser. |
| `SANITY_REVALIDATE_SECRET` | Secret shared with the Sanity publish webhook (below) |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | From the [Razorpay dashboard](https://dashboard.razorpay.com/app/keys). Test keys (`rzp_test_...`) locally. |
| `RAZORPAY_WEBHOOK_SECRET` | Secret set on the Razorpay webhook (below) |
| `RESEND_API_KEY` | From [resend.com/api-keys](https://resend.com/api-keys). Leave blank to skip emails. |
| `EMAIL_FROM` | Sender address. Stays `onboarding@resend.dev` until your domain is verified in Resend. |
| `SHIPROCKET_EMAIL` / `SHIPROCKET_PASSWORD` | A Shiprocket API user (Shiprocket → Settings → API). Leave blank to ship by hand. |
| `SHIPROCKET_PICKUP_LOCATION` | The pickup address's nickname in Shiprocket (Settings → Pickup Addresses) |
| `SHIPROCKET_PICKUP_PINCODE` | That pickup address's pincode, used for rate checks |
| `SHIPROCKET_WEBHOOK_TOKEN` | Security token set on the Shiprocket tracking webhook (below) |
| `NEXT_PUBLIC_SITE_URL` | Public site address, used in emails, invoices and share links |
| `NEXT_PUBLIC_STORE_NAME` / `NEXT_PUBLIC_WHATSAPP_NUMBER` | Fallbacks only: the Studio's Storefront Settings take priority |

## The Studio (`/admin`)

Sign in with a Sanity account that is a member of the project (sanity.io/manage → Members). Administrators, editors and developers can use the delivery actions.

- **Live shop** workspace: the `production` dataset, what customers see. Only offered on the live site.
- **Test** workspace: the `development` dataset, what local development shows.
- **Overview**: revenue today, last 7 and 30 days, a 14-day chart, orders waiting to ship, best sellers and low stock.
- **Orders**: filter (to ship, in transit, delivered, all paid, unpaid), search, change status, and run delivery: compare couriers, book the recommended or a chosen courier, request pickup, print the label and manifest, refresh tracking, cancel, or record a shipment sent another way.
- **Content**: homepage (announcement strip, hero slides, collections, trust badges), catalogue (products with sizes, variants, stock, weight and package size), contact and policy pages, and Storefront Settings (contact details, shipping fee, free shipping threshold, automatic courier booking and which courier to pick).

Each new site address that opens the Studio needs a CORS origin with credentials (sanity.io/manage → API → CORS origins). `http://localhost:3000` and the live domains are already added.

## How an order flows

1. Checkout checks that the pincode is serviceable, prices the bag from Sanity (the browser's prices are ignored), checks stock and saves a pending order.
2. Razorpay takes the payment. The browser and the Razorpay webhook both report it; whichever arrives first confirms the order and reduces stock, exactly once.
3. The customer gets a confirmation email with the invoice PDF, and the store gets an order alert.
4. Staff book the courier from the Studio, or it is booked automatically if Storefront Settings say so.
5. Shiprocket's tracking webhook moves the order through Ready to ship, Shipped, Out for delivery and Delivered (or Returned). The customer gets an email when it ships, when it is out for delivery and when it is delivered, and can follow it on their order page, under My Orders, or by order number and email.

Orders are private documents in Sanity: they can only be read with a token, never through the public API.

## Webhooks (live site)

| Service | Where | URL | Settings |
|---|---|---|---|
| Sanity | sanity.io/manage → API → Webhooks | `https://<site>/api/revalidate` | Dataset `production`, trigger on create, update and delete, filter `_type in ["product", "category", "heroBanner", "siteSettings", "marqueeSection", "trustBadgesSection", "policyPage", "contactPage"]`, secret = `SANITY_REVALIDATE_SECRET` |
| Razorpay | Dashboard → Account & Settings → Webhooks | `https://<site>/api/razorpay/webhook` | Events `payment.captured`, `order.paid`, `payment.failed`, secret = `RAZORPAY_WEBHOOK_SECRET` |
| Shiprocket | Settings → API → Webhooks | `https://<site>/api/delivery/updates` | Token = `SHIPROCKET_WEBHOOK_TOKEN` |

Shiprocket's webhook form refuses URLs containing "shiprocket", "kartrocket", "sr" or "kr". If the store's domain contains one of these, use another address for the same deployment that doesn't (for example the project's `*.vercel.app` address).

Without the Sanity webhook, published changes don't appear on the live site until the next deploy.

## Testing payments (Razorpay test mode)

With test keys, no real money moves. Use a **domestic (Indian) test card**: international test numbers like `4111 1111 1111 1111` are rejected on Indian Razorpay accounts.

| Network | Card Number | Type |
|---|---|---|
| Visa | `4100 2800 0000 1007` | Debit |
| Mastercard | `5555 5100 0008 1006` | Credit |
| RuPay | `6527 6589 0000 1005` | Credit |

Any future expiry, any 3-digit CVV, and any 4 to 10 digit OTP. Source: [Razorpay test card docs](https://razorpay.com/docs/payments/payments/test-card-details/).

## Deploying to Vercel

1. In **Settings → Environment Variables**, add every variable above with live values: `NEXT_PUBLIC_SANITY_DATASET=production`, live Razorpay keys, and the live site address in `NEXT_PUBLIC_SITE_URL`.
2. Set up the three webhooks above against the live address.
3. In Resend, verify the store's domain and set `EMAIL_FROM` to an address on it.
4. In Shiprocket, add the pickup address and use its nickname and pincode in the `SHIPROCKET_PICKUP_*` variables.
5. If the deployed URL redirects to `vercel.com/sso-api`, that is Vercel's **Deployment Protection**, not an app bug: use the production domain, or limit protection to previews.

## Moving content from the old database

The store used to run on Postgres. `npm run migrate:sanity -- production` (or `development`) copies its categories, products, hero slides and photos into Sanity, together with the settings and pages that used to be in the code. It is safe to run again, since every document has a fixed id and is replaced. It needs `DATABASE_URL` and `DIRECT_URL` for the old database. Once the live shop runs on Sanity, the script, `prisma/` and the Prisma dev dependencies can be deleted.
