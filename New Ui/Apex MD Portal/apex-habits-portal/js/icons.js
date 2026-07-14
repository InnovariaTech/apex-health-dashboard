/* Apex MD — icon registry (Tabler-style inline SVG paths). Load FIRST. */
var ICONS = {
  home:'<path d="M4 12l8-8 8 8"/><path d="M6 10v9a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-9"/><path d="M10 20v-5h4v5"/>',
  pulse:'<path d="M3 12h3l2 6 4-13 2 9 1.5-2H21"/>',
  link:'<path d="M9 15l6-6"/><path d="M10.5 6l1-1a3.5 3.5 0 0 1 5 5l-2 2"/><path d="M13.5 18l-1 1a3.5 3.5 0 0 1-5-5l2-2"/>',
  chat:'<path d="M4 5h16a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-9l-5 4v-4H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z"/>',
  flask:'<path d="M9 3h6"/><path d="M10 3v6l-4.2 9A1.5 1.5 0 0 0 7.2 20h9.6a1.5 1.5 0 0 0 1.4-2L14 9V3"/><path d="M7.5 14h9"/>',
  dna:'<path d="M7 4c0 6 10 8 10 14"/><path d="M17 4c0 6-10 8-10 14"/><path d="M8 6h8M8 18h8M10 9.5h4M10 14.5h4"/>',
  trend:'<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
  vial:'<path d="M9 3h6"/><path d="M10 3v15a2 2 0 0 0 4 0V3"/><path d="M10 11h4"/>',
  genetics:'<path d="M6 3c0 5 12 6 12 9s-12 4-12 9"/><path d="M18 3c0 5-12 6-12 9s12 4 12 9"/><path d="M8.5 6h7M8.5 18h7"/>',
  listdots:'<path d="M10 6h10M10 12h10M10 18h10"/><circle cx="5" cy="6" r="1.2"/><circle cx="5" cy="12" r="1.2"/><circle cx="5" cy="18" r="1.2"/>',
  watch:'<rect x="6" y="6" width="12" height="12" rx="3"/><path d="M9 6V3h6v3M9 18v3h6v-3"/><path d="M12 10v2l1.5 1.5"/>',
  calendar:'<rect x="4" y="5" width="16" height="16" rx="2"/><path d="M16 3v4M8 3v4M4 10h16"/>',
  folder:'<path d="M4 6a1 1 0 0 1 1-1h4l2 2h8a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z"/>',
  pill:'<path d="M5 12.5l7.5-7.5a4 4 0 0 1 5.5 5.5L10.5 18a4 4 0 0 1-5.5-5.5z"/><path d="M9 8l6 6"/>',
  bag:'<path d="M6 7h12l-1 13H7z"/><path d="M9 7a3 3 0 0 1 6 0"/>',
  user:'<circle cx="12" cy="8" r="4"/><path d="M5 21a7 7 0 0 1 14 0"/>',
  clipboard:'<rect x="6" y="4" width="12" height="16" rx="2"/><path d="M9 4h6v3H9z"/><path d="M9 11h6M9 15h4"/>',
  dumbbell:'<path d="M7 9v6M5 8v8M17 9v6M19 8v8M7 12h10"/>',
  apple:'<path d="M12 8c-3-1.5-7 .5-7 5 0 4 3 8 6 8 1 0 1.2-.5 1-.5s.6.5 1.6.5c3 0 5.4-4 5.4-8 0-4.5-4-6.5-7-5z"/><path d="M12 8c0-2 1.5-3.5 3.5-3.5"/>',
  checklist:'<path d="M11 6h9M11 12h9M11 18h9"/><path d="M4 6l1.4 1.4L8 4.5M4 12l1.4 1.4L8 10.5M4 18l1.4 1.4L8 16.5"/>',
  chat2:'<path d="M5 4h14a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1h-8l-4 3v-3H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z"/><path d="M8 8h8M8 11h5"/>',
  /* habit icons */
  droplet:'<path d="M12 3.5l5.2 8a6 6 0 1 1-10.4 0z"/>',
  milk:'<path d="M9 3h6v2.6l1 2.4v11a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-11l1-2.4z"/><path d="M8 9h8"/>',
  bowl:'<path d="M3 11h18a9 9 0 0 1-18 0z"/><path d="M9 6.5c0-1 .8-1.5 1.5-2M13 5c-.6.6-.8 1.3-.6 2"/>',
  run:'<circle cx="14" cy="5" r="1.6"/><path d="M4 17l4 .6 1.2-2.2"/><path d="M14 21l-.4-4.5-3.6-2.5 1-5"/><path d="M7.5 12l-.5-3 5-1 2.6 2.6 2.4.9"/>'
};
function icon(name){return '<svg viewBox="0 0 24 24">'+(ICONS[name]||'')+'</svg>';}
