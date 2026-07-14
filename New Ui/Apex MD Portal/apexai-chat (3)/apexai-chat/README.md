# ApexAI Chat — developer handoff

Renders the ApexAI assistant messages the way they look in the portal now:
structured blocks (lab snapshot, phase timeline, priority cards, product
recommendations, callouts) instead of raw markdown. Everything is self-contained
and works offline / via `file://`.

## What's here

```
apexai-chat/
├─ index.html                 # demo: portal shell + mounted chat widget
├─ package.json
├─ README.md
├─ src/
│  ├─ css/
│  │  ├─ apexai.css           # chat + all block components + portal shell
│  │  └─ fonts.css            # @font-face (Inter, JetBrains Mono) — vendored woff2
│  ├─ js/
│  │  ├─ icons.js             # inline SVG icon paths
│  │  ├─ inline.js            # **bold** formatter + markdown fallback
│  │  ├─ renderer.js          # blocks -> HTML   (the core of the handoff)
│  │  ├─ apexai.js            # chat widget: mount(), appendMessage()
│  │  └─ claude-client.js     # stub: where the live Anthropic call plugs in
│  ├─ data/
│  │  ├─ products.js / .json  # product catalog (Creatine, GLP-1/GIP)
│  │  ├─ conversations.js/.json  # the two sample conversations as block envelopes
│  │  ├─ schema.md            # block schema reference
│  │  └─ PROMPT.md            # system-prompt fragment for structured output
│  └─ assets/
│     ├─ img/                 # logos + product photos
│     └─ fonts/               # Inter + JetBrains Mono (woff2)
├─ tools/
│  ├─ build.mjs               # inline everything -> dist/apexai.html
│  ├─ serve.mjs               # zero-dep static dev server
│  └─ render-check.mjs        # Playwright screenshot of the build
└─ dist/
   └─ apexai.html             # prebuilt, fully self-contained
```

## Run it

```bash
# just open the standalone build:
open dist/apexai.html

# or run the modular source with a dev server:
npm run dev            # http://localhost:5173

# rebuild the self-contained file after edits:
npm run build

# visual check (needs playwright, or set CHROME_PATH to a Chromium):
npm run render-check
```

## How the AI plugs in

The renderer expects each assistant turn as a `{ meta, blocks }` envelope
(`src/data/schema.md`). Recommended flow:

1. Add the fragment in `src/data/PROMPT.md` to your ApexAI system prompt so
   Claude returns **only** the JSON envelope.
2. Proxy the Anthropic Messages API from your server (keep the key server-side).
3. Point `ENDPOINT` in `src/js/claude-client.js` at that route.
4. Mount with the live handler:

```js
ApexAI.mount(document.getElementById('apexai-root'), {
  conversation: { messages: [] },
  products: APEX_PRODUCTS,
  onSend: ApexAIClient.onSend   // sends to Claude, appends the rendered reply
});
```

If the model ever returns prose instead of blocks, the client wraps it in a
`markdown` block so the UI degrades gracefully — nothing breaks.

## Store product recommendations

ApexAI recommends **real Apex MD store products**. The store's own product
arrays are the source of truth — the AI recommends from the same data the shop
grid renders, so nothing goes stale.

```
src/store/
├─ store-adapter.js   # normalizes shop.html arrays (wl, peptides, hrt…) → catalog
└─ recommender.js     # signals/goals → SKU ids → product_rec block
src/data/
├─ store-catalog.js/.json   # demo catalog seeded from your product note
└─ PROMPT.store.md          # prompt fragment: the catalog + rules for Claude
```

**Two ways to recommend:**

1. **Claude-driven (recommended).** Add `PROMPT.store.md` to the system prompt.
   It lists every SKU with its indication and instructs Claude to emit
   `product_rec` blocks using real ids — and *not* to hard-sell products the
   labs don't support (e.g. no weight-loss push when metabolic markers are
   already optimal). The renderer resolves ids against the catalog.

2. **Rules-based (no API).**
   ```js
   var ids = ApexRecommender.forSignals(
     ['recovery','muscle','longevity'], catalog,
     { limit: 3, excludeCategories: ['concierge'] });
   widget.appendMessage({ role:'assistant', blocks:[ ApexRecommender.toBlock(ids) ] });
   ```

**Wiring to your live shop.html** — build the catalog from your existing arrays
so the AI and store share one source:
```js
const catalog = ApexStore.build({
  sources: {
    weight:{items:wl,label:'Weight Loss'}, peptide_blend:{items:peptideBlends,label:'Peptide Blend'},
    trt:{items:trt,label:'TRT'}, hrt:{items:hrt,label:'HRT'},
    peptide:{items:peptides,label:'Peptide'}, lab:{items:labdx,label:'Lab Diagnostics'},
    concierge:{items:memberships,label:'Concierge'}, program:{items:programs,label:'Fitness Program'}
  },
  PHOTO,
  fieldMap:{ id:'id', name:'name', price:'price', blurb:'desc', image:'img', tag:'badge' }
});
ApexAI.mount(root, { conversation:{messages:[]}, products:catalog, onSend:ApexAIClient.onSend });
```
Adjust `fieldMap` to your array keys. `image` may be a `PHOTO` key or a src —
the adapter resolves both.

> The demo catalog's prices, blurbs and images are placeholders from your note.
> Real values flow in automatically once the adapter reads your shop arrays.



Brand red `#D30603` · accent `#A60402` · good `#3E7C57` · purple `#7C3AED`.
Card radius 24px · nav pill radius 100px · Inter (UI) + JetBrains Mono
(numbers/labels). All defined as CSS variables at the top of `apexai.css`.

## Notes

- Product images are inlined as data URIs in the build; in production, swap the
  `image`/`cta.href` fields in `products.json` for real SKU URLs.
- The portal shell (sidebar/topbar/title) in `index.html` is the demo frame.
  In the live app, mount `ApexAI` into your existing modal container instead.
