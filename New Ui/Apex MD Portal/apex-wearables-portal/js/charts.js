/* =============================================================
   APEX MD — Wearables chart engine
   -------------------------------------------------------------
   Dependency-free SVG charts (no chart library). Each renderer
   draws into a host <div> and consumes a slice of APEX_WEARABLES.
   Call ApexCharts.init(APEX_WEARABLES) once the DOM is ready
   (handled by app.js).
   ============================================================= */
(function (global) {
  'use strict';
  var SVGNS = 'http://www.w3.org/2000/svg';

  /* ---------- low-level SVG helpers ---------- */
  function el(tag, attrs) {
    var e = document.createElementNS(SVGNS, tag);
    for (var k in attrs) if (attrs.hasOwnProperty(k)) e.setAttribute(k, attrs[k]);
    return e;
  }
  function svgRoot(w, h) {
    var s = el('svg', { viewBox: '0 0 ' + w + ' ' + h, preserveAspectRatio: 'none' });
    s.style.width = '100%';
    s.style.height = h + 'px';
    return s;
  }
  // Catmull-Rom -> cubic bezier for smooth lines
  function smoothPath(pts) {
    if (pts.length < 2) return '';
    var d = 'M ' + pts[0][0] + ' ' + pts[0][1], t = 0.18, i;
    for (i = 0; i < pts.length - 1; i++) {
      var p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || pts[i + 1];
      var c1x = p1[0] + (p2[0] - p0[0]) * t, c1y = p1[1] + (p2[1] - p0[1]) * t;
      var c2x = p2[0] - (p3[0] - p1[0]) * t, c2y = p2[1] - (p3[1] - p1[1]) * t;
      d += ' C ' + c1x + ' ' + c1y + ' ' + c2x + ' ' + c2y + ' ' + p2[0] + ' ' + p2[1];
    }
    return d;
  }
  function gridY(svg, W, top, bottom, rows) {
    for (var i = 0; i <= rows; i++) {
      var y = top + (bottom - top) * i / rows;
      var ln = el('line', { x1: 0, y1: y, x2: W, y2: y, stroke: '#EFEFED', 'stroke-width': 1 });
      if (i !== rows) ln.setAttribute('stroke-dasharray', '1 5');
      svg.appendChild(ln);
    }
  }
  function vGuides(svg, W, top, bottom, n) {
    for (var i = 0; i < n; i++) {
      var x = W * i / (n - 1);
      svg.appendChild(el('line', { x1: x, y1: top, x2: x, y2: bottom, stroke: '#F2F2F0', 'stroke-width': 1, 'stroke-dasharray': '2 5' }));
    }
  }
  function axis(id, days) {
    var host = document.getElementById(id);
    if (host) host.innerHTML = days.map(function (d) { return '<span>' + d + '</span>'; }).join('');
  }
  function set(id, val) { var n = document.getElementById(id); if (n) n.textContent = val; }
  function setHTML(id, val) { var n = document.getElementById(id); if (n) n.innerHTML = val; }

  /* ---------- 1. STEPS (gradient bars) ---------- */
  function renderSteps(m) {
    var data = m.values, goal = m.goal;
    var avg = Math.round(data.reduce(function (a, b) { return a + b; }) / data.length);
    set('steps-kpi', avg.toLocaleString());
    setHTML('steps-trend', '<span class="dot"></span>' + m.trend);

    var W = 520, H = 230, top = 14, bottom = 196, pad = 26;
    var max = Math.max.apply(null, data.concat([goal])) * 1.12;
    var svg = svgRoot(W, H);
    var defs = el('defs', {});
    defs.innerHTML =
      '<linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0" stop-color="' + m.colorLite + '"/><stop offset="1" stop-color="' + m.color + '"/>' +
      '</linearGradient>' +
      '<filter id="barGlow" x="-40%" y="-40%" width="180%" height="180%">' +
        '<feDropShadow dx="0" dy="3" stdDeviation="4" flood-color="' + m.color + '" flood-opacity="0.32"/>' +
      '</filter>';
    svg.appendChild(defs);
    gridY(svg, W, top, bottom, 4);

    var gy = bottom - (goal / max) * (bottom - top);
    svg.appendChild(el('line', { x1: 0, y1: gy, x2: W, y2: gy, stroke: m.colorDark, 'stroke-width': 1.4, 'stroke-dasharray': '4 4', opacity: 0.55 }));
    var gl = el('text', { x: 4, y: gy - 7, 'text-anchor': 'start', fill: m.colorDark, 'font-size': 11, 'font-family': 'JetBrains Mono', 'font-weight': 600, opacity: 0.8 });
    gl.textContent = 'GOAL 10K'; svg.appendChild(gl);

    var slot = (W - pad * 2) / data.length, bw = slot * 0.46;
    data.forEach(function (v, i) {
      var x = pad + slot * i + slot / 2, h = (v / max) * (bottom - top), y = bottom - h;
      var hit = v >= goal;
      svg.appendChild(el('rect', { x: x - bw / 2, y: y, width: bw, height: h, rx: 7, fill: hit ? 'url(#barGrad)' : m.barDim, filter: hit ? 'url(#barGlow)' : '' }));
      var t = el('text', { x: x, y: y - 9, 'text-anchor': 'middle', fill: hit ? m.colorDark : m.labelDim, 'font-size': 11, 'font-family': 'JetBrains Mono', 'font-weight': 700 });
      t.textContent = (v / 1000).toFixed(1) + 'k'; svg.appendChild(t);
    });
    document.getElementById('chart-steps').appendChild(svg);
  }

  /* ---------- 2. RESTING HEART RATE (area + line) ---------- */
  function renderRHR(m) {
    var data = m.values;
    set('rhr-kpi', data[data.length - 1]);
    setHTML('rhr-trend', '<span class="dot"></span>' + m.trend);

    var W = 520, H = 230, top = 22, bottom = 190, pad = 24, lo = m.scale[0], hi = m.scale[1];
    var x = function (i) { return pad + (W - pad * 2) * i / (data.length - 1); };
    var y = function (v) { return bottom - ((v - lo) / (hi - lo)) * (bottom - top); };
    var pts = data.map(function (v, i) { return [x(i), y(v)]; });

    var svg = svgRoot(W, H);
    var defs = el('defs', {});
    defs.innerHTML =
      '<linearGradient id="rhrFill" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0" stop-color="' + m.color + '" stop-opacity="0.30"/>' +
        '<stop offset="1" stop-color="' + m.color + '" stop-opacity="0"/>' +
      '</linearGradient>' +
      '<filter id="lineGlow" x="-30%" y="-30%" width="160%" height="160%">' +
        '<feDropShadow dx="0" dy="2" stdDeviation="3.5" flood-color="' + m.color + '" flood-opacity="0.45"/>' +
      '</filter>';
    svg.appendChild(defs);
    gridY(svg, W, top, bottom, 3);
    vGuides(svg, W, top, bottom, 7);

    var line = smoothPath(pts);
    var area = line + ' L ' + pts[pts.length - 1][0] + ' ' + bottom + ' L ' + pts[0][0] + ' ' + bottom + ' Z';
    svg.appendChild(el('path', { d: area, fill: 'url(#rhrFill)' }));
    svg.appendChild(el('path', { d: line, fill: 'none', stroke: m.color, 'stroke-width': 2.6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', filter: 'url(#lineGlow)' }));
    pts.forEach(function (p, i) {
      var last = i === pts.length - 1;
      svg.appendChild(el('circle', { cx: p[0], cy: p[1], r: last ? 5 : 3.4, fill: '#fff', stroke: m.color, 'stroke-width': last ? 3 : 2.2 }));
      if (last) svg.appendChild(el('circle', { cx: p[0], cy: p[1], r: 9, fill: 'none', stroke: m.color, 'stroke-width': 1.4, opacity: 0.4 }));
    });
    document.getElementById('chart-rhr').appendChild(svg);
  }

  /* ---------- 3. BLOOD PRESSURE (dual line) ---------- */
  function renderBP(m) {
    var sys = m.systolic, dia = m.diastolic;
    set('bp-kpi', sys[sys.length - 1] + '/' + dia[dia.length - 1]);
    setHTML('bp-trend', '<span class="dot" style="background:var(--good);box-shadow:0 0 0 3px rgba(62,124,87,.18)"></span>' + m.trend);

    var W = 520, H = 230, top = 18, bottom = 188, pad = 24, lo = m.scale[0], hi = m.scale[1];
    var x = function (i) { return pad + (W - pad * 2) * i / (sys.length - 1); };
    var y = function (v) { return bottom - ((v - lo) / (hi - lo)) * (bottom - top); };

    var svg = svgRoot(W, H);
    var defs = el('defs', {});
    defs.innerHTML = '<filter id="bpGlow" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="' + m.color + '" flood-opacity="0.4"/></filter>';
    svg.appendChild(defs);
    gridY(svg, W, top, bottom, 3);
    vGuides(svg, W, top, bottom, 7);

    var bTop = y(m.band[1]), bBot = y(m.band[0]);
    svg.appendChild(el('rect', { x: 0, y: bTop, width: W, height: bBot - bTop, fill: '#3E7C57', opacity: 0.06 }));

    var sysPts = sys.map(function (v, i) { return [x(i), y(v)]; });
    var diaPts = dia.map(function (v, i) { return [x(i), y(v)]; });
    svg.appendChild(el('path', { d: smoothPath(diaPts), fill: 'none', stroke: m.colorDia, 'stroke-width': 2.2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));
    svg.appendChild(el('path', { d: smoothPath(sysPts), fill: 'none', stroke: m.color, 'stroke-width': 2.6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', filter: 'url(#bpGlow)' }));
    diaPts.forEach(function (p, i) { svg.appendChild(el('circle', { cx: p[0], cy: p[1], r: i === diaPts.length - 1 ? 4.4 : 3, fill: '#fff', stroke: m.colorDia, 'stroke-width': 2 })); });
    sysPts.forEach(function (p, i) {
      var last = i === sysPts.length - 1;
      svg.appendChild(el('circle', { cx: p[0], cy: p[1], r: last ? 5 : 3.4, fill: '#fff', stroke: m.color, 'stroke-width': last ? 3 : 2.2 }));
      if (last) svg.appendChild(el('circle', { cx: p[0], cy: p[1], r: 9, fill: 'none', stroke: m.color, 'stroke-width': 1.4, opacity: 0.4 }));
    });
    document.getElementById('chart-bp').appendChild(svg);
  }

  /* ---------- 4. SLEEP (stacked bars) ---------- */
  function renderSleep(m) {
    var nights = m.nights, colors = m.colors, max = m.max;
    var totals = nights.map(function (n) { return n[0] + n[1] + n[2]; });
    var avg = totals.reduce(function (a, b) { return a + b; }) / totals.length;
    set('sleep-kpi', Math.floor(avg) + 'h ' + Math.round((avg % 1) * 60) + 'm');
    setHTML('sleep-trend', '<span class="dot"></span>' + m.trend);

    var W = 520, H = 230, top = 16, bottom = 192, pad = 26;
    var svg = svgRoot(W, H);
    var defs = el('defs', {});
    defs.innerHTML = '<filter id="slGlow" x="-40%" y="-40%" width="180%" height="180%"><feDropShadow dx="0" dy="3" stdDeviation="3.5" flood-color="' + colors[1] + '" flood-opacity="0.22"/></filter>';
    svg.appendChild(defs);
    gridY(svg, W, top, bottom, 3);

    var slot = (W - pad * 2) / nights.length, bw = slot * 0.44;
    nights.forEach(function (n, i) {
      var cx = pad + slot * i + slot / 2, yCursor = bottom;
      var stackH = n.reduce(function (a, b) { return a + b; }) / max * (bottom - top);
      n.forEach(function (seg, si) {
        var h = seg / max * (bottom - top); yCursor -= h;
        svg.appendChild(el('rect', { x: cx - bw / 2, y: yCursor, width: bw, height: h, fill: colors[si] }));
      });
      var topY = bottom - stackH;
      svg.appendChild(el('rect', { x: cx - bw / 2, y: topY, width: bw, height: 6, rx: 3, fill: colors[0] }));
      var tot = n[0] + n[1] + n[2];
      var t = el('text', { x: cx, y: topY - 9, 'text-anchor': 'middle', fill: m.colorDark, 'font-size': 11, 'font-family': 'JetBrains Mono', 'font-weight': 700 });
      t.textContent = tot.toFixed(1) + 'h'; svg.appendChild(t);
    });
    document.getElementById('chart-sleep').appendChild(svg);
  }

  /* ---------- public init ---------- */
  function init(D) {
    var m = D.metrics, days = D.days;
    renderSteps(m.steps); axis('axis-steps', days);
    renderRHR(m.rhr);     axis('axis-rhr', days);
    renderBP(m.bp);       axis('axis-bp', days);
    renderSleep(m.sleep); axis('axis-sleep', days);
  }

  global.ApexCharts = { init: init };
})(window);
