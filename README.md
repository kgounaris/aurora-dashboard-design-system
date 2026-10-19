# Aurora

Aurora is the design system behind our dashboards: dark, glassy surfaces lit from behind by colored glows, with thin luminous charts drawn in D3. This first release covers the **foundations** (color, type, spacing, radius, glass) and the **chart family** — the six distinct visualizations of the Aurora dashboard. Controls, cards and navigation come next.

## Principles

1. **Light, not shadow.** Elevation is a colored halo in the element's own hue, never a gray drop shadow. On the dark ground a card may have `lift`; in light it must not.
2. **Glass shows what's behind it.** Surfaces are translucent (`surface-100`) over `backdrop-filter: blur(18px)`, so the ground's `glow-warm` and `glow-cool` bleed through. A card's own color is a thin tint, not a fill.
3. **Four color roles, and they mean something.** `base` blue is the brand and anything without a health meaning. `healthy`, `warning` and `danger` are reserved for state — a reader must be able to trust that green is fine and red is an incident. Violet appears only as the far stop of the base headline-ring gradient.
4. **Thin marks, strong glow.** Lines 2.5px, columns 7px, meters 4px, rings 7–10px — always with a blurred halo of the same color behind them.
5. **Charts say one thing.** No axes or gridlines on the ambient charts; one highlighted value with one tooltip on the measured ones; the number always also in text.

## Color

Two themes, **dark** first. Grounds are nearly black navy (`surface-000`) with three radial glows positioned right-middle (warm), bottom-center (cool) and left-of-center (violet, faint). Text runs `ink → ink-secondary → ink-muted → ink-faint`; use the faintest only for de-emphasised axis labels. In the light theme the small inner fills (`surface-200`, `track`) are tinted with the base blue rather than gray, so nothing reads as a dirty patch on white glass.

### The four roles

Aurora is built for monitoring, so color carries state. Each role has a solid (fill, text) and a `-soft` stop (the light end of its gradient and its halo).

| Role | Token | Dark | Light | Means |
| --- | --- | --- | --- | --- |
| **Base** | `base` | `#3b82f6` | `#3b82f6` | brand; progress, selection, links; metrics with no health meaning (throughput, requests, completion) |
| **Healthy** | `healthy` | `#22c55e` | `#16a34a` | operational, passing checks, within error budget, utilization ≤ 50% |
| **Warning** | `warning` | `#f97316` | `#ea580c` | degraded, elevated latency, SLO at risk, utilization 50–90% |
| **Danger** | `danger` | `#ef4444` | `#dc2626` | outage, failing checks, error budget exhausted, utilization > 90% |

Rules:

- A state color is never decorative. If something is orange, it is in warning. TrendArea stays in base; WaveLine colors each series by its `status`, and unset series cycle the four roles only on a neutral comparison.
- **Utilization thresholds** are system-wide: ≤ 50% healthy, 50–90% warning, > 90% danger. Charts expose them as `status: 'auto'` with `thresholds: [0.5, 0.9]`; change them per metric only with a documented reason (a database at 70% disk may already be a warning — pass `[0.4, 0.7]`).
- High-is-good metrics (uptime, success rate, cache hits) never use `'auto'`; set the status from your own rule so 99.9% uptime is green.
- Never hue alone: the three states also differ in lightness, and the word ("Warning", "Degraded") appears next to the color.
- `accent*` and `ember*` remain as aliases of `base*` and `warning*` for existing markup.

Contrast: `ink-muted` on `surface-000` passes 4.5:1 in both themes; `ink-faint` is for 11px labels that are not the primary reading and sits at ~3.4:1 — pair it with a highlighted sibling in `ink`.

## Typography

Inter for UI and JetBrains Mono for data (both hosted by Google Fonts; no files shipped). Mono is for things that are *read as values* — timestamps, log lines, request paths, IDs, IPs — and never for labels or prose. Big numbers use tight tracking (−0.02 to −0.03em) and tabular numerals where they tick (`number-md`). Card titles are `title` (15/600); everything explanatory is `caption` (12) or `label` (11/500). `overline` is uppercase with +0.06em tracking.

