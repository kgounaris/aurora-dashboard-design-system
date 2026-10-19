# Choice

Checkbox, radio and switch share one label anatomy: an 18px control, a 10px gap, the 13px label, optional help under it. Checked controls take the base gradient and the accent glow, so a form's selections read like the active nav tile.

## Which one

- **Checkbox** — independent yes/no options, or several from a list. Submitted with the form.
- **Radio** — exactly one of 2–5 mutually exclusive options; always one preselected. More than five: use a Select.
- **Switch** — a setting that takes effect immediately (Maintenance mode, Auto-restart). Never inside a form that has a Save button; that is a checkbox.

## Don't

- Don't use a switch for consent or anything that needs a submit.
- Don't put the control after the label; it sits first so the column of controls aligns.
- Don't rely on the glow to show "on": checked also changes fill and shows a mark, and the switch moves its thumb.

## Anatomy

- Control 18px, `radius 5` (radio: circle), `field-border-hover` rim on `field-bg`; checked `action-fill → action-fill-strong` with `action-rim`, `action-sheen` and `glow-accent` (the primary button's glass); mark `ink-on-accent`.
- Switch 36×20, thumb 14px `ink-secondary` → `ink-on-accent` when on.
- Focus 3px `focus-ring`; disabled `ink-disabled` label, `surface-200` control.
- Help: `<span class="au-help">` inside the label's text span.

```html
<label class="au-choice"><input type="checkbox" checked> Remember this device</label>
<label class="au-choice"><input type="checkbox" class="au-switch"> Maintenance mode</label>
```
