/* Apex MD — Lab Kits
 * Renders the page from window.APEX_DATA (built from data/*.json).
 * Image sources resolve to real files in dev, or inlined base64 in dist
 * (tools/build-inline.js injects window.APEX_ASSETS).
 */
(function () {
  var D = window.APEX_DATA || {};
  var ICONS = D.icons || {};

  function icon(name, cls) {
    var inner = ICONS[name] || '';
    return '<svg class="' + (cls || 'ic') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
      'stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + inner + '</svg>';
  }

  // assets/img/<file> in dev; data-URI from APEX_ASSETS when inlined into dist
  function assetUrl(file) {
    if (window.APEX_ASSETS && window.APEX_ASSETS[file]) return window.APEX_ASSETS[file];
    return 'assets/img/' + file;
  }

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function navItem(it) {
    return '<a class="nav-item' + (it.active ? ' active' : '') + '" href="#">' +
      icon(it.icon) + '<span>' + esc(it.label) + '</span></a>';
  }

  function navGroup(g, idx) {
    var brand = '<div class="brand ' + (g.brandClass || '') + '">' +
      '<img src="' + assetUrl(g.brand) + '" alt="' + esc(g.brandAlt) + '"></div>';
    var items = '<nav class="nav-section ' + (g.brandClass === 'brand-fit' ? 'nav-fit' : '') + '"' +
      (idx > 0 ? ' style="margin-top:14px"' : '') + '>' +
      g.items.map(navItem).join('') + '</nav>';
    // first group: brand, then "Menu" label, then items. later groups: divider, brand, items.
    if (idx === 0) {
      return brand + '<div class="nav-label">' + esc(D.nav.menuLabel) + '</div>' + items;
    }
    return '<div class="brand-divider"></div>' + brand + items;
  }

  function sidebar() {
    return '<aside class="sidebar">' + D.nav.groups.map(navGroup).join('') + '</aside>';
  }

  function topbar() {
    var p = D.page;
    return '<header class="topbar">' +
      '<div class="crumbs">' + esc(p.crumbRoot) + ' ' + icon('chevron-right', 'sep') +
      '<span class="here">' + esc(p.crumbHere) + '</span></div>' +
      '<label class="search">' + icon('search') +
      '<input placeholder="' + esc(p.searchPlaceholder) + '"></label></header>';
  }

  function pageHead() {
    var p = D.page, m = D.member;
    return '<div class="page-head"><div>' +
      '<h1>' + esc(p.titleLead) + ' <em>' + esc(p.titleAccent) + '</em></h1>' +
      '<p class="sub">' + esc(p.sub) + '</p></div>' +
      '<div class="member-chip"><div class="avatar">' + esc(m.initials) + '</div><div>' +
      '<div class="member-name">' + esc(m.name) + '</div>' +
      '<div class="member-meta">' + esc(m.meta) + '</div></div></div></div>';
  }

  function card(k) {
    return '<article class="kit-card">' +
      '<div class="kit-hero"><img src="' + assetUrl(k.image) + '" alt="' + esc(k.title) + '"></div>' +
      '<div class="kit-body">' +
      '<div class="kit-eyebrow">' + esc(k.eyebrow) + '</div>' +
      '<h3 class="kit-title">' + esc(k.title) + '</h3>' +
      '<p class="kit-desc">' + esc(k.desc) + '</p>' +
      '<div class="kit-actions">' +
      '<button class="btn btn-ghost">' + icon('truck', 'bic') + 'Track my test</button>' +
      '<button class="btn btn-ghost">' + icon('chart-bar', 'bic') + 'See my results</button>' +
      '</div>' +
      '<button class="btn btn-buy">' + icon('shopping-cart', 'bic') +
      'Purchase<span class="price">' + esc(k.price) + '</span></button>' +
      '</div></article>';
  }

  function grid() {
    return '<section class="kit-grid">' + D.kits.map(card).join('') + '</section>';
  }

  function render() {
    document.getElementById('app').innerHTML =
      '<div class="app">' + sidebar() +
      '<main class="main">' + topbar() +
      '<div class="content">' + pageHead() + grid() + '</div>' +
      '</main></div>';
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', render);
  } else {
    render();
  }
})();
