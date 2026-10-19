# Consuming Aurora

Load, in this order:

```html
<link rel="stylesheet" href="tokens.css">
<link rel="stylesheet" href="components/bundle.css">
<script src="components/lib/d3.min.js"></script>   <!-- D3 7.9.0 -->
<script src="components/bundle.js"></script>        <!-- defines window.Aurora -->
```

Set the theme on the root (or any subtree): `<html data-theme="dark">` or `"light"`.
Fonts: Inter and JetBrains Mono from Google Fonts (see demo/index.html).

Charts: `Aurora.TrendArea / WaveLine / RadialProgress / CountdownRing / ColumnChart / ProgressBar / DataTable(container, options)` → `{ update, destroy }`.
Charts read their colors from the CSS variables at render time, so re-render (`update()`) after a theme change.
Forms are CSS only: `.au-btn`, `.au-field`, `.au-input`, `.au-choice`, … (see components/*/README.md).

Types for editors: `components/index.d.ts`.

## Regenerating tokens.css

`tokens.json` is the source. `tokens.css` is compiled from it (color and shadow per theme; spacing, radius and type once).
The Aurora design-system page generates its own copy on save; this one is equivalent and checked in for consumers.
