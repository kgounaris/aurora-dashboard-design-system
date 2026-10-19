# Button

Pill buttons in four variants: **primary** (lit glass: a translucent base tint with a pale rim, top sheen and the accent glow — one per view), **glass** (the default `.au-btn`: translucent surface with a pale rim, for secondary actions), **ghost** (text only, for tertiary and inline actions) and **danger** (solid danger gradient, for destructive confirmations only).

## Use it for

- `primary` — the one action the screen exists for: Sign in, Save, Create.
- `glass` — alternatives beside the primary: Continue with SSO, Cancel in a dialog footer, Refresh.
- `ghost` — low-emphasis actions in toolbars and rows; icon-only buttons with `aria-label`.
- `danger` — Reboot, Delete, Revoke; pair it with a confirmation and never make it the default focus.

## Don't

- Don't put two primaries in one card or form.
- Don't use `danger` for anything reversible, and don't use it as a "warning" color — buttons act, they don't report state.
- Don't shrink a button below `sm` (28px) or drop the label on anything that isn't an icon with a universally understood meaning.

## Anatomy

- Height 34px (`sm` 28, `lg` 42), padding 0 20px, `radius-pill`, 13px/600 label, 16px icons with an 8px gap.
- Primary: `action-fill → action-fill-strong` gradient (translucent base in dark, near-solid in light), `action-rim`, `action-sheen` inset highlight, `glow-accent`, `ink-on-accent` label. It is glass with light behind it, not a painted block — the same construction as the active nav tile and checked controls.
- Danger: the same construction in `danger-fill`, `danger-fill-strong`, `danger-rim`.
- Glass: `surface-200` fill, `base-pale` rim, `edge` highlight; hover `surface-300`.
- Focus: border turns `base` plus a 3px `focus-ring` — identical across all variants.
- Loading: `.au-loading` hides the label and spins a 16px ring; set `aria-busy`.
- Disabled: `ink-disabled` text on `surface-200`, no glow, `not-allowed` cursor.
- `.au-btn-block` stretches to the container (forms); `.au-btn-icon` makes a square.

```html
<button class="au-btn au-btn-primary au-btn-block" type="submit">Sign in</button>
<button class="au-btn" type="button">Continue with SSO</button>
<button class="au-btn au-btn-ghost au-btn-sm au-btn-icon" aria-label="More"><svg …></svg></button>
```
