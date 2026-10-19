/* @ds-bundle: {"format":4,"namespace":"Aurora","components":[{"name":"TrendArea"},{"name":"WaveLine"},{"name":"RadialProgress"},{"name":"CountdownRing"},{"name":"ColumnChart"},{"name":"ProgressBar"},{"name":"DataTable"},{"name":"Button"},{"name":"TextField"},{"name":"Choice"}]} */
/*
  Aurora charts — D3 7 chart factories.
  Every factory takes (container, options) and returns an instance with
  update(options) and destroy(). Colors default to the Aurora tokens read
  from CSS custom properties (tokens.css), so charts follow the theme.
  Glow is drawn as a blurred halo copy of the mark inside the SVG
  (feGaussianBlur), never a CSS filter: CSS filters inside a
  backdrop-filter card paint a visible box in Chromium.
*/
(function (global) {
  'use strict';
  var d3 = global.d3;
  if (!d3) { console.warn('Aurora: d3 not loaded'); }

  var uid = 0;
  function nextId(prefix) { uid += 1; return 'au-' + prefix + '-' + uid; }

  // Tokens are read from the chart's own container (so a subtree under
  // [data-theme="light"] themes its charts), falling back to <html>.
  function token(name, fallback, ctx) {
    try {
      var v = getComputedStyle(ctx || document.documentElement).getPropertyValue('--' + name).trim();
      return v || fallback;
    } catch (e) { return fallback; }
  }

  var T = function (ctx) {
    var tk = function (n, f) { return token(n, f, ctx); };
    var base = tk('base', '#3b82f6'), baseStrong = tk('base-strong', '#2563eb'), baseSoft = tk('base-soft', '#60a5fa'), basePale = tk('base-pale', '#93c5fd');
    var warning = tk('warning', '#f97316'), warningSoft = tk('warning-soft', '#fdba74');
    return {
      base: base, baseStrong: baseStrong, baseSoft: baseSoft, basePale: basePale,
      healthy: tk('healthy', '#22c55e'), healthySoft: tk('healthy-soft', '#86efac'),
      warning: warning, warningSoft: warningSoft,
      danger: tk('danger', '#ef4444'), dangerSoft: tk('danger-soft', '#fca5a5'),
      // legacy names, same values
      accent: base, accentStrong: baseStrong, accentSoft: baseSoft, accentPale: basePale,
      violet: tk('violet', '#a855f7'),
      ember: warning, emberSoft: warningSoft,
      track: tk('track', 'rgba(255,255,255,.07)'),
      ink: tk('ink', '#f1f5f9'),
      inkMuted: tk('ink-muted', '#8b94a8'),
      inkFaint: tk('ink-faint', '#5b6478'),
      tooltipBg: tk('tooltip-bg', '#1e293b'),
      inkOnTooltip: tk('ink-on-tooltip', '#ffffff'),
      font: tk('font-sans', 'Inter, system-ui, sans-serif'),
      mono: tk('font-mono', 'ui-monospace, Menlo, Consolas, monospace')
    };
  };

  /*
    Status resolution for monitoring metrics.
    status: 'base' | 'healthy' | 'warning' | 'danger' | 'auto'
    'auto' derives the status from the value with thresholds [warnAt, dangerAt]
    (default [0.5, 0.9]): value <= warnAt → healthy, <= dangerAt → warning, else danger.
    Returns { status, colors: [soft, strong] } for the ring gradient.
  */
  var DEFAULT_THRESHOLDS = [0.5, 0.9];
  function statusFor(value, status, thresholds) {
    var th = thresholds || DEFAULT_THRESHOLDS;
    if (status === 'auto' || status == null) {
      if (value <= th[0]) return 'healthy';
      if (value <= th[1]) return 'warning';
      return 'danger';
    }
    return status;
  }
  function statusColors(status, t) {
    switch (status) {
      case 'healthy': return [t.healthySoft, t.healthy];
      case 'warning': return [t.warningSoft, t.warning];
      case 'danger': return [t.dangerSoft, t.danger];
      default: return [t.baseSoft, t.base];
    }
  }

  function node(container) {
    return typeof container === 'string' ? document.querySelector(container) : container;
  }

  function measure(el, fallbackW, fallbackH) {
    var r = el.getBoundingClientRect();
    return { w: r.width || fallbackW, h: r.height || fallbackH };
  }

  // Re-render a width-measuring chart when its container's width changes, so
  // SVGs track the layout instead of freezing at their mount-time width.
  // Skips while an explicit width is pinned; passes resize=true so renders
  // triggered by a resize can suppress the intro animation. No-op where
  // ResizeObserver is unavailable.
  function autoResize(el, render, isPinned) {
    if (typeof ResizeObserver === 'undefined') return { destroy: function () {} };
    var lastW = el.getBoundingClientRect().width;
    var ro = new ResizeObserver(function () {
      if (isPinned && isPinned()) return;
      var w = el.getBoundingClientRect().width;
      if (w && Math.abs(w - lastW) > 0.5) { lastW = w; render(true); }
    });
    ro.observe(el);
    return { destroy: function () { ro.disconnect(); } };
  }

  // Adds <linearGradient> to defs; stops: [[offset, color], ...]
  function gradient(defs, id, stops, dir) {
    var g = defs.append('linearGradient').attr('id', id);
    dir = dir || { x1: 0, y1: 0, x2: 1, y2: 1 };
    g.attr('x1', dir.x1).attr('y1', dir.y1).attr('x2', dir.x2).attr('y2', dir.y2);
    stops.forEach(function (s) {
      var st = g.append('stop').attr('offset', s[0]).attr('stop-color', s[1]);
      if (s[2] != null) st.attr('stop-opacity', s[2]);
    });
    return 'url(#' + id + ')';
  }

  // Adds a blur filter to defs and returns url(#id)
  function blur(defs, id, sd) {
    defs.append('filter').attr('id', id)
      .attr('x', '-40%').attr('y', '-40%').attr('width', '180%').attr('height', '180%')
      .append('feGaussianBlur').attr('stdDeviation', sd == null ? 3.5 : sd);
    return 'url(#' + id + ')';
  }

  function baseSvg(el, w, h, className) {
    d3.select(el).selectAll('svg.au-svg').remove();
    var svg = d3.select(el).append('svg')
      .attr('class', 'au-svg ' + (className || ''))
      .attr('width', w).attr('height', h)
      .attr('viewBox', '0 0 ' + w + ' ' + h)
      .style('overflow', 'visible')
      .style('display', 'block');
    return svg;
  }

  /* ---------------------------------------------------------------- *
   * TrendArea — the greeting card's rising line: smooth line, soft
   * area fill beneath, glow, and dot markers on chosen points.
   * ---------------------------------------------------------------- */
  function TrendArea(container, opts) {
    var el = node(container);
    var state = Object.assign({
      data: [10, 15, 18, 26, 31, 40, 38, 52, 60, 56, 66, 78],
      width: null, height: 110,
      markers: 'auto',          // 'auto' | 'none' | number[] of indices
      area: true, glow: true, animate: true, curve: 'monotone'
    }, opts);

    function render(resize) {
      var anim = state.animate && !resize;
      var t = T(el);
      var m = measure(el, 320, state.height);
      var w = state.width || m.w, h = state.height;
      var svg = baseSvg(el, w, h, 'au-trend');
      var defs = svg.append('defs');
      var id = nextId('trend');
      var fill = gradient(defs, id + '-fill', [[0, t.accent, 0.45], [1, t.accent, 0]], { x1: 0, y1: 0, x2: 0, y2: 1 });
      var halo = blur(defs, id + '-blur', 3);

      var data = state.data;
      var x = d3.scaleLinear().domain([0, data.length - 1]).range([0, w]);
      var ext = d3.extent(data);
      var pad = (ext[1] - ext[0]) * 0.15 || 1;
      var y = d3.scaleLinear().domain([ext[0] - pad, ext[1] + pad]).range([h - 6, 8]);

      var curve = state.curve === 'basis' ? d3.curveBasis : d3.curveMonotoneX;
      var line = d3.line().x(function (d, i) { return x(i); }).y(function (d) { return y(d); }).curve(curve);
      var area = d3.area().x(function (d, i) { return x(i); }).y0(h).y1(function (d) { return y(d); }).curve(curve);

      if (state.area) svg.append('path').attr('class', 'au-trend-area').attr('d', area(data)).attr('fill', fill);
      if (state.glow) svg.append('path').attr('d', line(data)).attr('fill', 'none').attr('stroke', t.accentSoft).attr('stroke-width', 7).attr('stroke-opacity', 0.5).attr('filter', halo).attr('aria-hidden', 'true');
      var path = svg.append('path').attr('class', 'au-trend-line').attr('d', line(data)).attr('fill', 'none').attr('stroke', t.accentSoft).attr('stroke-width', 2.5).attr('stroke-linecap', 'round');

      var idx = state.markers === 'none' ? [] : Array.isArray(state.markers) ? state.markers
        : data.map(function (d, i) { return i; }).filter(function (i) { return i > 0 && i % Math.max(1, Math.round(data.length / 5)) === 0; });
      var dots = svg.append('g').attr('class', 'au-trend-markers');
      idx.forEach(function (i) {
        dots.append('circle').attr('cx', x(i)).attr('cy', y(data[i])).attr('r', 6).attr('fill', t.accentPale).attr('fill-opacity', 0.55).attr('filter', halo).attr('aria-hidden', 'true');
        dots.append('circle').attr('cx', x(i)).attr('cy', y(data[i])).attr('r', 3).attr('fill', t.accentPale);
      });

      if (anim) {
        var len = path.node().getTotalLength();
        path.attr('stroke-dasharray', len + ' ' + len).attr('stroke-dashoffset', len)
          .transition().duration(1100).ease(d3.easeCubicOut).attr('stroke-dashoffset', 0)
          .on('end', function () { path.attr('stroke-dasharray', null); });
        dots.selectAll('circle').attr('opacity', 0).transition().delay(function (d, i) { return 400 + i * 90; }).duration(300).attr('opacity', 1);
      }
      svg.append('title').text('Trend: ' + data[0] + ' to ' + data[data.length - 1]);
    }
    render();
    var ro = autoResize(el, render, function () { return state.width != null; });
    return { update: function (o) { Object.assign(state, o || {}); render(); }, destroy: function () { ro.destroy(); d3.select(el).selectAll('svg.au-svg').remove(); }, el: el };
  }

  /* ---------------------------------------------------------------- *
   * WaveLine — smooth multi-series lines for comparison. One solid
   * color per series (a status role or an explicit token), a soft halo
   * behind each, and a legend naming every line.
   * ---------------------------------------------------------------- */
  function WaveLine(container, opts) {
    var el = node(container);
    var state = Object.assign({
      series: null,             // [{ name, data: number[], status?: 'base'|'healthy'|'warning'|'danger', color?: string }]
      data: null,               // shorthand: a single number[] → one base series
      width: null, height: 64,
      legend: true,             // true | false | 'top'  (default renders below the chart)
      glow: true, animate: true, curve: 'basis', strokeWidth: 2.5
    }, opts);

    function seriesList() {
      if (state.series && state.series.length) return state.series;
      return [{ name: 'Series', data: state.data || [45, 40, 25, 28, 46, 55, 50, 30, 20, 28, 48, 50, 38] }];
    }
    function colorOf(sr, i, t) {
      if (sr.color) return sr.color;
      var role = sr.status || ['base', 'healthy', 'warning', 'danger'][i % 4];
      return statusColors(role, t)[1];
    }

    function render(resize) {
      var anim = state.animate && !resize;
      var t = T(el);
      d3.select(el).selectAll('.au-wave-wrap').remove();
      var wrap = d3.select(el).append('div').attr('class', 'au-wave-wrap').style('display', 'flex').style('flex-direction', state.legend === 'top' ? 'column-reverse' : 'column').style('gap', '10px');
      var chartHolder = wrap.append('div').attr('class', 'au-wave-chart');
      var m = measure(el, 280, state.height);
      var w = state.width || m.w, h = state.height;
      var svg = chartHolder.append('svg').attr('class', 'au-svg au-wave').attr('width', w).attr('height', h).attr('viewBox', '0 0 ' + w + ' ' + h).style('overflow', 'visible').style('display', 'block');
      var defs = svg.append('defs');
      var id = nextId('wave');
      var halo = blur(defs, id + '-blur', 3);

      var list = seriesList();
      var n = d3.max(list, function (s) { return s.data.length; });
      var all = [].concat.apply([], list.map(function (s) { return s.data; }));
      var x = d3.scaleLinear().domain([0, n - 1]).range([0, w]);
      var y = d3.scaleLinear().domain(d3.extent(all)).nice().range([h - 4, 4]);
      var curve = state.curve === 'monotone' ? d3.curveMonotoneX : d3.curveBasis;
      var line = d3.line().x(function (d, i) { return x(i); }).y(function (d) { return y(d); }).curve(curve);

      var colored = list.map(function (sr, i) { return { sr: sr, color: colorOf(sr, i, t) }; });
      colored.forEach(function (c) {
        if (state.glow) svg.append('path').attr('d', line(c.sr.data)).attr('fill', 'none').attr('stroke', c.color).attr('stroke-width', state.strokeWidth + 4).attr('stroke-opacity', 0.45).attr('filter', halo).attr('aria-hidden', 'true');
      });
      var paths = colored.map(function (c) {
        return svg.append('path').attr('class', 'au-wave-line').attr('d', line(c.sr.data)).attr('fill', 'none').attr('stroke', c.color).attr('stroke-width', state.strokeWidth).attr('stroke-linecap', 'round').attr('stroke-linejoin', 'round');
      });
      if (anim) {
        paths.forEach(function (p, i) {
          var len = p.node().getTotalLength();
          p.attr('stroke-dasharray', len + ' ' + len).attr('stroke-dashoffset', len)
            .transition().delay(i * 120).duration(1100).ease(d3.easeCubicOut).attr('stroke-dashoffset', 0)
            .on('end', function () { p.attr('stroke-dasharray', null); });
        });
      }
      svg.append('title').text(list.map(function (s) { return s.name; }).join(', '));

      if (state.legend) {
        var lg = wrap.append('div').attr('class', 'au-legend').attr('role', 'list')
          .style('display', 'flex').style('flex-wrap', 'wrap').style('gap', '6px 16px').style('font-family', t.font).style('font-size', '11px').style('font-weight', 500).style('color', t.inkMuted);
        colored.forEach(function (c) {
          var item = lg.append('div').attr('role', 'listitem').style('display', 'inline-flex').style('align-items', 'center').style('gap', '7px');
          item.append('span').attr('aria-hidden', 'true').style('width', '8px').style('height', '8px').style('border-radius', '999px').style('background', c.color).style('box-shadow', '0 0 8px ' + c.color);
          item.append('span').text(c.sr.name);
        });
      }
    }
    render();
    var ro = autoResize(el, render, function () { return state.width != null; });
    return { update: function (o) { Object.assign(state, o || {}); render(); }, destroy: function () { ro.destroy(); d3.select(el).selectAll('.au-wave-wrap').remove(); }, el: el };
  }

  /* ---------------------------------------------------------------- *
   * RadialProgress — a gradient arc on a track with a glowing halo.
   * Used at 128px for a headline metric and at 96px as a status gauge.
   * ---------------------------------------------------------------- */
  function RadialProgress(container, opts) {
    var el = node(container);
    var state = Object.assign({
      value: 0.78, size: 128, thickness: 10,
      status: 'base',           // 'base' | 'healthy' | 'warning' | 'danger' | 'auto'
      thresholds: null,         // for 'auto': [warnAt, dangerAt], default [0.5, 0.9]
      colors: null,             // explicit gradient stops override status; base default is base-soft → base → violet
      label: null, sublabel: null, glow: true, animate: true, round: true
    }, opts);
    var current = 0;

    function render() {
      var t = T(el);
      var s = state.size, th = state.thickness, r = s / 2 - th / 2;
      var status = statusFor(state.value, state.status, state.thresholds);
      var svg = baseSvg(el, s, s, 'au-radial au-status-' + status);
      svg.attr('role', 'img').attr('aria-label', Math.round(state.value * 100) + ' percent' + (status !== 'base' ? ', ' + status : ''));
      svg.attr('data-status', status);
      var defs = svg.append('defs');
      var id = nextId('radial');
      var colors = state.colors || (status === 'base' ? [t.baseSoft, t.base, t.violet] : statusColors(status, t));
      var stops = colors.map(function (c, i) { return [i / (colors.length - 1), c]; });
      var stroke = gradient(defs, id + '-grad', stops);
      var halo = blur(defs, id + '-blur', 3.5);
      var g = svg.append('g').attr('transform', 'translate(' + s / 2 + ',' + s / 2 + ')');

      var arc = d3.arc().innerRadius(r - th / 2).outerRadius(r + th / 2).startAngle(0).cornerRadius(state.round ? th : 0);
      g.append('path').attr('class', 'au-radial-track').attr('d', arc({ endAngle: Math.PI * 2 })).attr('fill', t.track);
      var haloPath = state.glow ? g.append('path').attr('fill', stroke).attr('fill-opacity', 0.55).attr('filter', halo).attr('aria-hidden', 'true') : null;
      var haloArc = d3.arc().innerRadius(r - th / 2 - 1.5).outerRadius(r + th / 2 + 1.5).startAngle(0).cornerRadius(state.round ? th : 0);
      var fg = g.append('path').attr('class', 'au-radial-value').attr('fill', stroke);

      function draw(v) {
        var a = Math.max(0, Math.min(1, v)) * Math.PI * 2;
        fg.attr('d', arc({ endAngle: a }));
        if (haloPath) haloPath.attr('d', haloArc({ endAngle: a }));
      }
      if (state.animate) {
        var from = current, to = state.value;
        g.transition().duration(1000).ease(d3.easeCubicOut).tween('arc', function () {
          var i = d3.interpolate(from, to);
          return function (k) { draw(i(k)); };
        }).on('end', function () { current = to; });
      } else { draw(state.value); current = state.value; }

      if (state.label != null) {
        var tx = g.append('text').attr('text-anchor', 'middle').attr('fill', t.ink).style('font-family', t.font).style('font-weight', 700)
          .style('font-size', (s >= 120 ? 24 : 20) + 'px').attr('y', state.sublabel ? -2 : 7).text(state.label);
        if (state.sublabel) g.append('text').attr('text-anchor', 'middle').attr('fill', status === 'base' ? t.inkMuted : statusColors(status, t)[1]).style('font-family', t.font).style('font-size', '10px').style('font-weight', status === 'base' ? 400 : 600).attr('y', 14).text(state.sublabel);
      }
    }
    render();
    return { update: function (o) { Object.assign(state, o || {}); render(); }, destroy: function () { d3.select(el).selectAll('svg.au-svg').remove(); }, el: el };
  }

  /* ---------------------------------------------------------------- *
   * CountdownRing — the focus timer: a RadialProgress driven by a
   * clock. Ember gradient by default. Returns start/pause/reset.
   * ---------------------------------------------------------------- */
  function CountdownRing(container, opts) {
    var el = node(container);
    var state = Object.assign({
      seconds: 25 * 60, size: 132, thickness: 7,
      colors: null,             // default ember-soft → ember
      caption: 'Deep Work', glow: true,
      onTick: null, onEnd: null, onChange: null
    }, opts);
    var remaining = state.seconds, running = false, timer = null, ring = null, labelEl = null;

    function fmt(sec) {
      var m = Math.floor(sec / 60), s = sec % 60;
      return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
    }
    function paint() {
      var t = T(el);
      ring.update({ value: remaining / state.seconds, animate: false, colors: state.colors || [t.emberSoft, t.ember], label: fmt(remaining), sublabel: state.caption, size: state.size, thickness: state.thickness, glow: state.glow });
      if (state.onChange) state.onChange({ remaining: remaining, running: running, total: state.seconds });
    }
    function tick() {
      if (!running) return;
      remaining = Math.max(0, remaining - 1);
      paint();
      if (state.onTick) state.onTick(remaining);
      if (remaining === 0) { running = false; clearInterval(timer); timer = null; if (state.onEnd) state.onEnd(); paint(); }
    }
    var api = {
      start: function () { if (running || remaining === 0) return; running = true; timer = setInterval(tick, 1000); paint(); },
      pause: function () { running = false; if (timer) clearInterval(timer); timer = null; paint(); },
      reset: function (sec) { api.pause(); if (sec != null) state.seconds = sec; remaining = state.seconds; paint(); },
      toggle: function () { if (running) api.pause(); else if (remaining === 0) api.reset(); else api.start(); },
      state: function () { return { remaining: remaining, running: running, total: state.seconds, text: fmt(remaining) }; },
      update: function (o) { Object.assign(state, o || {}); if (o && o.seconds != null) remaining = Math.min(remaining, state.seconds); paint(); },
      destroy: function () { api.pause(); ring.destroy(); },
      el: el
    };
    ring = RadialProgress(el, { value: 1, animate: false, size: state.size, thickness: state.thickness });
    paint();
    return api;
  }

  /* ---------------------------------------------------------------- *
   * ColumnChart — weekly activity: thin pill columns on full-height
   * tracks, one highlighted column with a tooltip chip above it.
   * ---------------------------------------------------------------- */
  function ColumnChart(container, opts) {
    var el = node(container);
    var state = Object.assign({
      data: [{ label: 'Mon', value: 4.2 }, { label: 'Tue', value: 3.1 }, { label: 'Wed', value: 5.0 }, { label: 'Thu', value: 3.6 }, { label: 'Fri', value: 4.6 }, { label: 'Sat', value: 7.8 }, { label: 'Sun', value: 4.0 }],
      highlight: 'max',         // 'max' | index | null
      format: function (v) { return v.toFixed(1) + 'h'; },
      width: null, height: 150, barWidth: 7, glow: true, animate: true, tooltip: true, hover: true
    }, opts);

    function render(resize) {
      var anim = state.animate && !resize;
      var t = T(el);
      var m = measure(el, 300, state.height);
      var w = state.width || m.w, h = state.height;
      var labelH = 22, tipH = 30;
      var svg = baseSvg(el, w, h, 'au-columns');
      var defs = svg.append('defs');
      var id = nextId('col');
      var fill = gradient(defs, id + '-fill', [[0, t.accentSoft], [0.55, t.accentStrong], [1, t.accentStrong, 0.35]], { x1: 0, y1: 0, x2: 0, y2: 1 });
      var halo = blur(defs, id + '-blur', 3);

      var data = state.data;
      var hi = state.highlight === 'max' ? data.indexOf(data.reduce(function (a, b) { return b.value > a.value ? b : a; })) : state.highlight;
      var x = d3.scaleBand().domain(data.map(function (d, i) { return i; })).range([0, w]).padding(0);
      var top = tipH, bottom = h - labelH;
      var y = d3.scaleLinear().domain([0, d3.max(data, function (d) { return d.value; })]).range([bottom, top]);
      var bw = state.barWidth;

      var cols = svg.append('g').selectAll('g').data(data).enter().append('g')
        .attr('transform', function (d, i) { return 'translate(' + (x(i) + x.bandwidth() / 2) + ',0)'; });

      cols.append('rect').attr('class', 'au-col-track').attr('x', -bw / 2).attr('y', top).attr('width', bw).attr('height', bottom - top).attr('rx', bw / 2).attr('fill', t.track);
      if (state.glow) cols.append('rect').attr('x', -bw / 2 - 2).attr('width', bw + 4).attr('rx', bw / 2 + 2).attr('fill', t.accent).attr('fill-opacity', 0.7).attr('filter', halo).attr('aria-hidden', 'true')
        .attr('y', function (d) { return y(d.value); }).attr('height', function (d) { return bottom - y(d.value); });
      var bars = cols.append('rect').attr('class', 'au-col-bar').attr('x', -bw / 2).attr('width', bw).attr('rx', bw / 2).attr('fill', fill)
        .attr('y', function (d) { return y(d.value); }).attr('height', function (d) { return bottom - y(d.value); });
      cols.append('text').attr('y', h - 4).attr('text-anchor', 'middle').style('font-family', t.font).style('font-size', '11px').style('font-weight', 500)
        .attr('fill', function (d, i) { return i === hi ? t.ink : t.inkFaint; }).text(function (d) { return d.label; });

      var tip = svg.append('g').attr('class', 'au-col-tip').style('pointer-events', 'none');
      function showTip(i) {
        if (!state.tooltip || i == null || i < 0) { tip.attr('opacity', 0); return; }
        var d = data[i], label = state.format(d.value);
        tip.selectAll('*').remove();
        tip.attr('transform', 'translate(' + (x(i) + x.bandwidth() / 2) + ',' + (y(d.value) - 10) + ')').attr('opacity', 1);
        var txt = tip.append('text').attr('text-anchor', 'middle').attr('y', -6).attr('fill', t.inkOnTooltip).style('font-family', t.font).style('font-size', '11px').style('font-weight', 600).text(label);
        var bb = txt.node().getBBox();
        tip.insert('rect', 'text').attr('x', bb.x - 7).attr('y', bb.y - 4).attr('width', bb.width + 14).attr('height', bb.height + 8).attr('rx', 7).attr('fill', t.tooltipBg);
      }
      showTip(hi);
      if (state.hover) {
        cols.style('cursor', 'default')
          .on('mouseenter', function (e, d) { showTip(data.indexOf(d)); })
          .on('mouseleave', function () { showTip(hi); });
      }
      svg.append('title').text(data.map(function (d) { return d.label + ' ' + state.format(d.value); }).join(', '));

      if (anim) {
        bars.attr('y', bottom).attr('height', 0).transition().duration(700).delay(function (d, i) { return i * 60; }).ease(d3.easeCubicOut)
          .attr('y', function (d) { return y(d.value); }).attr('height', function (d) { return bottom - y(d.value); });
      }
    }
    render();
    var ro = autoResize(el, render, function () { return state.width != null; });
    return { update: function (o) { Object.assign(state, o || {}); render(); }, destroy: function () { ro.destroy(); d3.select(el).selectAll('svg.au-svg').remove(); }, el: el };
  }

  /* ---------------------------------------------------------------- *
   * ProgressBar — a labelled horizontal meter: label · track · value.
   * The system-status rows. Renders a flex row of three cells with the
   * meter drawn in SVG so the halo stays inside it.
   * ---------------------------------------------------------------- */
  function ProgressBar(container, opts) {
    var el = node(container);
    var state = Object.assign({
      label: 'Storage', value: 0.78,
      format: function (v) { return Math.round(v * 100) + '%'; },
      labelWidth: 58, valueWidth: 34, height: 4, glow: true, animate: true,
      status: 'base',           // 'base' | 'healthy' | 'warning' | 'danger' | 'auto' (utilization thresholds)
      thresholds: null,
      color: null               // explicit token value; the light stop is derived from it
    }, opts);

    function render(resize) {
      var anim = state.animate && !resize;
      var t = T(el);
      d3.select(el).selectAll('.au-bar-row').remove();
      var row = d3.select(el).append('div').attr('class', 'au-bar-row')
        .style('display', 'flex').style('align-items', 'center').style('gap', '12px').style('font-family', t.font).style('font-size', '12px');
      row.append('div').style('width', state.labelWidth + 'px').style('color', t.inkMuted).text(state.label);
      var holder = row.append('div').style('flex', '1').style('min-width', '0');
      row.append('div').style('width', state.valueWidth + 'px').style('text-align', 'right').style('font-weight', 500).style('color', t.ink).text(state.format(state.value));

      var w = holder.node().getBoundingClientRect().width || 200, h = state.height, pad = 6;
      var svg = holder.append('svg').attr('class', 'au-svg au-bar').attr('width', w).attr('height', h + pad * 2).attr('viewBox', '0 0 ' + w + ' ' + (h + pad * 2)).style('display', 'block').style('overflow', 'visible');
      var defs = svg.append('defs');
      var id = nextId('bar');
      var status = statusFor(state.value, state.status, state.thresholds);
      var pair = statusColors(status, t);               // [soft, strong]
      var c = state.color || pair[1];
      var cSoft = state.color ? (d3.color(state.color) ? d3.color(state.color).brighter(0.7).formatHex() : state.color) : pair[0];
      svg.attr('data-status', status);
      // Fill runs strong → soft within the same hue; it never crosses into another role's color.
      var fill = gradient(defs, id + '-fill', [[0, c], [1, cSoft]], { x1: 0, y1: 0, x2: 1, y2: 0 });
      var halo = blur(defs, id + '-blur', 2.5);
      svg.attr('role', 'img').attr('aria-label', state.label + ' ' + state.format(state.value));

      svg.append('rect').attr('x', 0).attr('y', pad).attr('width', w).attr('height', h).attr('rx', h / 2).attr('fill', t.track);
      var target = Math.max(h, w * Math.max(0, Math.min(1, state.value)));
      var g = state.glow ? svg.append('rect').attr('x', 0).attr('y', pad - 1).attr('height', h + 2).attr('rx', h / 2 + 1).attr('fill', c).attr('fill-opacity', 0.7).attr('filter', halo).attr('aria-hidden', 'true') : null;
      var bar = svg.append('rect').attr('class', 'au-bar-value').attr('x', 0).attr('y', pad).attr('height', h).attr('rx', h / 2).attr('fill', fill);
      if (anim) {
        bar.attr('width', 0).transition().duration(800).ease(d3.easeCubicOut).attr('width', target);
        if (g) g.attr('width', 0).transition().duration(800).ease(d3.easeCubicOut).attr('width', target);
      } else { bar.attr('width', target); if (g) g.attr('width', target); }
    }
    render();
    var ro = autoResize(el, render, function () { return false; });
    return { update: function (o) { Object.assign(state, o || {}); render(); }, destroy: function () { ro.destroy(); d3.select(el).selectAll('.au-bar-row').remove(); }, el: el };
  }


  /* ---------------------------------------------------------------- *
   * DataTable — a dense data table for logs, events, hosts, requests.
   * Columns declare a type: text | mono | number | time | level | status.
   * Level and status cells render Aurora badges/dots from the color
   * roles. Sortable header, sticky header inside a scroll box, hover
   * rows, optional row click. Built with d3 data joins.
   * ---------------------------------------------------------------- */
  var LEVELS = {
    trace: 'muted', debug: 'muted', info: 'base', notice: 'base', ok: 'healthy', success: 'healthy', resolved: 'healthy',
    warn: 'warning', warning: 'warning', degraded: 'warning', error: 'danger', err: 'danger', crit: 'danger', critical: 'danger', fatal: 'danger', firing: 'danger', down: 'danger'
  };
  function roleOf(v) { return LEVELS[String(v).toLowerCase()] || 'base'; }

  function DataTable(container, opts) {
    var el = node(container);
    var state = Object.assign({
      columns: [],              // [{ key, label, type, width, align, format, sortable }]
      rows: [],
      rowKey: null,             // key of a unique id column (default: index)
      sortable: true,
      sortBy: null,             // { key, dir: 'asc'|'desc' }
      density: 'compact',       // 'compact' (32px rows) | 'comfortable' (40px)
      maxHeight: null,          // px; enables the scroll box with a sticky header
      caption: null,            // accessible caption (visually hidden unless showCaption)
      showCaption: false,
      emptyText: 'No rows',
      footer: 'auto',           // 'auto' → "N rows" | string | false
      onRowClick: null,
      zebra: false
    }, opts);

    function cmp(a, b, key, dir) {
      var x = a[key], y = b[key];
      var r = (typeof x === 'number' && typeof y === 'number') ? x - y : String(x == null ? '' : x).localeCompare(String(y == null ? '' : y), undefined, { numeric: true });
      return dir === 'desc' ? -r : r;
    }

    function render() {
      var t = T(el);
      d3.select(el).selectAll('.au-table').remove();
      var root = d3.select(el).append('div').attr('class', 'au-table au-table-' + state.density + (state.zebra ? ' au-table-zebra' : ''));
      var box = root.append('div').attr('class', 'au-table-scroll');
      if (state.maxHeight) box.style('max-height', state.maxHeight + 'px').style('overflow', 'auto');

      var rows = state.rows.slice();
      if (state.sortBy && state.sortBy.key) rows.sort(function (a, b) { return cmp(a, b, state.sortBy.key, state.sortBy.dir); });

      var table = box.append('table').attr('class', 'au-tbl');
      if (state.caption) table.append('caption').attr('class', state.showCaption ? 'au-caption' : 'au-visually-hidden').text(state.caption);
      var colgroup = table.append('colgroup');
      state.columns.forEach(function (c) { var col = colgroup.append('col'); if (c.width) col.style('width', typeof c.width === 'number' ? c.width + 'px' : c.width); });

      var th = table.append('thead').append('tr').selectAll('th').data(state.columns).enter().append('th')
        .attr('scope', 'col')
        .attr('class', function (c) { return 'au-th au-type-' + (c.type || 'text') + (c.align ? ' au-align-' + c.align : '') + (state.sortBy && state.sortBy.key === c.key ? ' au-sorted' : ''); })
        .attr('aria-sort', function (c) { return state.sortBy && state.sortBy.key === c.key ? (state.sortBy.dir === 'desc' ? 'descending' : 'ascending') : null; });
      th.each(function (c) {
        var cell = d3.select(this);
        var sortable = state.sortable && c.sortable !== false;
        if (sortable) {
          var b = cell.append('button').attr('type', 'button').attr('class', 'au-th-btn').on('click', function () {
            var cur = state.sortBy && state.sortBy.key === c.key ? state.sortBy.dir : null;
            state.sortBy = { key: c.key, dir: cur === 'asc' ? 'desc' : 'asc' };
            render();
          });
          b.append('span').text(c.label);
          b.append('span').attr('class', 'au-sort-ind').attr('aria-hidden', 'true').text(state.sortBy && state.sortBy.key === c.key ? (state.sortBy.dir === 'desc' ? '↓' : '↑') : '');
        } else cell.text(c.label);
      });

      var tbody = table.append('tbody');
      if (!rows.length) {
        tbody.append('tr').append('td').attr('colspan', state.columns.length).attr('class', 'au-empty').text(state.emptyText);
      }
      var tr = tbody.selectAll('tr.au-row').data(rows, function (d, i) { return state.rowKey ? d[state.rowKey] : i; }).enter().append('tr').attr('class', 'au-row');
      if (state.onRowClick) tr.attr('tabindex', 0).attr('role', 'button').style('cursor', 'pointer')
        .on('click', function (e, d) { state.onRowClick(d); })
        .on('keydown', function (e, d) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); state.onRowClick(d); } });

      tr.each(function (d) {
        var row = d3.select(this);
        state.columns.forEach(function (c) {
          var v = d[c.key];
          var type = c.type || 'text';
          var td = row.append('td').attr('class', 'au-td au-type-' + type + (c.align ? ' au-align-' + c.align : ''));
          var text = c.format ? c.format(v, d) : (v == null ? '' : String(v));
          if (type === 'level') {
            td.append('span').attr('class', 'au-badge au-role-' + roleOf(v)).text(text);
          } else if (type === 'status') {
            var wrap = td.append('span').attr('class', 'au-status');
            wrap.append('span').attr('class', 'au-dot au-role-' + roleOf(v)).attr('aria-hidden', 'true');
            wrap.append('span').text(text);
          } else {
            td.text(text);
            if (type === 'mono' || type === 'time') td.attr('title', text);
          }
        });
      });

      if (state.footer) {
        root.append('div').attr('class', 'au-table-foot').text(state.footer === 'auto' ? rows.length + (rows.length === 1 ? ' row' : ' rows') : state.footer);
      }
    }
    render();
    return {
      update: function (o) { Object.assign(state, o || {}); render(); },
      sort: function (key, dir) { state.sortBy = { key: key, dir: dir || 'asc' }; render(); },
      destroy: function () { d3.select(el).selectAll('.au-table').remove(); },
      el: el
    };
  }

  global.Aurora = {
    version: '0.3.1',
    tokens: T,
    statusFor: statusFor,
    statusColors: function (status, ctx) { return statusColors(status, T(ctx)); },
    thresholds: DEFAULT_THRESHOLDS,
    TrendArea: TrendArea,
    WaveLine: WaveLine,
    RadialProgress: RadialProgress,
    CountdownRing: CountdownRing,
    ColumnChart: ColumnChart,
    ProgressBar: ProgressBar,
    DataTable: DataTable,
    roleOf: roleOf
  };
})(window);
