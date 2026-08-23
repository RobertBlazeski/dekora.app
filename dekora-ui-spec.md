# Dekora — UI/UX Visual Specification

This document describes exactly how every screen looks and behaves, in enough detail to rebuild it without ever seeing the original rendered prototype. Pair with `dekora-technical-handoff.md` (data model, API, business rules) — that doc says *what* the system does; this one says *what it looks like and how it moves*.

Two working React prototypes were built and approved screen-by-screen during design: a customer storefront and a separate owner/admin dashboard. This spec is the written record of both, plus two features requested afterward that were never built or documented anywhere else (marked **NEW** throughout — Trending/Related sections on the product page, and owner-side banner/featured-picks control).

---

## 1. Design tokens

**Colors**
| Token | Hex | Use |
|---|---|---|
| bg | `#FBF6F2` | Page background, warm ivory |
| card | `#FFFFFF` | Card/surface background |
| ink | `#3D2A3B` | Primary text, headings, dark buttons/sidebar background |
| ink-soft | `#8A7387` | Secondary/muted text |
| rose | `#C97B92` | Primary accent — links, active states, icons |
| rose-tint | `#F6E4E9` | Soft rose background fill |
| coral | `#E2635F` | CTA accent — badges, promo strip, points, sale prices |
| coral-tint | `#FBE4E1` | Soft coral background fill |
| lilac | `#EFE4EE` | Secondary neutral background fill |
| line | `#EAD9E3` | Borders, dividers |
| success | `#7C9473` | Delivered status, in-stock indicators |
| success-tint | `#E9EFE6` | Soft success background fill |

**Typography**
- Display/headings: **Fraunces** (serif, variable optical size), weights 400/500/600 — gives a warm, slightly editorial, handmade feel. Used for all page titles, section headings, prices in large contexts, and the "Dekora" logotype.
- Body/UI: **Public Sans**, weights 400/500/600 — used for everything else (nav, buttons, labels, descriptions, form fields).

**Shape & feel**
- Corners: consistently rounded — `rounded-2xl`/`rounded-3xl` (16–24px) on cards and images, fully pill-shaped (`rounded-full`) on buttons, chips, and badges.
- Shadows: soft and subtle, only on modals/popups (e.g. `0 10px 30px rgba(61,42,59,0.25)`), not on ordinary cards (borders are used instead, 1px solid `line`).
- Overall tone: light, warm, gentle — never stark/flat. Every interactive element has a subtle hover/press animation (scale 1.01–1.02 on hover, 0.98 on press).

**Animation inventory** (all respect `prefers-reduced-motion: reduce`)
- **Marquee scroll**: horizontal auto-scrolling carousel, ~28s linear loop, pauses on hover, edges fade via CSS mask gradient.
- **Cart bump**: badge count icon does an overshoot bounce (scale 1 → 1.45 → 0.9 → 1) on add-to-cart, ~0.45s.
- **Toast pop-in**: bottom-right toast slides up + fades in, ~0.35s, auto-dismisses after ~2.6s.
- **Modal pop-in**: backdrop fades in (~0.25s), modal content scales in from 0.9 with a slight overshoot (~0.3–0.4s).
- **Confetti burst**: ~14 small colored rectangles fall and rotate out from the top of the order-success modal, staggered delays, ease-in.
- **Card fade-in**: cart line items and order rows fade+slide up slightly on mount (~0.3s).

---

## 2. Customer app — screens

### 2.1 Global navigation
Sticky header, translucent blurred background (`rgba(251,246,242,0.92)` + backdrop-blur), bottom border `line`.
- **Desktop**: logo "Dekora" (Fraunces, bold) far left, clickable → home. Center nav links: Shop, FAQ, Track order (Track order routes to login if signed out, profile if signed in). Right-aligned icon row: search (opens overlay), wishlist heart (filled coral if items saved, outline otherwise, badge-less), account/user icon (small green success-colored dot overlay if logged in), cart bag icon (coral circular badge with item count, bump-animates on change).
- **Mobile**: same logo/icon row, but the center text nav is replaced by a second, horizontally-scrollable row directly beneath the header (Shop / FAQ / Track order), always visible — not hidden behind a hamburger, so nothing requires discovery.
- **Search overlay**: full-screen dim backdrop, centered modal with a search input (autofocus), live-filtered results list (icon-swatch + name + category + price) as you type, "See all results for X" row at the bottom routing to the shop page pre-filtered.

