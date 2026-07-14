/* ApexAI chat widget controller.
   Builds the chat panel (header, disclaimer, message stream, composer) and
   renders a conversation via ApexAIRenderer. Also exposes appendMessage() for
   live use once responses come back from Claude.

   Usage:
     ApexAI.mount(document.getElementById('apexai-root'), {
       conversation: APEX_CONVERSATIONS.gym,   // { messages: [...] }
       products:     APEX_PRODUCTS,            // catalog keyed by id
       onSend: function (text, api) { ... }    // optional
     });
*/
(function () {
  var SVG = window.apexSvg, E = window.apexEsc, R = window.ApexAIRenderer;

  function chrome(o) {
    return '' +
      '<div class="chat-head">' +
        '<div class="spark">' + SVG('spark') + '</div>' +
        '<div class="head-title">' + E(o.title || 'ApexAI — Personalized Health Advisor') + '</div>' +
        '<div class="live"><span class="dot"></span>Live Data</div>' +
        '<div class="win"><span>&minus;</span><span>&#10066;</span><span>&times;</span></div>' +
      '</div>' +
      '<div class="disclaimer">' + E(o.disclaimer ||
        'Educational information only — not a substitute for medical advice.') +
        ' &nbsp;<b>ApexAI reads your bloodwork, HRV &amp; health data for personalized insights.</b></div>';
  }

  function composer() {
    return '<div class="composer"><div class="inp">' +
      '<span class="att">' + SVG('attach') + '</span>' +
      '<input placeholder="Ask ApexAI — analyzes your bloodwork, HRV &amp; more…">' +
      '<span class="send">' + SVG('send') + '</span></div></div>';
  }

  function renderMessage(m, products) {
    if (m.role === 'user') {
      return '<div class="user-row"><div class="user-bubble">' + E(m.text) + '</div></div>';
    }
    var name = 'ApexAI' + (m.meta ? '<span class="thin"> · ' + E(m.meta) + '</span>' : '');
    return '<div class="ai-row"><div class="ai-av">' + SVG('spark') + '</div>' +
      '<div class="ai-body"><div class="ai-name">' + name + '</div>' +
      R.renderBlocks(m.blocks, products) + '</div></div>';
  }

  var ApexAI = {
    _root: null, _stream: null, _products: null, _opts: null,

    mount: function (root, opts) {
      opts = opts || {};
      this._root = root; this._products = opts.products || {}; this._opts = opts;
      var conv = opts.conversation || { messages: [] };
      root.innerHTML =
        '<div class="chat">' + chrome(opts) +
        '<div class="stream" id="apexai-stream">' +
          conv.messages.map(function (m) { return renderMessage(m, opts.products); }).join('') +
        '</div>' + composer() + '</div>';
      this._stream = root.querySelector('#apexai-stream');
      this._wire();
      return this;
    },

    appendMessage: function (m) {
      if (!this._stream) return;
      this._stream.insertAdjacentHTML('beforeend', renderMessage(m, this._products));
      this._stream.scrollTop = this._stream.scrollHeight;
    },

    _wire: function () {
      var self = this;
      var input = this._root.querySelector('.inp input');
      var send  = this._root.querySelector('.send');
      function fire() {
        var text = (input.value || '').trim();
        if (!text) return;
        self.appendMessage({ role: 'user', text: text });
        input.value = '';
        if (typeof self._opts.onSend === 'function') {
          self._opts.onSend(text, self);   // hand off to Claude client
        }
      }
      if (send)  send.addEventListener('click', fire);
      if (input) input.addEventListener('keydown', function (e) { if (e.key === 'Enter') fire(); });
    }
  };

  window.ApexAI = ApexAI;
})();
