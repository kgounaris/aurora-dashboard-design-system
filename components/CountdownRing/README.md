# CountdownRing

A RadialProgress driven by a clock: the arc empties as time passes, the center shows `mm:ss` in tabular figures and a caption beneath — the Focus Timer. The default palette is the warm one (`ember-soft → ember`) so a running timer reads as a different kind of thing from a progress ring.

## Use it for

- Time-boxed sessions: focus blocks, breaks, cooldowns.
- Anything where the reader should feel time draining rather than filling.

## Don't

- Don't use the blue accent palette on it; blue rings mean progress in Aurora.
- Don't render the controls inside the ring. Put a glass button (`.au-btn`) below and bind it to `toggle()`.
- Don't hide the remaining time; the ring alone is not legible to the second.

## Anatomy

- Same geometry as RadialProgress at 132px / 7px, `glow` on.
- **Readout** — 24px/700 `ink`, tabular numerals; **caption** — 10px `ink-muted`.
- The ring repaints each second without animation (a 1s tween would lag the clock).

## API

`start()`, `pause()`, `reset(seconds?)`, `toggle()` (start → pause → resume, or reset once it hits zero), `state()`.
Callbacks: `onTick(remaining)`, `onEnd()`, `onChange({remaining, running, total})` — use `onChange` to relabel the button.

## Consumer provides

The button and its label logic (see the preview), and what happens on `onEnd`.

```js
const t = Aurora.CountdownRing('#focus', { seconds: 1500, caption: 'Deep Work', onEnd: notify });
startButton.onclick = () => t.toggle();
```
