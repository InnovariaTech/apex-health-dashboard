/* ApexAI block renderer.
   Turns a `blocks` array (see src/data/schema.md) into styled HTML.
   Depends on: inline.js (apexInline/apexEsc/apexMarkdown), icons.js (apexSvg). */
(function () {
  var I = window.apexInline, E = window.apexEsc, SVG = window.apexSvg;

  var CAT = {
    strength:  ['p-str', 'Strength'],
    cardio:    ['p-car', 'Cardio'],
    nutrition: ['p-nut', 'Nutrition'],
    hydration: ['p-hyd', 'Hydration'],
    recovery:  ['p-rec', 'Recovery']
  };

  function marker(m) {
    return '<div class="marker"><span class="mk-dot"></span><span class="mk-name">' +
      I(m.name) + (m.note ? '<em>' + E(m.note) + '</em>' : '') +
      '</span><span class="mk-val">' + E(m.value) + '</span></div>';
  }

  function labSnapshot(b) {
    var watchLabel = b.watchLabel || 'Areas to Address';
    return '<div class="mod"><div class="mod-head">' +
      '<span class="mod-eyebrow">' + E(b.eyebrow || 'Signal Read') + '</span>' +
      '<span class="mod-title">' + E(b.title || 'Lab Snapshot') + '</span>' +
      (b.tag ? '<span class="mod-tag">' + E(b.tag) + '</span>' : '') +
      '</div><div class="snap">' +
      '<div class="snap-col pos"><div class="col-label"><span class="ic">' + SVG('check') +
        '</span><span class="t">Strengths</span></div>' +
        (b.strengths || []).map(marker).join('') + '</div>' +
      '<div class="snap-col watch"><div class="col-label"><span class="ic">' + SVG('warn') +
        '</span><span class="t">' + E(watchLabel) + '</span></div>' +
        (b.watch || []).map(marker).join('') + '</div>' +
      '</div></div>';
  }

  function phaseItem(it) {
    var c = CAT[it.cat] || ['p-str', it.cat || ''];
    return '<div class="line"><span class="pill ' + c[0] + '"><span class="pd"></span>' + E(c[1]) +
      '</span><span class="line-txt">' +
      (it.freq ? '<span class="freq">' + E(it.freq) + '</span> — ' : '') + I(it.text) +
      (it.sub ? '<span class="sub">' + I(it.sub) + '</span>' : '') + '</span></div>';
  }

  function phasePlan(b) {
    var phases = (b.phases || []).map(function (p) {
      return '<div class="phase' + (p.retest ? ' retest' : '') + '"><div class="node">' + E(p.num) +
        '</div><div class="ph-head"><span class="wk">' + E(p.weeks) + '</span>' +
        '<span class="ph-name">' + I(p.name) + '</span></div>' +
        '<div class="ph-goal">' + I(p.goal) + '</div>' +
        '<div class="rows">' + (p.items || []).map(phaseItem).join('') + '</div></div>';
    }).join('');
    return '<div class="mod"><div class="mod-head">' +
      '<span class="mod-eyebrow">' + E(b.eyebrow || 'Protocol') + '</span>' +
      '<span class="mod-title">' + E(b.title || 'Optimization Plan') + '</span>' +
      (b.tag ? '<span class="mod-tag">' + E(b.tag) + '</span>' : '') +
      '</div><div class="plan"><div class="spine">' + phases + '</div></div></div>';
  }

  function crow(s) {
    var warn = s.status === 'warn';
    return '<div class="crow' + (warn ? ' warn-row' : '') + '"><span class="ci ' +
      (warn ? 'warn' : 'ok') + '">' + SVG(warn ? 'warn' : 'check') + '</span>' +
      '<span class="ctxt">' + I(s.text) + '</span></div>';
  }

  function wrow(w) {
    var kind = (w.badge && w.badge.kind === 'label') ? 'lbl' : 'freq';
    var val = w.badge ? w.badge.value : '';
    return '<div class="wrow"><span class="wbadge ' + kind + '">' + E(val) + '</span>' +
      '<span class="wtxt">' + I(w.text) +
      (w.sub ? '<span class="ex">' + E(w.sub) + '</span>' : '') + '</span></div>';
  }

  function priority(b) {
    var driver = '';
    if (b.driver) {
      var mk = (b.driver.markers || []).map(function (d) {
        return E(d.label) + ' <span class="dv">' + E(d.value) + '</span>';
      }).join(' ');
      driver = '<div class="driver">' + mk + (b.driver.note ? ' ' + E(b.driver.note) : '') + '</div>';
    }
    return '<div class="pcard"><div class="p-head"><div class="pnum">' + E(b.num) +
      '</div><div class="p-title">' + I(b.title) + '</div>' + driver + '</div>' +
      '<div class="p-body"><div class="gym-wrap"><div class="sub-label">' + SVG('strategy') +
        (b.strategyLabel || 'Gym Strategy') + '</div>' +
        (b.strategy || []).map(crow).join('') + '</div>' +
      '<div class="sub-label">' + SVG('workouts') + 'Workouts</div>' +
      '<div class="wo-list">' + (b.workouts || []).map(wrow).join('') + '</div></div></div>';
  }

  function productCard(p) {
    var rx = /rx/i.test(p.tag || '');
    return '<div class="prod"><div class="prod-img"><span class="rec-tag' + (rx ? ' rx' : '') + '">' +
      E(p.tag || '') + '</span><img src="' + E(p.image) + '" alt="' + E(p.name) + '"></div>' +
      '<div class="prod-body"><div class="prod-eyebrow">' + E(p.eyebrow || '') + '</div>' +
      '<div class="prod-name">' + E(p.name) + '</div>' +
      '<div class="prod-blurb">' + I(p.blurb || '') + '</div>' +
      '<div class="prod-foot"><span class="prod-spec">' + E(p.spec || '') + '</span>' +
      '<a class="prod-cta" href="' + E((p.cta && p.cta.href) || '#') + '">' + SVG('bag') +
      E((p.cta && p.cta.label) || 'Shop') + '</a></div></div></div>';
  }

  function productRec(b, catalog) {
    var items = (b.items || []).map(function (it) {
      var p = (typeof it === 'string') ? (catalog && catalog[it]) : it;
      return p ? productCard(p) : '';
    }).join('');
    return (b.label ? '<div class="section-eyebrow">' + E(b.label) + '</div>' : '') +
      '<div class="rec-grid">' + items + '</div>';
  }

  function renderBlock(b, catalog) {
    switch (b.type) {
      case 'intro':        return '<div class="intro">' + I(b.text) + '</div>';
      case 'section':      return '<div class="section-eyebrow">' + E(b.label) + '</div>';
      case 'lab_snapshot': return labSnapshot(b);
      case 'phase_plan':   return phasePlan(b);
      case 'priority':     return priority(b);
      case 'product_rec':  return productRec(b, catalog);
      case 'callout':      return '<div class="closer">' + SVG('spark') + '<span>' + I(b.text) + '</span></div>';
      case 'markdown':     return '<div class="intro md-block">' + window.apexMarkdown(b.text) + '</div>';
      default:             return '';
    }
  }

  window.ApexAIRenderer = {
    renderBlocks: function (blocks, catalog) {
      return (blocks || []).map(function (b) { return renderBlock(b, catalog); }).join('');
    }
  };
})();
