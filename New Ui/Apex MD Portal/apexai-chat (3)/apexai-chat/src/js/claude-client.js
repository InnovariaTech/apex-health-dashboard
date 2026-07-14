/* Claude client stub — where the live AI plugs in.

   The renderer expects each assistant turn as a { meta, blocks } envelope
   (see src/data/schema.md). Two supported paths:

   1) STRUCTURED (recommended): instruct Claude to return ONLY the JSON
      envelope (see src/data/PROMPT.md). Parse it and pass straight to the
      renderer. Deterministic, no client-side parsing of prose.

   2) FALLBACK: if the model returns prose, wrap it in a single markdown
      block so nothing breaks:  { blocks:[{ type:'markdown', text: prose }] }

   Wire this into ApexAI.mount({ onSend }). This file ships as a stub: point
   ENDPOINT at your backend route that proxies the Anthropic Messages API
   (keep your API key server-side — never in the browser).
*/
(function () {
  var ENDPOINT = '/api/apexai';           // <-- your server route
  var MODEL    = 'claude-sonnet-4-6';

  async function ask(userText, history) {
    var res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: MODEL, message: userText, history: history || [] })
    });
    var data = await res.json();

    // Expect the server to return { meta, blocks } (structured path).
    if (data && Array.isArray(data.blocks)) {
      return { role: 'assistant', meta: data.meta || '', blocks: data.blocks };
    }
    // Fallback: treat whatever text came back as markdown.
    var text = (data && (data.text || data.reply)) || '';
    return { role: 'assistant', blocks: [{ type: 'markdown', text: text }] };
  }

  window.ApexAIClient = {
    // Convenience onSend handler for ApexAI.mount({ onSend: ApexAIClient.onSend })
    onSend: function (text, widget) {
      ask(text).then(function (msg) { widget.appendMessage(msg); })
               .catch(function (e) {
                 widget.appendMessage({ role: 'assistant',
                   blocks: [{ type: 'markdown', text: 'Sorry — something went wrong. ' + e }] });
               });
    },
    ask: ask
  };
})();
