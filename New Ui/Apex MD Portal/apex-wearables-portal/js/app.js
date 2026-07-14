/* =============================================================
   APEX MD — Wearables bootstrap
   Wires the data (data.js) into the chart engine (charts.js).
   ============================================================= */
(function () {
  'use strict';
  function start() {
    if (window.ApexCharts && window.APEX_WEARABLES) {
      window.ApexCharts.init(window.APEX_WEARABLES);
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
