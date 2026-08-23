# Dekora — Product Page: Exact Implementation Spec

This replaces and supersedes anything about the product page in `dekora-ui-spec.md`. It describes the **approved, final version** of the product page in full detail — layout, exact copy, exact interaction behavior, and exact colors — so it can be rebuilt pixel-for-pixel in Angular. Follow this precisely; don't improvise a different layout, spacing, or interaction pattern for anything described below.

Reference file: `dekora-prototype.jsx`, `ProductView` component (and its `ReviewPopup` sub-component). Design tokens (colors/fonts) are the same as the rest of the spec — see §1 of `dekora-ui-spec.md`.

---

## Page structure, top to bottom

### 1. Breadcrumb
Small text row above everything, `text-xs`, color `ink-soft`, with a chevron-right icon between each segment: `Shop › [Category] › [Product name]`. The final segment (product name) is colored `ink` instead of `ink-soft` to show it's the current page.

### 2. Main two-column block (stacks to one column on mobile)

**Left column — photo gallery**
- Large image area: `rounded-3xl`, fixed height ~384px (`h-96`), soft diagonal gradient background (`linear-gradient(160deg, rose-tint, lilac)`), centered content.
- Inside it: a large circular color swatch (96px, `opacity-70`) representing the currently-selected gallery image — this is a **placeholder standing in for a real product photo**, not decorative art. It changes color when a different thumbnail is clicked.
- Top-left of the image area: a small pill badge, `card` background, `ink-soft` text, reading "Photo placeholder".
- Below the image: a row of 4 thumbnail buttons, each `flex-1`, height ~64px, `rounded-xl`, filled with a color swatch. The active thumbnail has a 2px `ink`-colored border; inactive ones have a 1px `line` border. Each thumbnail has a small label chip in its bottom-left corner (e.g. "Blush", "Gold", "Ivory", "Detail") — semi-transparent white background, `ink` text, tiny (`text-[9px]`).
- Caption below the thumbnails, centered, `text-xs`, `ink-soft`: "Real product photos go here — the owner can upload as many as they've shot, each tagged with the color it shows."

**Right column — details and options, top to bottom in this exact order:**

1. **Product name** — Fraunces, `text-3xl`, weight 500, `ink` color.
2. **Rating row (clickable)** — directly below the name, small gap above (`mt-2`). This is a `<button>`, not static text: a row of 5 star icons (filled coral for the rounded average rating, outline coral otherwise, 13px) followed by `"{avg} · {count} reviews"` in `text-xs ink-soft`. **Clicking anywhere on this row opens the review popup** (see §3 below). On hover, the text portion should dim slightly (`group-hover:opacity-70`) to signal interactivity.
3. **Price** — `text-xl`, weight 600, `ink` color, `mt-4`. This is the **live-computed total** (base price + size delta + selected extras), not a static base price — it updates instantly as the customer changes size/extras below.
4. **Description paragraph** — `text-sm`, `ink-soft`, relaxed line height, `mt-3`.
5. **Size selector** (`mt-7`): label "Size" (`text-sm`, weight 500, `ink`). Below it, a row of pill buttons (one per size, `flex-1` each so they share width equally), each showing the size name (bold, `ink`) on one line and a smaller description + price delta line below it (e.g. "3 balloons, 25cm box · +250 ден", `text-[11px]`, `ink-soft`). The selected size has a `rose` border and `rose-tint` background; unselected ones have a `line` border and `card` background.
6. **Box color selector** (`mt-6`): label reads "Box color — {selected color name}" (the name updates live as you pick), `text-sm`, weight 500. Below it, a row of circular swatches (36px), each showing its actual color. The selected swatch gets a 2px `ink` border and a checkmark icon centered on top (white checkmark if the swatch itself is dark, e.g. charcoal; `ink`-colored checkmark otherwise, for contrast). Unselected swatches have a 1px `line` border, no checkmark.
7. **Balloon color selector** (`mt-6`): identical pattern to box color, separate row, separate label ("Balloon color — {selected name}").
8. **Custom text field** (`mt-6`): label "Text on the box (optional)". Single-line text input, `rounded-xl`, `line` border, placeholder "e.g. Happy birthday, Ivona", 28-character max length. Whatever is typed here becomes the item's `customText`.
9. **Extras** (`mt-6`): label "Add extras". Below it, one row per extra, each a full-width clickable label styled as a card: a small square checkbox indicator on the left (rose border, filled solid rose with a white checkmark when checked, transparent when unchecked), the extra's name next to it, and the price on the far right (`+180 ден` style, `text-xs ink-soft`). Selected rows get a `rose` border and `rose-tint` background instead of the default `line` border and `card` background.
10. **Note to shop** (`mt-6`): label "Anything else we should know?". Multi-line textarea (2 rows), placeholder "Delivery time, occasion details, special requests...".
11. **Add to cart button** (`mt-7`): full-width, solid `ink` background, `bg`-colored text, fully rounded, reads `"Add to cart — {live total} ден"`. Hover scales to 1.01, press scales to 0.98.
12. **Points line**: directly below the button, centered, `text-xs`, `coral`, weight 500: `"You'll earn {points} points with this order"` — computed as 5% of the live total, rounded (same formula as everywhere else in the app).

