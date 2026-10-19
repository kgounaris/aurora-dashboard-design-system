# DataTable

A dense table for operational data — logs, events, hosts, requests, alerts. Columns declare a *type*, and the type decides how a cell is set: timestamps and identifiers in the mono face, numbers right-aligned in tabular figures, levels as role badges, states as a dot plus a word. Headers sort; the header stays pinned when the table scrolls inside `maxHeight`.

## Column types

| type | renders | use for |
| --- | --- | --- |
| `text` | plain sans, `ink` in the first column, `ink-secondary` after | names, services, users |
| `mono` | `mono-body`, `ink`, full value as `title` | log messages, request lines, IDs, IPs, hashes |
| `time` | `mono-caption`, `ink-muted`, tabular | timestamps — keep one format per table (`HH:mm:ss.SSS` for logs) |
| `number` | right-aligned, tabular | latency, counts, sizes; pass `format` for units |
| `level` | an `.au-badge` colored by role | log level, severity: `debug/trace → muted`, `info/notice → base`, `ok/success/resolved → healthy`, `warn/degraded → warning`, `error/crit/fatal/firing/down → danger` |
| `status` | dot + word | service state, check result (same role mapping) |

The role mapping is `Aurora.roleOf(value)`; unknown words fall back to `base`. Extend it in your own code rather than inventing a fifth color.

## Use it for

- Logs and event streams: time first, level second, source third, message last and widest, metrics right-aligned at the end.
- Lists the reader scans and sorts — hosts, requests, incidents.

## Don't

- Don't wrap cells. Rows are one line; the message truncates with an ellipsis and carries the full text in `title`. Open a detail view on `onRowClick` for the rest.
- Don't color whole rows by level; the badge carries the state so the eye can scan the level column.
- Don't put more than one `level`/`status` column in a table.
- Don't use `comfortable` density for logs; it is for short lists people act on row by row.

## Anatomy

- **Frame** — `surface-200` fill, `border-100` rim, `radius-md`.
- **Header** — 34px, 11px/500 uppercase `ink-muted` with +0.04em tracking; sorted column in `ink` with a `base` arrow; sticky over the scroll box on a 92% `surface-000` backing.
- **Rows** — 32px (`compact`) or 40px (`comfortable`), `border-100` rules, hover fill `surface-200`; optional `zebra`.
- **Footer** — row count (or your own string, or `false`).
- Empty state — centered `emptyText`.

## API

```js
const table = Aurora.DataTable('#logs', {
  columns: [
    { key: 'time', label: 'Time', type: 'time', width: 112 },
    { key: 'level', label: 'Level', type: 'level', width: 92 },
    { key: 'service', label: 'Service', width: 120 },
    { key: 'message', label: 'Message', type: 'mono' },
    { key: 'ms', label: 'Latency', type: 'number', width: 84, format: v => v == null ? '—' : v + ' ms' }
  ],
  rows, rowKey: 'id', maxHeight: 320, sortBy: { key: 'time', dir: 'desc' },
  onRowClick: row => openLog(row.id)
});
table.update({ rows: newRows });   // re-render with new data, sort kept
table.sort('ms', 'desc');
```

Columns: `key`, `label`, `type`, `width` (px or CSS), `align`, `format(value, row)`, `sortable: false` to pin one.

## Consumer provides

Rows with stable ids (`rowKey`), one time format, and a detail view for `onRowClick` if the message can be longer than the column. Load the JetBrains Mono face (Google Fonts) or the mono stack falls back to the system monospace.
