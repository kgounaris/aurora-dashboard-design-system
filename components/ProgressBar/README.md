# ProgressBar

A labelled horizontal meter in three cells — label, track, value — with a 4px glowing fill. Stack three or four of them for a status block (Storage · Battery · Network).

## Use it for

- Several bounded values the reader compares at a glance, each with its number.
- Dense rows: the meter is 4px and the row is one line of 12px text.

## Don't

- Don't use it for a single hero value; that is a **RadialProgress**.
- Color a meter by `status` only when the row has a state (a volume above threshold). Mixed rows are fine — the label and value still carry the reading — but never pick a hue outside the four roles.
- Don't drop the value cell. The meter is not readable to 5%.

## Anatomy

- **Label** — 12px `ink-muted`, fixed `labelWidth` (58px) so meters align across rows.
- **Track** — `track`, `height` 4px, pill.
- **Fill** — gradient from the role's solid to its `-soft` stop, left→right, **within one hue** (`healthy → healthy-soft`, never toward blue); animates in over 0.8s. `status: 'auto'` applies the utilization thresholds like RadialProgress.
- **Halo** — fill 1px taller each side, the role's solid at 70%, blurred σ=2.5.
- **Value** — 12px/500 `ink`, right-aligned in `valueWidth` (34px).

## Consumer provides

A container per row (the meter fills it); `label`, `value` (0–1), optionally `format`, and `status` (or `'auto'` for utilization).

```js
Aurora.ProgressBar('#root', { label: '/ root', value: 0.94, status: 'auto' });    // → danger
Aurora.ProgressBar('#var',  { label: '/var',   value: 0.61, status: 'auto' });    // → warning
Aurora.ProgressBar('#net',  { label: 'Network', value: 0.82 });                   // base
```
