/* Tiny inline formatter + minimal markdown fallback.
   Supports **bold**; escapes HTML. Used for all block text. */
(function () {
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function inline(s) {
    return esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
  }
  /* Fallback for when the model returns plain prose instead of blocks.
     Renders paragraphs, - bullets, and **bold** into the styled bubble. */
  function markdown(text) {
    var lines = String(text || '').split(/\n/);
    var html = [], list = null;
    lines.forEach(function (ln) {
      var t = ln.trim();
      if (/^[-*•]\s+/.test(t)) {
        if (!list) { list = []; }
        list.push('<li>' + inline(t.replace(/^[-*•]\s+/, '')) + '</li>');
      } else {
        if (list) { html.push('<ul class="md-ul">' + list.join('') + '</ul>'); list = null; }
        if (t) { html.push('<p class="md-p">' + inline(t) + '</p>'); }
      }
    });
    if (list) { html.push('<ul class="md-ul">' + list.join('') + '</ul>'); }
    return html.join('');
  }
  window.apexEsc = esc;
  window.apexInline = inline;
  window.apexMarkdown = markdown;
})();
