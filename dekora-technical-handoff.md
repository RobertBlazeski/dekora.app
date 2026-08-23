# Dekora — Technical Handoff Spec

Gift/decor e-commerce store (satin bouquets, balloon boxes, baskets, event decor) for a shop based in Tetovo, North Macedonia. This document captures every product decision made during the design/prototype phase so implementation can start from a clear spec instead of guesswork.

**Target stack:** ASP.NET Core Web API (backend) + Angular (frontend) + a relational database (SQL Server or PostgreSQL — pick one; PostgreSQL is free/cross-platform if there's no reason to prefer SQL Server).

**Two working prototypes exist** (React, chat artifacts) that this spec is derived from — a customer storefront and a separate owner/admin dashboard. Treat them as the UX/behavior reference, not as code to port.

---

## 1. Design tokens (carry into Angular)

- Colors: bg `#FBF6F2`, card `#FFFFFF`, ink (text) `#3D2A3B`, ink-soft `#8A7387`, rose `#C97B92`, rose-tint `#F6E4E9`, coral (accent/CTA) `#E2635F`, coral-tint `#FBE4E1`, lilac `#EFE4EE`, line `#EAD9E3`, success `#7C9473`, success-tint `#E9EFE6`
- Fonts: **Fraunces** (display/headings), **Public Sans** (body)
- Theme: light, warm, gentle, rounded corners, soft shadows, fluid animations (toasts, modal pop-ins, cart bump, marquee scroll) — not flat/static admin-tool aesthetic even on the owner side
- Fully responsive: desktop nav/sidebar layouts collapse to mobile-friendly equivalents (bottom/top bars, stacked cards instead of tables) — this applies to **both** the customer site and the owner dashboard

---

## 2. Core business rules

- **Delivery fee:** flat 170 ден, added at checkout, always shown as its own line
- **Points earn rate:** 5% of order **subtotal excluding delivery fee**, rounded (e.g. 2000 ден subtotal → 100 points). Only earned when the customer is logged in at checkout.
- **Points redemption:** minimum 300 points required before redeeming; conversion rate 0.6 ден discount per point (300 pts = 180 ден off, 500 pts = 300 ден off). Adjustable — keep as configurable values, not hardcoded magic numbers.
- **Guest checkout:** allowed, but no points earned, and guests cannot track their order afterward — order tracking requires being logged in. The order-confirmation screen should prompt guests to sign in specifically to track the order they just placed.
- **Payment methods:** "Pay at delivery" is the only live method at launch — includes a confirmation step (owner calls to confirm before preparing) to guard against fake orders. "Pay by card" should exist in the UI as **disabled/"coming soon"** — no payment gateway is integrated yet (see §6).
- **Order statuses:** `Pending confirmation → Confirmed → Preparing → Shipped → Delivered`, plus `Cancelled`. Once shipped, delivery can take up to 3 business days — this is shown to the customer at checkout and in the confirmation screen.
- **Stock model:** no numeric inventory counts. Instead: a whole-product "sold out" toggle, AND independent per-color "sold out" toggles within a product (e.g. product in stock, but "Ivory" color specifically sold out).
- **Reviews:** one system, tied to delivered orders — a customer can leave a star rating + text review once their order status is "Delivered."

---

## 3. Data model (entities)

### Customer (ApplicationUser / Identity)
- Id, Name, Email, PasswordHash (via ASP.NET Core Identity), Phone
- Points (int, current balance)
- CreatedAt

### Product
- Id, Name, Description, BasePrice (decimal), Category (enum/string: Birthdays, Weddings, New baby, Graduation, Just because), Tags (string list, for search)
- SoldOut (bool) — whole-product toggle
- SizesEnabled (bool), CustomSizeEnabled (bool) — custom size uses a price calculator (owner defines a base unit price and quantity multiplier, e.g. "X ден per rose", rather than a fixed size list)
- ExtrasEnabled (bool)
- Images: collection of ProductImage { Url, ColorTag } — each image optionally tagged with the color it depicts, so the gallery can show a matching real photo per color when available, falling back to a generic image otherwise. **No requirement to have a photo per color combination.**

### ProductSize (child of Product)
- Id, ProductId, Name, PriceDelta (decimal)

### ProductColor (child of Product)
- Id, ProductId, Name, HexValue, SoldOut (bool) — independent of the product-level SoldOut

### ProductExtra (child of Product)
- Id, ProductId, Name, Price (decimal)

### Order
- Id, OrderNumber (display-friendly, e.g. sequential or short code), CustomerId (nullable — guest orders allowed), CustomerName, Phone, Email, DeliveryAddress
- Subtotal, DeliveryFee, PointsDiscount, Total (decimals)
- PointsEarned, PointsSpent (int)
- PaymentMethod (enum: PayAtDelivery, Card — Card unused until gateway exists)
- Status (enum, see §2)
- Note (customer's free-text note at checkout)
- CreatedAt, StatusUpdatedAt

### OrderItem (child of Order)
- Id, OrderId, ProductId, ProductNameSnapshot, Quantity
- SelectedSize, SelectedBoxColor, SelectedBalloonColor (strings — snapshot the choice, don't just FK to live product options, since products can change after the order is placed)
- CustomText (the message/name printed on the item)
- SelectedExtras (string list snapshot)
- UnitPrice, LineTotal

### Review
- Id, OrderId, ProductId, CustomerId, Rating (1–5), Text, CreatedAt

### DailyMetric (for analytics — populate via a scheduled job or on-the-fly aggregation)
- Date, VisitorCount, OrderCount, LoggedInCustomerCount

### NotificationSettings (single row, owner-configured)
- EmailEnabled, EmailAddress
- WhatsAppEnabled, WhatsAppNumber
- TelegramEnabled, TelegramHandle

---

## 4. API surface (REST, ASP.NET Core Web API)

Auth via ASP.NET Core Identity + JWT (or cookie auth) for customers; a separate owner/admin role gated behind its own login (the admin dashboard is a completely separate authenticated area, not just a customer with a flag — treat it as its own protected route group).

```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me

GET    /api/products              ?search=&category=&tag=
GET    /api/products/{id}
POST   /api/products              [admin]
PUT    /api/products/{id}         [admin]
PATCH  /api/products/{id}/sold-out            [admin]
PATCH  /api/products/{id}/colors/{colorId}/sold-out   [admin]

GET    /api/cart                  (or handle cart client-side only, submit at checkout)
POST   /api/orders                (create order — works for guest or logged-in)
GET    /api/orders/mine           [auth] — customer's own orders
GET    /api/orders                [admin] ?status=&search=
GET    /api/orders/{id}           [admin]
PATCH  /api/orders/{id}/status    [admin]

GET    /api/customers             [admin] ?search=
GET    /api/customers/{id}        [admin]

POST   /api/reviews               [auth] — only for own delivered orders
GET    /api/products/{id}/reviews

GET    /api/analytics/daily       [admin] ?range=7d|30d
GET    /api/analytics/overview    [admin]

GET    /api/notification-settings [admin]
PUT    /api/notification-settings [admin]
```

Order creation (`POST /api/orders`) is the one endpoint with real business logic: validate stock/sold-out state, compute subtotal/delivery/points server-side (never trust client-computed totals), apply points redemption if requested and the customer has enough, deduct/award points, persist the order, and trigger the owner notification (email/WhatsApp/Telegram per whatever's enabled in NotificationSettings).

---

## 5. Frontend structure (Angular)

Two separate Angular apps (or one workspace with two projects) mirroring the two React prototypes:

**Customer app routes:** `/`, `/shop`, `/product/:id`, `/cart`, `/checkout`, `/login`, `/signup`, `/profile`, `/wishlist`, `/faq`

**Admin app routes** (separate login, separate layout): `/admin/login`, `/admin/overview`, `/admin/analytics`, `/admin/orders`, `/admin/products`, `/admin/customers`, `/admin/notifications`

Recommend Angular Material or a lightweight custom component set styled with the design tokens above — the prototypes used Tailwind-style utility spacing with inline hex colors; translate that into SCSS variables/a theme file in Angular rather than hardcoding hex everywhere.

---

## 6. Explicitly deferred / open decisions (do not build yet, but design around them)

- **Payment gateway:** Stripe doesn't operate in North Macedonia. Real options are CaSys/cPay (via a local bank) or 2Checkout/Verifone — needs business registration first. Build the payment method as an extensible enum/strategy so card payment can be slotted in later without restructuring checkout.
- **Notification delivery:** the owner dashboard has a settings UI for email/WhatsApp/Telegram, but no provider is wired up yet (e.g. SendGrid for email, Twilio or WhatsApp Business API, Telegram Bot API). Implement as an `INotificationSender` interface with a no-op/logging implementation for now.
- **Hosting/launch platform:** not yet decided — revisit once the app is functional locally.
- **Chatbot for customer questions/custom orders:** planned but out of scope for this phase.

---

## 7. What's already validated (don't re-litigate)

- Points formula, redemption threshold, and delivery fee amounts above are final, not placeholders.
- No live "recolor the photo" preview — tagged real photos + swatches only.
- No numeric stock counts — sold-out toggles only.
- Guest checkout stays allowed; login is nudged, not required, except for tracking.
