# Dekora

A full production e-commerce platform built for a real gift/decor shop in Tetovo, North Macedonia. Dekora is a complete two-sided system: a public storefront customers actually buy from, and an admin dashboard the shop owner uses to run the business day to day — products, orders, homepage content, analytics, and customer communication. **It's live and used for real sales**, not a portfolio demo.

## Architecture

- **Backend:** ASP.NET Core 9 Web API (C#), Entity Framework Core 9 with Npgsql (PostgreSQL), ASP.NET Core Identity, JWT bearer auth
- **Frontend:** Angular 21 using signal-based APIs (`signals`, `computed()`, `input()`/`output()`, `@if`/`@for`/`@empty`), split into two apps sharing one codebase:
  - `customer-app` — public storefront, server-side rendered (Angular SSR) for fast load and SEO
  - `admin-app` — owner's dashboard, client-side rendered
  - `@dekora/shared` — shared models, utilities, and design tokens so the two apps never drift out of sync
- **Database:** PostgreSQL
- **Deployment:** Self-hosted on a Hetzner VM via Docker Compose, behind Caddy as a reverse proxy for automatic HTTPS
- **Internationalization:** Fully trilingual storefront (Macedonian, English, Albanian) with a custom i18n system and locale-prefixed routing

## Customer-facing features

- Product catalog split by occasion and by type, both fully owner-managed
- Rich product pages: multiple photos, per-color photo variants, independent size/sale pricing, a custom-size price calculator for made-to-order items, optional personalized add-ons, per-color sold-out states
- Custom-built interactive carousels (hover-to-speed-up/reverse, seamless infinite loop, native touch scrolling — not a canned animation library)
- Guest checkout, delivery city picker with per-city fees, pay-at-delivery or card payment, real-time validation
- Loyalty points program with configurable earn/redemption rules
- Wishlist, product reviews, FAQ, and legal pages — all owner-editable and translatable
- Site-wide promo banner with optional live countdown
- Fully responsive, mobile-first throughout

## Admin dashboard

- Full product/category CRUD with a live storefront preview as the owner edits
- Homepage content management, including a custom visual picker for "Trending"/"Featured" products and category tile photos
- One-click machine translation across every trilingual field (product names, categories, homepage copy, FAQ)
- Order management with status workflow, an "unseen orders" indicator, and manual order entry for offline sales
- Analytics dashboard (sales trends, revenue by category, top products) — revenue figures deliberately exclude pass-through delivery fees
- Telegram bot integration: instant order notifications plus on-demand `/today`, `/week`, `/month` sales queries
- Delivery city, loyalty rate, and other business-rule configuration — all server-side, not hardcoded

## Engineering highlights

- EXIF-aware image processing (SkiaSharp) so uploaded phone photos never appear rotated
- Client-side image cropping built so the preview and final export are pixel-consistent
- Revenue reporting correctness: delivery fees are excluded everywhere they'd otherwise inflate real shop income
- Migration-safety discipline for schema changes, developed after a real production incident (fixed without data loss)
- Accessibility care: `aria-hidden` on decorative carousel duplicates, full `prefers-reduced-motion` support
- Security defaults throughout: role-based authorization on every admin endpoint, server-side validation of client-submitted data, HTML-encoded notification emails, secret-token-verified Telegram webhook

## Setup

See [DEPLOYMENT.md](./DEPLOYMENT.md) for full deployment instructions.

1. Copy `.env.example` to `.env` and fill in your own values
2. `docker-compose up --build`

## Status

Live in production for a real business. Actively maintained.