### 2.2 Home page
Order top to bottom:
1. **Promo strip**: full-width coral bar, centered white text: "15% off your first order — code WELCOME15 · ends in [live HH:MM:SS countdown]". Countdown ticks down every second in a pill with translucent white background.
2. **Hero**: two-column on desktop (stacks on mobile). Left: small rose uppercase eyebrow "Handmade in Tetovo", large Fraunces headline "Give a moment they'll keep.", supporting paragraph, two buttons — solid dark pill "Design your box →" and outlined pill "Shop bestsellers". Right: a soft rose-to-lilac gradient rounded panel with a few overlapping colored circles (stand-in for a product photo) and a small floating price chip.
3. **Trending now** (moving carousel): section heading + "See all" link. Below it, a continuously auto-scrolling horizontal row of product cards (~220px wide each) — image area with color swatch circle, discount/tag badge top-left (percentage off if discounted, else a text tag like "Bestseller"), heart wishlist toggle top-right, name, price (struck-through original + coral sale price if discounted), small "Order now" coral label. List is duplicated end-to-end for a seamless loop.
4. **Shop by occasion**: 2-col (mobile) / 5-col (desktop) grid of soft-colored rounded tiles (Birthdays, Weddings, New baby, Graduation, Just because), each just a colored rectangle with the category name bottom-left, routes to the shop pre-filtered by that category.
5. **Points banner**: full-width dark (ink) rounded panel, "Earn points with every order" heading in Fraunces (light text), supporting line, "Create account" button.
6. **Footer**: logo, address line ("Tetovo, North Macedonia · Handmade gifts since 2025"), and a "FAQ & contact" link.

### 2.3 Shop / search page
- Page title "Shop".
- Search input (pill-shaped, icon-left, placeholder "Search by name, tag, or occasion — try 'baby' or 'birthday'").
- Category filter chips row (All + each category), active chip filled dark, inactive chips outlined.
- Results: 2-col (mobile) / 4-col (desktop) grid of product cards — same visual language as trending cards (swatch image, discount badge or category label, wishlist heart, name, price with strike-through if discounted). Empty state: centered text "No products match 'X' yet."

### 2.4 Product detail page — **UPDATED, includes NEW sections**
- Breadcrumb row (Shop › Category › Product name).
- Two-column layout (stacks on mobile):
  - **Left**: photo gallery — large image area (soft gradient placeholder until real photos exist) with a small "Photo placeholder" pill, thumbnail strip below (each thumbnail tagged with a color label overlay), helper caption explaining real photos get tagged by color. Clicking a thumbnail swaps the main image.
  - **Right**: product name (Fraunces, large), star rating + review count, price (large, bold), description paragraph, then the options stack:
    - **Size** — row of pill buttons, each showing size name + short description + price delta, active one highlighted rose.
    - **Box color** — row of circular swatches, selected one gets a dark ring + checkmark.
    - **Balloon color** — same swatch pattern, separate row.
    - **Custom text** field — single-line input, placeholder "e.g. Happy birthday, Ivona", character-limited.
    - **Extras** — list of checkbox rows (name + price), selected ones highlighted rose-tinted.
    - **Note to shop** — multi-line textarea, placeholder about delivery time/special requests.
    - **Add to cart button** — full-width dark pill showing live-computed total, plus a small coral line below: "You'll earn N points with this order."
