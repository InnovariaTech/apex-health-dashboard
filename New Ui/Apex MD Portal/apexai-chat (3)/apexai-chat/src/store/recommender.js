/* Recommender — turns clinical signals (or lab markers) into real store SKUs,
   then into a `product_rec` block the ApexAI renderer can display.

   Two ways to drive it:
   • CLAUDE-DRIVEN (recommended): give Claude the catalog + PROMPT.store.md and
     let it emit product_rec blocks with real ids. Deterministic, clinically
     framed by the model. This file is the fallback / no-API path.
   • RULES-BASED: derive signals from the lab context and match catalog.signals.

   Signals vocabulary: weight, metabolic, testosterone, hormones_female,
   longevity, recovery, muscle, sleep, energy, libido, cognitive, inflammation,
   gut, hair_skin, cardiovascular, diagnostics, concierge.
*/
(function () {
  // Lab marker → signal hints (extend as needed). Ranges are illustrative.
  var MARKER_RULES = [
    { key: /testosterone|free\s*t/i,        low: 'testosterone' },
    { key: /a1c|glucose|insulin/i,          high: 'metabolic', goal: 'weight' },
    { key: /creatinine|egfr/i,              note: 'recovery' },   // support, not push
    { key: /vitamin\s*d/i,                  low: 'energy' },
    { key: /crp|inflamm/i,                  high: 'inflammation' }
  ];

  // Map a free-form goal string to signals.
  var GOAL_WORDS = {
    weight: 'weight', 'weight loss': 'weight', metabolic: 'metabolic',
    muscle: 'muscle', strength: 'muscle', recovery: 'recovery',
    energy: 'energy', sleep: 'sleep', longevity: 'longevity',
    libido: 'libido', focus: 'cognitive', skin: 'hair_skin', hair: 'hair_skin'
  };

  function signalsFromGoals(goals) {
    var out = {};
    (goals || []).forEach(function (g) {
      var s = GOAL_WORDS[String(g).toLowerCase()];
      if (s) out[s] = true;
    });
    return Object.keys(out);
  }

  // Rank catalog products by how many requested signals they satisfy.
  function forSignals(signals, catalog, opts) {
    opts = opts || {};
    var want = {}; (signals || []).forEach(function (s) { want[s] = true; });
    var scored = Object.keys(catalog).map(function (id) {
      var p = catalog[id];
      if (opts.excludeCategories && opts.excludeCategories.indexOf(p.category) > -1) return null;
      var score = (p.signals || []).reduce(function (n, s) { return n + (want[s] ? 1 : 0); }, 0);
      return score > 0 ? { id: id, score: score, popular: /popular/i.test(p.tag || '') } : null;
    }).filter(Boolean);
    scored.sort(function (a, b) { return (b.score - a.score) || (b.popular - a.popular); });
    return scored.slice(0, opts.limit || 3).map(function (x) { return x.id; });
  }

  // Build a product_rec block from ids.
  function toBlock(ids, label) {
    return { type: 'product_rec', label: label || 'Recommended from Apex MD', items: ids };
  }

  window.ApexRecommender = {
    forSignals: forSignals,
    signalsFromGoals: signalsFromGoals,
    toBlock: toBlock,
    MARKER_RULES: MARKER_RULES
  };
})();
