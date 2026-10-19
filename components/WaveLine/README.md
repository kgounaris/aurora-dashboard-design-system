# WaveLine

Smooth lines for comparing several series over the same span — services against each other, environments, regions. Each line is **one solid color** from the four roles (or an explicit token), with a soft halo behind it and a legend naming every line. There are no axes: it answers "which is rising, which is noisiest, which is worst", not "what is the value at 14:00".

## Series and color

```js
series: [{ name, data: number[], status?: 'base' | 'healthy' | 'warning' | 'danger', color?: string }]
```

- `status` picks the line color from the color system. Use it when the color *means* something — the service that is degraded is drawn in `warning`.
- With no `status`, series cycle `base → healthy → warning → danger` in order. That is fine for a neutral comparison of up to four lines, but never let a cycled color coincide with a real state on the same screen; set `status` explicitly then.
- `color` takes a token value for anything outside the roles (the violet, say). Keep it rare.
- Four lines is the practical maximum: beyond that the roles run out and the chart stops being readable. Split into two charts.

## Legend

Rendered by the component as an HTML list under the chart (`legend: 'top'` puts it above, `false` hides it when the names are already visible elsewhere). Each item is an 8px dot in the line's color with its own halo, and the name in 11px/500 `ink-muted`. Names should say the metric as well as the thing: "billing · p95 latency", not "billing".

## Don't

- Don't give one line a gradient stroke; a line is one color so the legend can name it.
- Don't mix metrics with different units on one chart; the shared Y scale would be meaningless.
- Don't use it to read a value; add a labelled chart for that.

## Anatomy

- **Lines** — 2.5px (`strokeWidth`), round caps and joins, `basis` curve by default (`curve: 'monotone'` passes through the points). Draw on over 1.1s, each 120ms after the previous.
- **Halo** — each line 4px wider at 45% opacity, blurred σ=3, in the same color.
- **Scale** — shared linear Y over all series, `nice()`d; 4px padding top and bottom.
- **Legend** — flex-wrapping list, 16px between items.

## Consumer provides

A sized container, the series (equal-length arrays, same unit), and names that include the metric.

```js
Aurora.WaveLine('#latency', {
  height: 90,
  series: [
    { name: 'api-gateway · p95', status: 'base', data: gw },
    { name: 'search · p95', status: 'danger', data: search }
  ]
});
```

A bare `data: number[]` still works and draws a single base line.
