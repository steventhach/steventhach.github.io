# Channel-tag rewrite QA — 2026-10-26

*Pipeline Builder. Local Playwright (Chrome headless) against `python3 -m http.server 8765` serving `/workspace/affiliate/deploy/steventhach.github.io`. America/Chicago.*

**Root cause fixed:** Pins/ads land on `?src=pinterest|facebook|tiktok` but site JS only honored Galley FB via `utm_source`/`fbclid` — never `src=`. K-Beauty/Cozy/(other niches) had no rewrite. Associates saw placement tags only (“Other”).

**Channel map (Amazon Lead confirmed):**

| Channel | Tag |
|---|---|
| facebook / fb / fbclid / paid_social+fb | `galleyworks-facebook-20` |
| pinterest / pin | `worthitedit-pinterest-20` |
| tiktok / tt | `worthitedit-tiktok-20` |

Persist key: `sessionStorage.wie_channel`. No channel signal → placement tags unchanged.

## Matrix

| Page | Query | Result | Sample / tag counts |
|---|---|---|---|
| `/galleyworks/` | `(bare)` | **PASS** — placement only ({'galleyworks-sticky-20': 2, 'galleyworks-hero-20': 3, 'galleywo | `galleyworks-sticky-20`×2, `galleyworks-hero-20`×3, `galleyworks-top3-20`×6, `galleyworks-grid-20`×36; e.g. `…tag=galleyworks-sticky-20` |
| `/galleyworks/` | `?src=pinterest` | **PASS** — ALL 47 amazon links → worthitedit-pinterest-20 | `worthitedit-pinterest-20`×47; e.g. `…tag=worthitedit-pinterest-20` |
| `/galleyworks/` | `?src=facebook` | **PASS** — ALL 47 amazon links → galleyworks-facebook-20 | `galleyworks-facebook-20`×47; e.g. `…tag=galleyworks-facebook-20` |
| `/kbeauty/` | `(bare)` | **PASS** — placement only ({'kbeauty-hero-20': 3, 'kbeauty-top3-20': 6, 'kbeauty-grid-20':  | `kbeauty-hero-20`×3, `kbeauty-top3-20`×6, `kbeauty-grid-20`×31, `kbeauty-sticky-20`×1; e.g. `…tag=kbeauty-hero-20` |
| `/kbeauty/` | `?src=pinterest` | **PASS** — ALL 41 amazon links → worthitedit-pinterest-20 | `worthitedit-pinterest-20`×41; e.g. `…tag=worthitedit-pinterest-20` |
| `/kbeauty/` | `?src=facebook` | **PASS** — ALL 41 amazon links → galleyworks-facebook-20 | `galleyworks-facebook-20`×41; e.g. `…tag=galleyworks-facebook-20` |
| `/cozy/` | `(bare)` | **PASS** — placement only ({'cozy-hero-20': 2, 'cozy-top3-20': 3, 'cozy-grid-20': 56, 'cozy | `cozy-hero-20`×2, `cozy-top3-20`×3, `cozy-grid-20`×56, `cozy-sticky-20`×1; e.g. `…tag=cozy-hero-20` |
| `/cozy/` | `?src=pinterest` | **PASS** — ALL 62 amazon links → worthitedit-pinterest-20 | `worthitedit-pinterest-20`×62; e.g. `…tag=worthitedit-pinterest-20` |
| `/cozy/` | `?src=facebook` | **PASS** — ALL 62 amazon links → galleyworks-facebook-20 | `galleyworks-facebook-20`×62; e.g. `…tag=galleyworks-facebook-20` |
| `/gadgets/` | `?src=tiktok` | **PASS** — ALL 43 amazon links → worthitedit-tiktok-20 | `worthitedit-tiktok-20`×43; e.g. `…tag=worthitedit-tiktok-20` |
| `/fridge-shelf/` | `?src=tiktok` | **PASS** — ALL 30 amazon links → worthitedit-tiktok-20 | `worthitedit-tiktok-20`×30; e.g. `…tag=worthitedit-tiktok-20` |
| `/galleyworks/` | `?fbclid=QaTest123` | **PASS** — ALL 47 amazon links → galleyworks-facebook-20 | `galleyworks-facebook-20`×47; e.g. `…tag=galleyworks-facebook-20` |

**Summary:** ALL PASS (12/12).

## Files

- Shared channel IIFE in every live niche `app.js` (group `site/` + deploy mirror).
- Galley: replaced old FB-only block (no dual rewriters).
- JSON blobs rewritten when present: `#gw-data`, `#picks-data`, `#data`; capture-phase click handler for late quiz CTAs.

## Do not

- No new ASINs, no pin URL changes, no placement-tag breakage on bare URLs.

