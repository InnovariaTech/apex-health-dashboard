/* Apex Progress — view layer
 * Renders every data-driven section from window.APEX_PROGRESS into the
 * static shell in index.html, then wires the tab switcher and the
 * before/after slider. No build step or framework required.
 */
(function () {
  "use strict";

  var D = window.APEX_PROGRESS;
  if (!D) { console.error("[apex] APEX_PROGRESS data not loaded"); return; }

  // ---- Tabler icon paths (inlined, 24x24, stroke = currentColor) ----------
  var ICON = {
    arrowR:   '<path d="M5 12l14 0"/><path d="M13 6l6 6l-6 6"/>',
    chevR:    '<path d="M9 6l6 6l-6 6"/>',
    chevUp:   '<path d="M6 15l6 -6l6 6"/>',
    chevDown: '<path d="M18 9l-6 6l-6 -6"/>',
    check:    '<path d="M5 12l5 5l10 -10"/>',
    clock:    '<path d="M12 7v5l3 3"/><path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0"/>',
    weight:   '<path d="M12 3a4 4 0 0 0 -4 4v1h8v-1a4 4 0 0 0 -4 -4z"/><path d="M6 8h12l1 12h-14z"/>',
    globe:    '<path d="M12 21a9 9 0 0 0 0 -18a9 9 0 0 0 0 18"/><path d="M3.6 9h16.8"/><path d="M3.6 15h16.8"/>',
    activity: '<path d="M7 12h2l2 4l3 -8l2 4h2"/><path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0"/>',
    barbell:  '<path d="M4 12h16"/><path d="M4 9v6"/><path d="M20 9v6"/><path d="M8 7v10"/><path d="M16 7v10"/>',
    flask:    '<path d="M9 3l6 0"/><path d="M10 9l4 0"/><path d="M10 3v6l-4 11a.7 .7 0 0 0 .5 1h11a.7 .7 0 0 0 .5 -1l-4 -11v-6"/>',
    ladder:   '<path d="M9 4l0 16"/><path d="M15 4l0 16"/><path d="M5 8l4 0"/><path d="M5 16l4 0"/><path d="M15 8l4 0"/><path d="M15 16l4 0"/>'
  };
  function svg(inner, sw) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' + (sw || 1.9) + '">' + inner + '</svg>';
  }
  function el(id) { return document.getElementById(id); }
  function set(id, html) { var n = el(id); if (n) n.innerHTML = html; }
  function chev(dir) { return dir === "up" ? ICON.chevUp : ICON.chevDown; }

  // ---- KPI tiles ----------------------------------------------------------
  set("tiles", D.kpis.map(function (k) {
    var head = '<div class="tlabel"><span class="dot" style="background:' + k.dot + '"></span>' + k.label + '</div>'
             + '<div class="tval">' + k.value + '<span class="unit">' + k.unit + '</span></div>'
             + '<div class="tsub">' + k.sub + '</div>';
    if (k.link) {
      return '<a class="tile t-' + k.tone + ' link" href="' + k.link + '">' + head
           + '<span class="go">' + svg(ICON.arrowR, 2.2) + '</span></a>';
    }
    return '<div class="tile t-' + k.tone + '">' + head
         + '<span class="tbadge">' + svg(chev(k.badge.dir), 2.2) + k.badge.text + '</span></div>';
  }).join(""));

  // ---- Biomarkers: stats + markers ---------------------------------------
  set("bioStats", D.biomarkers.stats.map(function (s) {
    return '<div class="bs"><label>' + s.label + '</label><b>' + s.value
         + '<span>' + s.unit + '</span></b><small>' + s.note + '</small></div>';
  }).join(""));

  set("bioMarkers", D.biomarkers.markers.map(function (m) {
    return '<div class="bm"><div class="bml"><b>' + m.name + '</b><div class="bmcat">' + m.cat + '</div></div>'
         + '<div class="bmr"><div class="bmv">' + m.value + '<u>' + m.unit + '</u></div>'
         + '<div class="bmd">' + svg(chev(m.dir), 2.4) + m.delta + '</div></div></div>';
  }).join(""));

  // ---- Trend chart (fills polylines + dots over the static axes) ----------
  renderChart(D.trend);

  // ---- "Where you are now" snapshot --------------------------------------
  set("statRows", D.snapshot.rows.map(function (r) {
    var dcls = r.dir === "up" ? "up" : "down";
    var left = '<div class="sl"><span class="ic" style="background:' + r.tint + ';color:' + r.color + '">'
             + svg(ICON[r.icon], 1.9) + '</span>' + r.label + '</div>';
    if (r.link) {
      return '<a class="statrow link" href="' + r.link + '">' + left
           + '<div class="sv"><b>' + r.value + '</b><span class="d ' + dcls + '">' + r.delta + '</span>'
           + '<span class="arr">' + svg(ICON.chevR, 2.2) + '</span></div></a>';
    }
    return '<div class="statrow">' + left
         + '<div class="sv"><b>' + r.value + '</b><span class="d ' + dcls + '">' + r.delta + '</span></div></div>';
  }).join(""));

  var g = D.snapshot.goal;
  set("goalBox",
    '<div class="gt"><span>' + g.label + '</span><b>' + g.pct + '%</b></div>'
  + '<div class="bar"><i style="width:' + g.pct + '%"></i></div>'
  + '<div class="gnote">' + g.note + '</div>');

  // ---- Progress photos ----------------------------------------------------
  set("photoGrid", D.photos.map(function (p) {
    return '<div class="photo"><img src="' + p.src + '" alt="' + p.alt + '"></div>';
  }).join(""));

  // ---- Before / after slider ---------------------------------------------
  var c = D.compare;
  el("cmpAfter").src = c.after.src;  el("cmpAfter").alt = c.after.alt;
  el("cmpBefore").src = c.before.src; el("cmpBefore").alt = c.before.alt;
  el("cmpTagL").textContent = c.before.tag;
  el("cmpTagR").textContent = c.after.tag;
  set("cmpStats", c.stats.map(function (s) {
    var extra = s.small ? '<small>' + s.small + '</small>' : '<i>' + s.delta + '</i>';
    return '<div class="cs"><label>' + s.label + '</label><b>' + s.value + ' ' + extra + '</b></div>';
  }).join(""));

  // ---- Personal records ---------------------------------------------------
  set("prList", D.prs.map(function (p) {
    return '<div class="pr"><div class="pic">' + svg(ICON[p.icon], 1.8) + '</div>'
         + '<div class="pname"><b>' + p.name + '</b><div class="pwas">' + p.was + '</div></div>'
         + '<div><div class="pnew">' + p.value + '</div><div class="pdelta">' + p.delta + '</div></div></div>';
  }).join(""));

  // ---- Milestones ---------------------------------------------------------
  set("msList", D.milestones.map(function (m) {
    var icon = m.done ? svg(ICON.check, 2.4) : svg(ICON.clock, 2.2);
    return '<div class="ms ' + (m.done ? "done" : "pending") + '"><div class="chk">' + icon + '</div>'
         + '<div class="mtxt"><b>' + m.name + '</b><div class="mdesc">' + m.desc + '</div></div>'
         + '<span class="mstat">' + m.status + '</span></div>';
  }).join(""));

  // ---- Narrative ----------------------------------------------------------
  set("narrBody", D.narrative.paragraphs.map(function (p) { return "<p>" + p + "</p>"; }).join(""));

  // ---- Tab switcher -------------------------------------------------------
  document.querySelectorAll(".tab").forEach(function (t) {
    t.addEventListener("click", function () {
      document.querySelectorAll(".tab").forEach(function (x) { x.classList.remove("active"); });
      t.classList.add("active");
      document.querySelectorAll(".panel").forEach(function (p) { p.classList.remove("active"); });
      var target = el("panel-" + t.dataset.tab);
      if (target) target.classList.add("active");
    });
  });

  // ---- Before/after pointer drag -----------------------------------------
  (function () {
    var cmp = el("cmp");
    if (!cmp) return;
    function setPos(clientX) {
      var r = cmp.getBoundingClientRect();
      var p = (clientX - r.left) / r.width;
      p = Math.max(0, Math.min(1, p));
      cmp.style.setProperty("--p", (p * 100).toFixed(2) + "%");
    }
    cmp.addEventListener("pointerdown", function (e) { cmp.setPointerCapture(e.pointerId); setPos(e.clientX); });
    cmp.addEventListener("pointermove", function (e) { if (e.buttons) setPos(e.clientX); });
  })();

  // ---- Chart helper -------------------------------------------------------
  function renderChart(t) {
    var X0 = 70, X1 = 850, Y0 = 20, Y1 = 260, n = t.points.length;
    var ws = t.weightScale, bs = t.bodyFatScale;
    function x(i)  { return X0 + (X1 - X0) * i / (n - 1); }
    function yW(w) { return Y1 - (w - ws[0]) / (ws[1] - ws[0]) * (Y1 - Y0); }
    function yB(b) { return Y1 - (b - bs[0]) / (bs[1] - bs[0]) * (Y1 - Y0); }

    var wpts = t.points.map(function (p, i) { return x(i).toFixed(1) + "," + yW(p.weight).toFixed(1); }).join(" ");
    var bpts = t.points.map(function (p, i) { return x(i).toFixed(1) + "," + yB(p.bodyFat).toFixed(1); }).join(" ");
    el("lineWeight").setAttribute("points", wpts);
    el("lineBF").setAttribute("points", bpts);

    function dots(vals, yfn, r) {
      return vals.map(function (v, i) {
        var last = i === vals.length - 1, rr = last ? r + 1 : r;
        return '<circle cx="' + x(i).toFixed(1) + '" cy="' + yfn(v).toFixed(1) + '" r="' + rr + '"'
             + (last ? ' stroke="#fff" stroke-width="2"' : "") + "/>";
      }).join("");
    }
    set("dotsWeight", dots(t.points.map(function (p) { return p.weight; }), yW, 5));
    set("dotsBF",     dots(t.points.map(function (p) { return p.bodyFat; }), yB, 4.5));

    var gy = yW(t.goalWeight).toFixed(1);
    var gl = el("goalLine");
    if (gl) { gl.setAttribute("y1", gy); gl.setAttribute("y2", gy); }
  }
})();
