/* Store-recommendation demo — ApexAI recommends REAL Apex MD store products
   (resolved from window.APEX_STORE_CATALOG) based on the patient's goals.
   The product_rec `items` are store SKU ids. */
window.APEX_CONVERSATIONS_STORE = {
  gym: {
    messages: [
      { role: 'user', text: 'What should I do in the gym to improve my health based on my lab results?' },
      {
        role: 'assistant',
        meta: 'targeted to your marker profile',
        blocks: [
          { type: 'intro', text: "Based on your lab results, here's a **targeted gym plan** built around your specific health markers — each priority maps to a value in your panel." },
          { type: 'section', label: 'Health Priorities Based on Labs' },
          {
            type: 'priority', num: '01', title: 'Support Kidney Function',
            driver: { markers: [{ label: 'Creatinine', value: '1.31 mg/dL' }], note: 'mildly elevated' },
            strategy: [
              { status: 'ok',   text: '**Moderate-intensity training** over extreme high-intensity' },
              { status: 'ok',   text: '**Hydrate heavily** — 16–20 oz water before, during & after workouts' },
              { status: 'warn', text: '**Avoid excessive creatine supplementation** until discussing with your doctor' },
              { status: 'ok',   text: "**Balance cardio with strength** — don't overtrain" }
            ],
            workouts: [
              { badge: { kind: 'freq', value: '3–4×/wk' }, text: '**Strength sessions** — avoid overtraining, which can elevate creatinine' },
              { badge: { kind: 'freq', value: '2–3×/wk' }, text: '**Cardio sessions** — helps kidney perfusion' }
            ]
          },
          {
            type: 'priority', num: '02', title: 'Build & Recover Lean Muscle',
            driver: { markers: [{ label: 'A1c', value: '5.2%' }, { label: 'Insulin', value: '2.3' }], note: 'excellent sensitivity' },
            strategy: [
              { status: 'ok', text: '**Resistance training** — excellent insulin sensitivity; keep it that way' },
              { status: 'ok', text: '**Prioritize recovery** — sleep, protein, and tissue repair drive adaptation' },
              { status: 'ok', text: '**Compound lifts** — most muscle recruited, best metabolic return' }
            ],
            workouts: [
              { badge: { kind: 'label', value: 'Compound' }, text: '**Squats, deadlifts, rows** — 3–4 sets in the 6–10 rep range' },
              { badge: { kind: 'label', value: 'Recovery' }, text: '**Deload every 4th week** — protect joints and connective tissue' }
            ]
          },
          {
            type: 'callout',
            text: "Two Apex MD options that fit these goals — a foundational **muscle-support supplement** plus a **low-dose metabolic** option to keep your markers dialed in. GLP-1 is physician-supervised, pending a quick consult."
          },
          {
            type: 'product_rec',
            label: 'Recommended from Apex MD',
            items: ['creatine', 'glp1-microdose']
          }
        ]
      }
    ]
  }
};
