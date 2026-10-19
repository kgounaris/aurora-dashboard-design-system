# TextField

A labelled field: label on top, the control, and one line of help under it. The same anatomy serves text inputs, passwords, selects and textareas, so forms line up whatever they mix.

## Text

- **Label** — 12px/500 `ink-secondary`, always visible; never rely on the placeholder as the label. Mark optional fields with `<span class="au-optional">optional</span>`; never mark required ones with an asterisk.
- **Placeholder** — `ink-placeholder`, an *example* or format hint (`you@company.com`, `vps-athens-01`), never an instruction. It disappears on typing, so anything the user must remember goes in help text.
- **Help** — 12px `ink-muted`, one line. In the error state it turns `danger` with a 12px icon and says what to do (“Spaces are not allowed; use hyphens.”), not just that it's wrong.
- **Value** — 13px `ink`. Monospace values (keys, hostnames) may add `.au-type-mono` to the input.

## States

Rest `field-border` on `field-bg` · hover `field-border-hover` · focus `base` border + 3px `focus-ring` · **invalid**: the field is lit in `danger` the way everything else in Aurora is lit — a 70% danger rim, a 7% danger tint in the fill and a faint 10px danger halo (set `aria-invalid` and point `aria-describedby` at the help); on focus the rim goes solid and the ring is danger · **valid**: the same construction in `healthy`, used sparingly (async checks like “hostname available”) · disabled `ink-disabled` on `surface-200`, no highlight.

## Anatomy

- Control height 40px, `radius-md`, `edge` highlight; textarea min 96px, resizes vertically.
- Leading icon: `.au-has-icon` + `<svg class="au-icon">` (16px, `ink-muted`).
- Trailing action: `.au-has-action` + `<button class="au-action">` (28px hit area) — show/hide password, clear, copy.
- Select: wrap in `.au-select-wrap`; the chevron is drawn by CSS, the native menu is used.
- Two fields side by side: `.au-form-row`.

```html
<div class="au-field au-invalid">
  <label class="au-label" for="host">Hostname</label>
  <div class="au-control"><input class="au-input" id="host" aria-invalid="true" aria-describedby="host-help"></div>
  <div class="au-help" id="host-help">Spaces are not allowed; use hyphens.</div>
</div>
```

## Consumer provides

`id`/`for` pairing, `autocomplete` on sign-in fields, and the validation logic that toggles `.au-invalid` and the help text.