## Spacing and radius

A 4px base: `space-2` between bars and in tight stacks, `space-4` as the card grid gap, `space-5` as card padding, `space-6` for page gutters. Radii grow with the surface: `radius-sm` for chips, `radius-md` for nav tiles, `radius-xl` for cards, `radius-2xl` for the sidebar rail, `radius-pill` for anything that is a bar, pill, meter or checkbox.

## Glass (the surface recipe)

```css
.glass {
  background: var(--surface-100);
  border: 1px solid var(--border-100);
  box-shadow: var(--edge), var(--lift);
  backdrop-filter: blur(18px) saturate(140%);
  border-radius: var(--radius-xl);
}
```

Rules: no `backdrop-filter` nested inside a glass surface (pills and tiles use plain `surface-200`); no CSS `filter` on children of a glass surface — Chromium paints the element's backdrop as a rectangle. Glow inside glass is `box-shadow` on HTML and `feGaussianBlur` inside SVG.

## Charts

The bundle exposes `window.Aurora` with six D3 factories. Each takes `(container, options)`, returns `{update, destroy}`, reads its colors from `tokens.css` at render time (so it follows `data-theme`), and draws its halo as a blurred SVG copy of the mark.

| Component | Dashboard card | Says |
| --- | --- | --- |
| **TrendArea** | Greeting background | the shape of a trend |
| **WaveLine** | Current Mood | several series compared, one solid role color per line, with legend |
| **RadialProgress** | Productivity (128px), System Status gauge (96px) | one bounded value, colored by status (base / healthy / warning / danger / auto) |
| **CountdownRing** | Focus Timer | time draining |
| **ColumnChart** | Weekly Activity | a short series with one headline |
| **ProgressBar** | Storage / Battery / Network | several values to compare |
| **DataTable** | Logs, events, hosts | rows with typed columns: time, level badge, status dot, mono message, numbers |

Unscaled charts (TrendArea, WaveLine) must not be the only source of a number. Measured charts (ColumnChart, ProgressBar, RadialProgress) always show the value as text as well.

## Forms

Form controls are CSS components in `bundle.css` (no script): **Button** (`.au-btn` glass, `-primary`, `-ghost`, `-danger`; `-sm`/`-lg`, `-block`, `-icon`, `.au-loading`), **TextField** (`.au-field` › `.au-label` + `.au-control` › `.au-input` / `.au-select` / `.au-textarea` + `.au-help`; states `.au-invalid`, `.au-valid`, `disabled`) and **Choice** (`.au-choice` › checkbox, radio, or `.au-switch`).

Text in forms:

- Labels are always visible, 12px/500 `ink-secondary`; optional fields say *optional*, required ones say nothing.
- Placeholders (`ink-placeholder`) are examples of the expected value, never instructions, and never the only label.
- Help text is one line in `ink-muted`; an error replaces it in `danger` and tells the user what to do.
- One primary button per form, full width in a card (`.au-btn-block`), label as a verb: *Sign in*, *Save changes*, *Create host*. Primary and danger buttons are lit glass (`action-fill`, `action-rim`, `action-sheen` + glow), never a solid block; only the light theme firms the fill up for contrast.
- Focus is the same everywhere: `base` border plus a 3px `focus-ring`.

## Consuming

Load `components/lib/d3.min.js` (D3 7.9.0), then `tokens.css`, `components/bundle.css`, `components/bundle.js`. Set `data-theme="dark"` or `"light"` on `<html>`. Then:

```js
Aurora.RadialProgress('#ring', { value: 0.78 });
Aurora.ColumnChart('#week', { data: [{ label: 'Mon', value: 4.2 }, /* … */] });
const t = Aurora.CountdownRing('#focus', { seconds: 1500 }); button.onclick = () => t.toggle();
```

## Roadmap

Next: the glass card, sidebar rail and nav tile, pills, list rows (service, alert) as components, filters and search for tables, a detail drawer, dialogs, and toasts for alert notifications.
