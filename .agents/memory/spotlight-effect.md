---
name: Card spotlight effect
description: How the cursor-following spotlight glow on dashboard cards works and its constraints
---

# Card mouse-spotlight glow (YucaTanaTrades)

`.spotlight` utility (index.css) + `useSpotlight` hook render a radial glow that follows the cursor inside a card. Hook writes `--mx`/`--my` CSS vars (rAF-throttled); CSS draws a `radial-gradient` on `::after`. Color per-card via `--spot-color` (gold neutral, emerald positive, amber/red risk).

**Constraint — only one `::after` per element.** `.spotlight` uses `::after`, and so does `.scan-effect` (the gold scan line on AI panels). Do NOT put both classes on the same element — they conflict. The AI Briefing panel keeps `scan-effect` and is intentionally excluded from the spotlight.

**Why mix-blend-mode: screen.** Keeps text crisp on hover — screen only lightens, never darkens, so the glow reads as light reflection without dimming numbers.

**How to apply:** wrap a card in `SpotlightCard` (in home.tsx) or add `spotlight` class + `useSpotlight` ref/onMouseMove + `--spot-color` style manually. Disabled for touch/coarse pointers and prefers-reduced-motion at the CSS level.
