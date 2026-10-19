# TrendArea

A smooth rising line with a soft gradient area beneath it, a blurred halo and dot markers — the greeting card's background chart. It is decorative-first: it shows the shape of a trend, not exact values, so it has no axes, no gridlines and no labels.

## Use it for

- A single series over time where the *direction* is the message (momentum, streaks, weekly output).
- Behind or beside a headline, at 100–120px tall, filling the available width.

## Don't

- Don't add a second series; use **WaveLine** for a two-line composition.
- Don't use it when the reader needs to read a value — add a labelled chart instead.
- Don't set `curve: 'basis'` for real data; it rounds corners through the points. Keep `monotone`.

## Anatomy

- **Area** — `accent` at 45% opacity fading to 0 (`gradient` top→bottom).
- **Line** — `accent-soft`, 2.5px, round caps, drawn on over 1.1s.
- **Halo** — the same path at 7px, 50% opacity, behind the line, blurred (SVG `feGaussianBlur`, σ=3).
- **Markers** — `accent-pale` dots, r=3, each with its own blurred r=6 halo at 55%. `markers: 'auto'` places one every ~fifth point; pass explicit indices to mark events.

## Consumer provides

A sized container. Width defaults to the container's width; pass `height`. Call `update({data})` to re-render with new values.

```js
const trend = Aurora.TrendArea('#hero-trend', { data: weekly, height: 110, markers: [2, 5, 8] });
trend.update({ data: nextWeek });
```
