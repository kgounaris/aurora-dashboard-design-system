# RadialProgress

A single-value ring — a gradient arc with round ends on a `track` circle, a blurred halo behind the arc, and an optional value and label at the center. It is Aurora's primary monitoring gauge: one ring per resource or SLI, colored by **status**.

## Status

`status` picks the gradient from the color system:

| status | gradient | means |
| --- | --- | --- |
| `'base'` (default) | `base-soft → base → violet` | a metric with no health meaning: progress, completion, throughput |
| `'healthy'` | `healthy-soft → healthy` | operational, passing, within budget |
| `'warning'` | `warning-soft → warning` | degraded, elevated, SLO at risk |
| `'danger'` | `danger-soft → danger` | outage, failing, budget exhausted |
| `'auto'` | derived from `value` | **utilization**: ≤ 50% healthy · 50–90% warning · > 90% danger |

`'auto'` is for *utilization* metrics (CPU, memory, disk, connection pool, queue depth), where high is bad. Change the cut points with `thresholds: [warnAt, dangerAt]` (defaults `[0.5, 0.9]`). For metrics where high is good — uptime, cache hit ratio, success rate — set the status yourself from your own rule; never use `'auto'` on them, or 99.9% uptime renders red.

The sublabel takes the status color at 600 weight (so "Warning" reads as a word in orange), and the SVG carries `data-status` plus an `au-status-<status>` class for styling around it.

## Use it for

- One bounded value (0–100%): utilization, saturation, error budget remaining, completion.
- Two sizes: **128px / 10px** as a card's headline metric; **96px / 7–8px** as a gauge with its value inside, in rows of three or four.

## Don't

- Don't stack several values on one ring (no multi-series donuts).
- Don't go below 64px or thinner than 5px: the halo swallows the arc.
- Don't rely on hue alone: healthy/warning/danger also differ in lightness, but the sublabel (or a nearby word) must still say the state.
- Don't use `violet` for anything but the far stop of the base gradient.

## Anatomy

- **Track** — full circle in `track`.
- **Arc** — `d3.arc` with `cornerRadius = thickness`, gradient by status; `colors` overrides it.
- **Halo** — the same arc 1.5px wider on each side, 55% opacity, blurred σ=3.5, in the arc's own gradient.
- **Label / sublabel** — 24px/700 `ink` (20px under 120px) and 10px, `ink-muted` for base or the status color for a state.
- Animates from the previous value to the new one over 1s on `update()`.

## Consumer provides

The value, the status rule for non-utilization metrics, and a visible number nearby if `label` is omitted. The ring is `role="img"` with an "N percent, status" label.

```js
Aurora.RadialProgress('#cpu',    { value: 0.38, size: 96, thickness: 8, status: 'auto', label: '38%', sublabel: 'CPU' });
Aurora.RadialProgress('#uptime', { value: 0.999, size: 96, thickness: 8, status: 'healthy', label: '99.9%', sublabel: 'Uptime' });
const ring = Aurora.RadialProgress('#progress', { value: 0.78 });   // base
ring.update({ value: 0.81 });
```
