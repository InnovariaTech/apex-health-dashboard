/* Store adapter — normalizes the Apex MD shop's own product arrays into the
   catalog shape ApexAI recommends from, so the AI and the store grid share
   ONE source of truth (no duplicated product data).

   In shop.html the data lives in JS arrays (wl, peptideBlends, trt, hrt,
   peptides, labdx, memberships, programs) with images in a PHOTO = {} object.
   Field names vary, so pass a `fieldMap` telling the adapter which keys hold
   the id/name/price/blurb/image/tag. Everything is best-effort with fallbacks.

   Usage (in shop.html, after the arrays are defined):

     const catalog = ApexStore.build({
       sources: {
         weight:        { items: wl,            label: 'Weight Loss' },
         peptide_blend: { items: peptideBlends, label: 'Peptide Blend' },
         trt:           { items: trt,           label: 'TRT' },
         hrt:           { items: hrt,           label: 'HRT' },
         peptide:       { items: peptides,      label: 'Peptide' },
         lab:           { items: labdx,         label: 'Lab Diagnostics' },
         concierge:     { items: memberships,   label: 'Concierge' },
         program:       { items: programs,      label: 'Fitness Program' }
       },
       PHOTO,
       fieldMap: { id:'id', name:'name', price:'price', blurb:'desc',
                   image:'img', tag:'badge' },     // <-- match your keys
       signals: APEX_SIGNAL_MAP                    // optional id->signals
     });
*/
(function () {
  function slug(s) {
    return String(s || '').toLowerCase().replace(/[^\w]+/g, '-').replace(/^-+|-+$/g, '');
  }
  function pick(obj, keys) {
    for (var i = 0; i < keys.length; i++) if (obj[keys[i]] != null) return obj[keys[i]];
    return undefined;
  }
  function resolveImage(item, fm, PHOTO) {
    var img = fm.image ? item[fm.image] : (item.img || item.image);
    // If the field is a PHOTO key rather than a src, resolve it.
    if (PHOTO && typeof img === 'string' && PHOTO[img]) {
      var p = PHOTO[img];
      return (p && p.src) ? p.src : p;
    }
    if (img && typeof img === 'object' && img.src) return img.src;
    return img || '';
  }

  function build(cfg) {
    cfg = cfg || {};
    var fm = Object.assign({ id: 'id', name: 'name', price: 'price', blurb: 'desc',
                             image: 'img', tag: 'badge' }, cfg.fieldMap || {});
    var PHOTO = cfg.PHOTO || {};
    var sig = cfg.signals || {};
    var catalog = {};

    Object.keys(cfg.sources || {}).forEach(function (category) {
      var src = cfg.sources[category];
      (src.items || []).forEach(function (item) {
        var name = pick(item, [fm.name, 'name', 'title']) || '';
        var id = slug(pick(item, [fm.id, 'id', 'sku']) || name);
        if (!id) return;
        catalog[id] = {
          id: id,
          category: category,
          categoryLabel: src.label || category,
          name: name,
          eyebrow: 'Apex MD · ' + (src.label || category),
          blurb: pick(item, [fm.blurb, 'desc', 'blurb', 'summary']) || '',
          spec: pick(item, [fm.price, 'price', 'cost']) || '',
          tag: pick(item, [fm.tag, 'badge', 'tag']) || src.label || category,
          image: resolveImage(item, fm, PHOTO),
          cta: { label: 'Shop', href: (cfg.hrefBase || 'shop.html?sku=') + id },
          signals: sig[id] || item.signals || []
        };
      });
    });
    return catalog;
  }

  window.ApexStore = { build: build, slug: slug };
})();
