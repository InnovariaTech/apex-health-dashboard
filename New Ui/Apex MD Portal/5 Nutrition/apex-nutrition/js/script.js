/* APEX FIT — Nutrition (Journal + Plan). Reads window.APEX_DATA (see data/app-data.js). */
(function () {
  'use strict';
  var DATA = window.APEX_DATA || {};
  var J = DATA.journal || {};
  var P = DATA.plan || {};
  var GOAL = J.goal || 2000;

  /* ---------- Calorie trend (line chart) ---------- */
  function renderTrend() {
    var t = J.trend || [], el = document.getElementById('trend');
    if (!el || !t.length) return;
    var L = 58, R = 694, T = 24, B = 288, maxY = 2600, ticks = [0, 650, 1300, 1950, 2600];
    var xs = function (i) { return L + i * ((R - L) / (t.length - 1)); };
    var ys = function (v) { return B - (v / maxY) * (B - T); };
    var g = '';
    ticks.forEach(function (v) {
      var y = ys(v);
      g += '<line x1="' + L + '" y1="' + y + '" x2="' + R + '" y2="' + y + '" stroke="#eef0ec"/>';
      g += '<text x="' + (L - 10) + '" y="' + (y + 4) + '" text-anchor="end" font-size="12" fill="#9aa1a9" font-family="Inter">' + v + '</text>';
    });
    t.forEach(function (p, i) {
      g += '<text x="' + xs(i) + '" y="' + (B + 22) + '" text-anchor="middle" font-size="12.5" fill="#9aa1a9" font-weight="600" font-family="Inter">' + p.d + '</text>';
    });
    var gy = ys(GOAL);
    g += '<line x1="' + L + '" y1="' + gy + '" x2="' + R + '" y2="' + gy + '" stroke="#2f7d5b" stroke-width="1.6" stroke-dasharray="6 5" opacity=".8"/>';
    g += '<text x="' + (R - 4) + '" y="' + (gy - 8) + '" text-anchor="end" font-size="12" fill="#2f7d5b" font-weight="700" font-family="Inter">Goal</text>';
    var pts = t.map(function (p, i) { return [xs(i), ys(p.v)]; });
    var d = 'M ' + pts[0][0] + ' ' + pts[0][1];
    for (var i = 0; i < pts.length - 1; i++) {
      var x0 = pts[i][0], y0 = pts[i][1], x1 = pts[i + 1][0], y1 = pts[i + 1][1], cx = (x0 + x1) / 2;
      d += ' C ' + cx + ' ' + y0 + ', ' + cx + ' ' + y1 + ', ' + x1 + ' ' + y1;
    }
    var area = d + ' L ' + pts[pts.length - 1][0] + ' ' + B + ' L ' + pts[0][0] + ' ' + B + ' Z';
    g += '<path d="' + area + '" fill="url(#tg)" opacity=".5"/>';
    g += '<path d="' + d + '" fill="none" stroke="#3b73e0" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>';
    pts.forEach(function (p) { g += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="5" fill="#3b73e0" stroke="#fff" stroke-width="2.5"/>'; });
    el.innerHTML = '<defs><linearGradient id="tg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3b73e0" stop-opacity=".22"/><stop offset="1" stop-color="#3b73e0" stop-opacity="0"/></linearGradient></defs>' + g;
  }

  /* ---------- Macros per day (stacked bars) ---------- */
  function renderMacros() {
    var m = J.macros || [], el = document.getElementById('macros');
    if (!el || !m.length) return;
    var L = 58, R = 694, T = 24, B = 288, maxY = 600, ticks = [0, 150, 300, 450, 600];
    var band = (R - L) / m.length, bw = 58;
    var ys = function (v) { return B - (v / maxY) * (B - T); };
    var seg = function (v) { return (v / maxY) * (B - T); };
    var g = '';
    ticks.forEach(function (v) {
      var y = ys(v);
      g += '<line x1="' + L + '" y1="' + y + '" x2="' + R + '" y2="' + y + '" stroke="#eef0ec"/>';
      g += '<text x="' + (L - 10) + '" y="' + (y + 4) + '" text-anchor="end" font-size="12" fill="#9aa1a9" font-family="Inter">' + v + '</text>';
    });
    m.forEach(function (row, i) {
      var cx = L + band * i + band / 2, x = cx - bw / 2, y = B;
      [['c', '#3b73e0'], ['p', '#2f7d5b'], ['f', '#bd7c1c']].forEach(function (kv) {
        var h = seg(row[kv[0]]);
        if (h > 0) { y -= h; g += '<rect x="' + x + '" y="' + y + '" width="' + bw + '" height="' + h + '" fill="' + kv[1] + '" rx="2"/>'; }
      });
      g += '<text x="' + cx + '" y="' + (B + 22) + '" text-anchor="middle" font-size="12.5" fill="#9aa1a9" font-weight="600" font-family="Inter">' + row.d + '</text>';
    });
    el.innerHTML = g;
  }

  /* ---------- Journal day rows ---------- */
  function renderLog() {
    var log = J.log || [], el = document.getElementById('log');
    if (!el) return;
    var fitImg = document.querySelector('.side-div img');
    var fitSrc = fitImg ? fitImg.getAttribute('src') : 'assets/img/apex-fit-logo.jpg';
    el.innerHTML = log.map(function (day) {
      var pct = Math.round(day.kcal / GOAL * 100);
      var over = pct > 100;
      var color = day.kcal === 0 ? 'transparent' : over ? 'var(--amber)' : 'var(--red)';
      var fillW = Math.min(pct, 100);
      return '<div class="day">' +
        '<div class="day-top"><div>' +
          '<div class="day-date">' + day.date + '</div>' +
          '<div class="day-macros">' + day.kcal.toLocaleString() + ' kcal &middot; <b>C</b> ' + day.c + 'g &middot; <b>P</b> ' + day.p + 'g &middot; <b>F</b> ' + day.f + 'g</div>' +
        '</div><div class="day-right">' +
          '<button class="cam"><svg viewBox="0 0 24 24"><path d="M3 8a2 2 0 0 1 2-2h2l1.5-2h7L19 6h0a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><circle cx="12" cy="13" r="3.5"/></svg></button>' +
          '<span class="src"><span class="d"></span><img class="src-logo" src="' + fitSrc + '" alt="APEX FIT"></span>' +
        '</div></div>' +
        '<div class="pbar-row"><span>' + day.kcal.toLocaleString() + ' / ' + GOAL.toLocaleString() + ' kcal</span><span class="pct">' + pct + '%</span></div>' +
        '<div class="track"><div class="fill" data-w="' + fillW + '" style="background:' + color + '"></div></div>' +
        '<div class="meals">' + day.meals.map(function (x) { return '<span class="meal">' + x + '</span>'; }).join('') + '</div>' +
      '</div>';
    }).join('');
    requestAnimationFrame(function () {
      setTimeout(function () {
        document.querySelectorAll('.fill').forEach(function (f) { f.style.width = f.dataset.w + '%'; });
      }, 60);
    });
  }

  /* ---------- Plan (day pills + meal grid) ---------- */
  function renderPlan() {
    var days = P.days || [], pills = document.getElementById('day-pills'), grid = document.getElementById('meal-grid');
    if (!pills || !grid || !days.length) return;
    var day = 0;
    var swapSvg = '<svg viewBox="0 0 24 24"><path d="M3 16l4 4 4-4M7 20V4M21 8l-4-4-4 4M17 4v16"/></svg>';
    function pillsRender() {
      pills.innerHTML = days.map(function (d, i) {
        return '<button class="day-pill ' + (i === day ? 'active' : '') + '" data-i="' + i + '">' + d.label + '<span class="k">&middot; ' + d.kcal.toLocaleString() + ' kcal</span></button>';
      }).join('');
      pills.querySelectorAll('.day-pill').forEach(function (b) {
        b.onclick = function () { day = +b.dataset.i; pillsRender(); gridRender(); };
      });
    }
    function gridRender() {
      grid.innerHTML = days[day].meals.map(function (m) {
        return '<div class="meal">' +
          '<div class="meal-img"><img class="meal-photo" src="' + m.image + '" alt="' + m.name + '"></div>' +
          '<div class="meal-body"><div class="meal-title">' + m.name + '</div>' +
          '<div class="meal-foot"><div><div class="meal-type">' + m.type + '</div><div class="meal-cal">' + m.cal + ' cal / serving</div></div>' +
          '<button class="swap" title="Swap meal">' + swapSvg + '</button></div></div></div>';
      }).join('');
    }
    pillsRender(); gridRender();
  }

  /* ---------- Tab switching (Journal / Plan) ---------- */
  function initTabs() {
    var subJournal = '<span>Daily intake &amp; macro log</span><span class="dot"></span><span>Goal 2,000 kcal/day</span><span class="dot"></span><span>4 of 30 days logged</span><span class="dot"></span><span>Synced from APEX FIT app</span>';
    var subPlan = '<span>Assigned meal plan</span><span class="dot"></span><span>High protein &middot; 4 meals/day</span><span class="dot"></span><span>7 sample days</span><span class="dot"></span><span>Synced from APEX FIT app</span>';
    var tabs = document.querySelectorAll('.tab'), em = document.querySelector('h1 em'), sub = document.querySelector('.sub');
    var vJ = document.getElementById('view-journal'), vP = document.getElementById('view-plan');
    tabs.forEach(function (t) {
      t.onclick = function () {
        tabs.forEach(function (x) { x.classList.remove('active'); });
        t.classList.add('active');
        if (t.dataset.view === 'plan') { vJ.hidden = true; vP.hidden = false; em.textContent = 'plan'; sub.innerHTML = subPlan; }
        else { vP.hidden = true; vJ.hidden = false; em.textContent = 'journal'; sub.innerHTML = subJournal; }
        window.scrollTo({ top: 0, behavior: 'smooth' });
      };
    });
  }

  renderTrend(); renderMacros(); renderLog(); renderPlan(); initTabs();
})();
