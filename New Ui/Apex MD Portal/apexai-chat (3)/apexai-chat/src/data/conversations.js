/* Sample conversations — the two demos, expressed as block envelopes.
   `gym` renders in index.html. `plan8week` is included as a second example
   of the phase_plan + lab_snapshot block types. */
window.APEX_CONVERSATIONS = {

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
              { status: 'ok',   text: '**Proper warm-up / cool-down** — 10 min each session' },
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
            type: 'priority', num: '02', title: 'Maintain Excellent Metabolic Health',
            driver: { markers: [{ label: 'A1c', value: '5.2%' }, { label: 'Insulin', value: '2.3' }] },
            strategy: [
              { status: 'ok', text: '**Resistance training** — excellent insulin sensitivity; keep it that way' },
              { status: 'ok', text: '**Build / maintain muscle mass** — muscle is metabolically active tissue' },
              { status: 'ok', text: '**HIIT workouts** — improve glucose uptake' }
            ],
            workouts: [
              { badge: { kind: 'label', value: 'Compound' }, text: '**Compound lifts** — squats, deadlifts, lunges, rows (most muscle recruited, improves insulin sensitivity)' },
              { badge: { kind: 'label', value: 'Circuit' },  text: '**Circuit training** — 30–45 min sessions, minimal rest between exercises' },
              { badge: { kind: 'label', value: 'Timing' },   text: '**Post-workout** — body handles glucose well, a good window for carbs if needed' }
            ]
          },
          {
            type: 'priority', num: '03', title: 'Optimize Cardiovascular Health',
            driver: { markers: [{ label: 'HDL', value: '50' }, { label: 'LDL', value: '91' }], note: 'good lipids' },
            strategy: [
              { status: 'ok', text: '**Maintain current heart health** with regular cardio' },
              { status: 'ok', text: '**Zone 2 cardio** — conversational pace, 60–70% max heart rate' },
              { status: 'ok', text: '**Mix steady-state and intervals**' }
            ],
            workouts: [
              { badge: { kind: 'freq', value: '2×/wk' }, text: '**Zone 2 cardio** — 30–45 min (treadmill, elliptical, bike)' },
              { badge: { kind: 'freq', value: '1×/wk' }, text: '**HIIT intervals** — 20–25 min', sub: '30 sec sprint · 90 sec recovery × 10 rounds' }
            ]
          },
          { type: 'product_rec', label: 'Recommended from Apex MD', items: ['creatine', 'glp1'] },
          { type: 'callout', text: 'Your labs look strong for fitness optimization — good hormonal support, metabolic health, and no major red flags. This plan leverages your strengths. **Want me to turn these priorities into a weekly split, or set nutrition targets from your body weight?**' }
        ]
      }
    ]
  },

  plan8week: {
    messages: [
      { role: 'user', text: 'Based on my results, give me an 8-week optimization plan I can do at EOS Fitness.' },
      {
        role: 'assistant',
        meta: 'analyzed 2 lab panels · May & Apr 2026',
        blocks: [
          { type: 'intro', text: "I pulled your two most recent panels and built a phased plan around them. Here's where you stand and an **8-week protocol** mapped to EOS Fitness equipment." },
          {
            type: 'lab_snapshot', tag: '8 markers',
            strengths: [
              { name: 'Testosterone & Free T', note: 'Normal androgen profile', value: '628 / 23.5' },
              { name: 'Lipid panel', note: 'Total / HDL / LDL', value: '149·50·91' },
              { name: 'Hemoglobin A1c', note: 'Excellent glucose control', value: '5.2%' },
              { name: 'TSH', note: 'Normal thyroid function', value: '2.99' },
              { name: 'Vitamin D', note: 'Sufficient', value: '51.6' }
            ],
            watch: [
              { name: 'MCV — slightly elevated', note: 'Hydration / B-vitamin optimization', value: '98 fL' },
              { name: 'Creatinine — mild', note: 'Watch kidney; likely muscle mass', value: '1.31' },
              { name: 'Insulin — low-normal', note: 'Good insulin sensitivity', value: '2.3' }
            ]
          },
          {
            type: 'phase_plan', tag: 'EOS Fitness', title: '8-Week Optimization Plan',
            phases: [
              { num: '1', weeks: 'Weeks 1–2', name: 'Foundation Phase', goal: '**Goal:** Build baseline fitness, establish routine, optimize hydration.',
                items: [
                  { cat: 'strength',  freq: '3×/wk', text: 'Full-body compound lifts.', sub: 'Squats, deadlifts, bench press, rows · 3 sets × 8–12 reps' },
                  { cat: 'cardio',    freq: '2×/wk', text: '20–30 min moderate intensity (Zone 2)' },
                  { cat: 'hydration', text: '3–4 L water daily', sub: 'Directly addresses creatinine & MCV' },
                  { cat: 'recovery',  text: '7–8 hours sleep' }
                ] },
              { num: '2', weeks: 'Weeks 3–4', name: 'Build Phase', goal: '**Goal:** Increase volume, improve cardiovascular capacity.',
                items: [
                  { cat: 'strength',  freq: '4×/wk', text: 'Upper/Lower split.', sub: 'Add progressive overload · 5–10% weight increase' },
                  { cat: 'cardio',    freq: '3×/wk', text: '20 min HIIT + 30 min steady-state' },
                  { cat: 'nutrition', text: 'Adequate protein — 0.8–1 g per lb bodyweight', sub: 'Supports testosterone levels' }
                ] },
              { num: '3', weeks: 'Weeks 5–6', name: 'Intensity Phase', goal: '**Goal:** Peak performance, metabolic optimization.',
                items: [
                  { cat: 'strength', freq: '4×/wk', text: 'Push/Pull/Legs split.', sub: 'Higher intensity · 4–6 reps for strength' },
                  { cat: 'cardio',   freq: '3×/wk', text: '2 HIIT sessions + 1 longer steady-state (45 min)' },
                  { cat: 'recovery', text: 'Active recovery — yoga or stretching (1×/wk)' }
                ] },
              { num: '4', weeks: 'Weeks 7–8', name: 'Performance & Retest', retest: true, goal: '**Goal:** Consolidate gains, prepare for reassessment.',
                items: [
                  { cat: 'strength', freq: '4×/wk',   text: 'Continue split, test 1-rep maxes' },
                  { cat: 'cardio',   freq: '2–3×/wk', text: 'Maintain cardiovascular fitness' }
                ] }
            ]
          },
          { type: 'callout', text: 'Retest recommended at week 8 — MCV, creatinine & insulin to confirm hydration and metabolic gains. **Want this pushed to your Programs tab?**' }
        ]
      }
    ]
  }

};
