# ColumnChart

Thin pill-shaped columns, each standing on a full-height `track`, with one column emphasised and a tooltip chip above it — the Weekly Activity card. The tracks make the scale visible without gridlines; the single highlight makes the chart say one thing.

## Use it for

- A short categorical series (5–10 columns): days of a week, hours of a day, a handful of projects.
- When one value is the headline (the best day, today) — set `highlight` to it, or leave `'max'`.

## Don't

- Don't exceed ~12 columns; the tracks turn into a comb.
- Don't show several tooltips at once. One chip; hover moves it, leaving returns it to the highlight.
- Don't widen `barWidth` past ~10px — the glow is tuned for a thin stroke-like column.

## Anatomy

- **Track** — full height, `track`, radius = half the width.
- **Column** — gradient top→bottom `accent-soft → accent-strong → accent-strong@35%`, rises on load (60ms stagger).
- **Halo** — a 2px-wider copy of the column in `accent`, blurred σ=3.
- **Labels** — 11px/500; the highlighted one in `ink`, the rest `ink-faint`.
- **Tooltip** — `tooltip-bg` chip, `radius-sm`, 11px/600 `ink-on-tooltip`, 10px above the column top.
- Reserves 30px at the top for the chip and 22px at the bottom for labels; `height` includes both.

## Consumer provides

`data` as `[{label, value}]`, a `format` for the chip (default one decimal + "h"), and a sized container.

```js
Aurora.ColumnChart('#weekly', { data: days, highlight: 'max', format: v => v.toFixed(1) + 'h' });
```