### 3. Review popup (modal — opens from either the header star row or the "Write a review" button in §4)
- Centered modal over a dimmed/blurred backdrop (`rgba(61,42,59,0.4)` + blur), same pop-in animation as every other modal in the app (backdrop fades in ~0.25s, card scales in from 0.9 with a slight overshoot ~0.3–0.4s).
- Card: `max-w-sm`, `rounded-3xl`, white background, generous padding (`p-7`).
- Header row: "Write a review" (Fraunces, `text-xl`, weight 500) with a small X close button on the right.
- Subtext directly below: "Tell other customers what you thought." (`text-xs`, `ink-soft`).
- **Star picker**: label "Your rating" (`text-xs`, weight 500), then 5 clickable star icons at a larger size (24px) than the display-only stars elsewhere — clicking a star sets the rating to that value (1–5), filled coral up to the clicked star.
- **Name field**: label "Your name (optional)", single-line input, placeholder "e.g. Marija K.". If left blank, the review is submitted as "Anonymous".
- **Review text field**: label "Your review", multi-line textarea (3 rows), placeholder "What did you think of this product?".
- **Submit button**: full-width, solid `ink` background, reads "Submit review". Disabled/no-op if the text field is empty. On submit: closes the popup and adds the new review to the **top** of the reviews list in §4 immediately (no page reload, no delay) — date shown as "Just now".

### 4. Reviews section (below the two-column block, full width)
- Starts with a top border (`line`) and generous top padding (`mt-16 pt-10`), max width constrained (`max-w-3xl`) so review text stays readable.
- Header row: on the left, "Reviews" (Fraunces, `text-2xl`, weight 500) with the average rating + star row + count directly beneath it ("{avg} out of 5 · {count} reviews"); on the right, a "Write a review" pill button (same dark `ink`-filled style as other primary buttons) that opens the same popup as §3.
- Below that: a vertical list of review entries, each separated by a thin `line` divider (no divider after the last one). Each entry: reviewer name (bold, `ink`) and relative date (`ink-soft`, small) on the same row, opposite ends; a star row (display-only, filled per that review's rating) beneath the name; the review text beneath that, `text-sm`, `ink-soft`, relaxed line height.
- Sample seed reviews (4 entries) exist for prototype/demo purposes — replace with real data once reviews are wired to the backend, but keep the exact visual structure above.

### 5. Trending now (below Reviews, full width)
- Top border + padding, matching the Reviews section's spacing rhythm (`mt-16 pt-10`).
- Section heading "Trending now" (Fraunces, `text-2xl`, weight 500) — **no "See all" link here** (unlike the homepage version of this same section, which does have one).
- Below it: the **exact same continuously auto-scrolling horizontal marquee** used on the homepage — same card style (220px wide, swatch image with discount/tag badge top-left, name, price with strike-through original if discounted), same ~28s linear loop that pauses on hover, same edge-fade mask, same duplicated-list-for-seamless-loop technique. This carousel shows the shop's current trending products regardless of which product page it's on (not filtered to the current product's category — that's the next section's job). Clicking a card navigates to that product's page.

### 6. Customers are also ordering (below Trending, full width — conditionally rendered)
- Same top border + spacing rhythm as the sections above it.
- Heading: "Customers are also ordering" (Fraunces, `text-2xl`, weight 500).
- A **static** (non-scrolling) grid — 2 columns on mobile, 4 on desktop — of up to 4 products that share the **same category** as the product currently being viewed, excluding the current product itself. Card style matches the shop page's product cards exactly (swatch image, discount badge if applicable, name, price with strike-through original if discounted) — no wishlist heart icon here (this section is about discovery, not saving).
- **If there are zero other products in the same category, this entire section is omitted** — no empty state, no heading with nothing under it. Don't pad the grid with unrelated products to force it to 4.

---

## Interaction summary (so nothing is ambiguous)

| Element | Action | Result |
|---|---|---|
| Star rating row under product name | Click | Opens the review popup |
| "Write a review" button in Reviews section | Click | Opens the same review popup |
| Star picker inside the popup | Click a star | Sets the draft rating (1–5) |
| "Submit review" in popup | Click (with text filled in) | Closes popup, new review appears at the top of the Reviews list instantly |
| Size / box color / balloon color options | Click | Updates selection, live price recalculates immediately |
| Any Trending or Related product card | Click | Navigates to that product's own page (resets all option selections to defaults) |
| Thumbnail in the photo gallery | Click | Swaps the main placeholder image's color/content |

---

## What NOT to change
- Don't add a live "recolor the actual photo" preview tied to color selection — this was explicitly decided against (see `dekora-technical-handoff.md` §7). The photo gallery placeholder is static per-thumbnail, not reactive to the color pickers below it.
- Don't make the Trending carousel on this page filterable or give it a "See all" link — that's specific to the homepage version.
- Don't merge the Reviews section's "Write a review" entry point with the header star-row entry point into a single element — they're two separate, redundant ways to reach the same popup, both should exist.