- **NEW — "Trending now" section** (below the product's own detail block, full width): identical visual treatment to the homepage trending carousel (same auto-scrolling marquee, same card style) — shows the shop's current trending picks regardless of which product page you're on. Section heading "Trending now" + "See all" link, same as homepage.
- **NEW — "Customers are also ordering" section** (below Trending, full width): a static (non-scrolling) grid, same card style as the shop grid, showing 4 other products **from the same category** as the product currently being viewed (excluding the current product itself). Section heading: "Customers are also ordering". If fewer than 4 other products exist in that category, show however many are available — don't pad with unrelated items.
- Reviews section beneath everything (star rating summary + list of written reviews) — not fully detailed in the prototype; implement as a simple list of {rating, reviewer name, text, date}.

### 2.5 Cart page
- Title "Your cart".
- If empty: centered icon + "Your cart is empty" + "Browse the shop" button.
- If signed out: a clickable rose-tinted callout banner above the line items — "Sign in to earn N points on this order and track it later" with a chevron, routes to login.
- Line items: each a card with swatch thumbnail, name, options summary line (size · box color · balloon color · extras), custom text in italic rose if present, quantity stepper (−/+ pill), remove (trash icon), line total.
- Summary card: Subtotal, Delivery (170 ден flat, truck icon), "You'll earn" points line (coral, or "sign in to earn" if signed out), Total (large, bold), "Proceed to checkout" button.

### 2.6 Checkout page
- Back-to-cart link.
- If signed out: same style sign-in nudge banner as cart, phrased for checkout: "Sign in before placing this order to earn N points, or continue as a guest below."
- **Delivery details** card: name, phone, city, address inputs (2-col grid, stacks to 1-col on small screens).
- **Payment method** card: two radio-style rows — "Pay at delivery" (wallet icon, selected by default, subtext "We'll call to confirm your order before it's prepared") and "Pay by card" (credit card icon, greyed out/disabled, subtext "Coming soon").
- **Points redemption** card (signed-in users only): toggle switch "Use your points" — subtext shows either the ден discount available if they have ≥300 points, or "need 300 to redeem" if below threshold. Toggle disabled/greyed if under threshold.
- **Order summary** card: Subtotal, Delivery fee, Points discount line (coral, only shown if applied), a small clock-icon note "Delivery can take up to 3 business days once your order is marked shipped", Total, "Place order" button (shows "Placing your order..." with reduced opacity briefly on click, simulating a short processing delay before confirmation).

### 2.7 Order confirmation (success modal)
Centered modal over dimmed/blurred backdrop, confetti burst animation, bouncy checkmark icon in a rose-tinted circle. Content:
- "Order confirmed!" heading, order number, "we'll call to confirm shortly."
- Truck-icon line: "Delivery can take up to 3 business days once shipped."
- **If logged in**: coral-tinted pill "+N points earned", note "Check your order status anytime from your profile", single "Continue shopping" button.
- **If guest**: no points pill. Instead: "Sign in to track this order and earn points on your next one," a primary dark button "Sign in to track order" (routes to login), and a secondary plain-text "Continue shopping" link below it.

### 2.8 Login / signup page
Centered card on the page background (not a modal — a full routed page). Small icon circle at top, heading ("Welcome back" / "Create your account" depending on mode), short supporting line about earning points. Fields: name (signup only), email (mail icon), password (lock icon). Primary dark "Sign in"/"Create account" button. Below: toggle link between login/signup modes, and a "Continue as guest" text link back to where they came from.

### 2.9 Profile page
- Greeting heading "Hi, [name]", email beneath, "Sign out" button top-right.
- Dark points card: large point balance (Fraunces, bold), and a redeemable-threshold note ("300 points = 180 ден off").
- "Your orders" list: each order card shows order number, status badge (color-coded per status — see status style table below), date + item names, total (noting it includes delivery), and if delivered and not yet reviewed, a "Leave a review" link that expands an inline star-picker + text field with Submit/Cancel. Already-reviewed orders show the stars + review text instead.

**Status badge colors:**
| Status | Background | Text |
|---|---|---|
| Pending confirmation | rose-tint | rose |
| Confirmed / Preparing | lilac | ink |
| Shipped | coral-tint | coral |
| Delivered | success-tint | success |
| Cancelled | light red tint (`#F1E4E4`) | muted red (`#A85D5D`) |

### 2.10 Wishlist page
Same card grid as the shop page, but every card's heart icon is pre-filled coral (since everything shown is already saved) and clicking it removes the item. Empty state: centered heart icon + "Nothing saved yet."

### 2.11 FAQ & contact page
Accordion list of Q&A pairs (click a question to expand/collapse its answer, chevron rotates 90°). Below the accordion: a dark rounded panel "Get in touch" with Instagram handle, email, and location, each with a small icon.

---

## 3. Owner/admin dashboard — screens

Entirely separate app, own login, own visual shell — dark (`ink`) sidebar on desktop, collapsible top bar on mobile. Not discoverable from the customer site's normal navigation.

### 3.1 Admin login
Centered card, "Dekora Admin" heading, "Owner access only" subtext, email + password fields, dark "Sign in" button. (No real auth logic in the prototype — any submission logs in.)

### 3.2 Layout shell
- **Desktop**: fixed-width (≈224px) dark sidebar, logo top, nav list (Overview, Analytics, Orders, Products, Customers, Notifications) each with an icon, active item has a subtle lighter background pill. Sign-out pinned to the bottom.
- **Mobile**: sidebar replaced entirely by a dark top bar showing the current section name and a menu button; tapping it drops down the same nav list plus sign-out.

### 3.3 Overview
- Heading + "Full analytics" pill button linking to the Analytics tab.
- 4 stat cards (2-col mobile / 4-col desktop): Sales today, Pending orders (highlighted coral if >0), Visitors today, Logged-in today — each a small icon circle, large Fraunces number, label, optional small green trend note.
- Two-column panel row (stacks on mobile): a "Sales this week" bar chart (simple CSS bars, one per weekday, today highlighted coral) with a weekly total caption; a "Needs attention" list of orders still pending confirmation (alert icon + order number + customer + "needs confirmation call"), with a "View all" link to Orders.

### 3.4 Analytics — **fuller detail page**
- Heading + a pill toggle (7 days / 30 days) switching the data range for all charts.
- Three full-width chart cards stacked vertically, each with a title and a running total/average in the header:
  - **Visitors per day** — line chart (rose line).
  - **Orders per day** — bar chart (coral bars).
  - **Logged-in customers per day** — line chart (success-green line).
- All charts use a light grid, no vertical gridlines, soft axis labels, and a dark tooltip on hover.

### 3.5 Orders
- Search box (name or order #) + status filter dropdown.
- **Desktop**: table with columns # / Customer (+phone) / Items summary / Total / Date / Status (inline dropdown, colored per status) / Details link.
- **Mobile**: stacked cards (order # + customer, status badge top-right, items summary, date + total), each ending in a full-width dark **"View details ›" button** — not just a tappable card, an explicit labeled button, so the action is never ambiguous on small screens.
- **Order details modal** (opens from either Details link or mobile button): status dropdown at top (editable inline), a rose-tinted contact block (customer name, phone, email, address, payment method, and any note left at checkout in an italic quote), then a per-item breakdown — each item shows a colored swatch "image" placeholder, name, size/box color/balloon color, extras, custom text, and its price — ending in a bold order total.

### 3.6 Products
- Heading + "Add product" button (top-right, opens the product form modal).
- 2-col (mobile) / 4-col (desktop) grid of product cards: swatch image (dimmed + "Sold out" badge if applicable), name, price + category, two footer buttons — "Edit" (opens the form pre-filled) and a toggle-styled "Sold out"/"Restock" button.
- **Product form modal** (create or edit): scrollable modal with, in order —
  - Photos row (placeholder upload tiles, captioned about tagging by color).
  - Name, base price, category dropdown, description textarea.
  - Whole-product "sold out" toggle switch.
  - "Offer multiple sizes" toggle → reveals editable rows (name + price delta, add/remove), plus a separate "Allow custom size with price calculator" checkbox nested underneath.
  - Colors section: list of existing colors (swatch + name + independent sold-out toggle chip + remove), plus an inline color-picker input + name field + "Add" button to append new ones.
  - "Offer extras" toggle → reveals editable rows (name + price, add/remove).
  - Cancel / Save buttons at the bottom.
- **NEW — Trending & Featured controls** (add to this same product form, as two more toggle switches near the sold-out toggle): **"Mark as Trending"** and **"Mark as Featured/Most ordered"**. These control whether a product appears in the customer-facing "Trending now" carousels (home page and product page) and any future "Most ordered" home section. Keep it simple — boolean flags per product, no manual ordering/priority needed for v1 (if the owner marks many products trending, just show all of them in the carousel in whatever order they were added).

### 3.7 — **NEW — Homepage content (banner) management**
Not built in either prototype — new section to add to the admin nav (e.g. between Products and Customers), likely titled **"Homepage"**. Should let the owner control the two pieces of the home page that are currently hardcoded:
- **Hero banner**: editable headline text, supporting paragraph text, and the two CTA button labels/links (currently "Design your box" / "Shop bestsellers"). Since there's no real image upload system yet beyond the placeholder pattern used elsewhere, treat this the same way — an image placeholder tile with the same "upload later" treatment used on product photos.
- **Trending/Featured picks**: rather than being purely automatic, give the owner a simple picker — a searchable list of products with a checkbox or "Add to trending" button next to each, so they can hand-curate which products show in the homepage and product-page "Trending now" carousels. This reads from the same `IsTrending` flag set in the product form (§3.6) — editing it from either place should update the same underlying value.

### 3.8 Customers
Search box (name/email). **Desktop**: table (Name + join date / Contact / Points / Order count / Total spent). **Mobile**: stacked cards with the same fields condensed. Points shown with a small sparkle icon in coral.

### 3.9 Notifications
Heading + explanation line. A vertical list of three channel cards (Email, WhatsApp, Telegram), each with an icon, label, description, and a toggle switch; when a channel is toggled on, its destination field (email address / phone number / Telegram handle) expands beneath it. Multiple channels can be enabled simultaneously.

---

## 4. Things this spec intentionally leaves open

- Exact review UI on the product page (star breakdown, pagination) — only roughly specified above; use judgment consistent with the rest of the design language.
- Real product photography treatment once available (this spec describes the placeholder/gallery *pattern*, not final imagery).
- Any pixel-level spacing not stated — follow the general rhythm described (generous padding, rounded-2xl/3xl cards, consistent gap scale of ~12–24px) rather than treating this doc as a pixel-perfect Figma replacement.
