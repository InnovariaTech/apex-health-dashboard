/* Inline SVG icon paths used by the renderer + widget. */
window.APEXAI_ICONS = {
  spark:    '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/>',
  check:    '<path d="M5 12l4 4L19 6"/>',
  warn:     '<path d="M12 8v5M12 16.5v.5"/><path d="M10.3 4.3 3 17a2 2 0 0 0 1.7 3h14.6A2 2 0 0 0 21 17L13.7 4.3a2 2 0 0 0-3.4 0z"/>',
  strategy: '<path d="M6.5 6.5h11v11h-11z"/><path d="M3 9v6M21 9v6"/>',
  workouts: '<path d="M4 12h16M8 8v8M16 8v8"/>',
  bag:      '<path d="M6 8h12l1 12H5z"/><path d="M9 8a3 3 0 0 1 6 0"/>',
  attach:   '<path d="M21 11.5 12.5 20a5 5 0 0 1-7-7l8-8a3.5 3.5 0 0 1 5 5l-8 8a2 2 0 0 1-3-3l7.5-7.5"/>',
  send:     '<path d="M4 12h15M13 6l6 6-6 6"/>'
};
window.apexSvg = function (name, cls) {
  return '<svg viewBox="0 0 24 24"' + (cls ? ' class="' + cls + '"' : '') + '>' +
    (window.APEXAI_ICONS[name] || '') + '</svg>';
};
