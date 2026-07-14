const biomarkers = [
  {
    id:'ldl', name:'LDL-C', full:'Low-density lipoprotein cholesterol', cat:'lipids',
    value:108, unit:'mg/dL', status:'bord',
    rangeLo:40, rangeHi:200, optLo:70, optHi:100, prev:118,
    history:[148,138,128,122,118,108],
    labels:['Q4 24','Q1 25','Q2 25','Q3 25','Q4 25','Q1 26'],
    desirable:'down',
    what:'LDL particles deliver cholesterol from the liver to peripheral tissues. Excess circulating LDL is the primary substrate for arterial plaque formation, making it one of the most actionable modifiable risk factors for cardiovascular disease.',
    moves:[
      {f:'Saturated fat intake', d:'up'},
      {f:'Statin therapy', d:'down'},
      {f:'Soluble fiber (oats, beans)', d:'down'},
      {f:'Body fat percentage', d:'up'},
      {f:'Plant sterols', d:'down'},
      {f:'Refined carbs', d:'up'},
    ],
    plan:[
      'Continue rosuvastatin 5mg nightly',
      'Add 5g psyllium husk to morning routine',
      'Target 30g soluble fiber daily (oats, beans, apples)',
      'Recheck at the next quarterly draw',
    ],
    related:['ApoB','HDL-C','Triglycerides'],
  },
  {
    id:'hdl', name:'HDL-C', full:'High-density lipoprotein cholesterol', cat:'lipids',
    value:58, unit:'mg/dL', status:'opt',
    rangeLo:25, rangeHi:90, optLo:50, optHi:80, prev:54,
    history:[44,48,50,52,54,58],
    labels:['Q4 24','Q1 25','Q2 25','Q3 25','Q4 25','Q1 26'],
    desirable:'up',
    what:'HDL transports cholesterol back to the liver for clearance. Higher levels generally correlate with cardiovascular protection, though the relationship plateaus and very high HDL is not necessarily better.',
    moves:[
      {f:'Aerobic exercise', d:'up'},
      {f:'Olive oil intake', d:'up'},
      {f:'Body fat percentage', d:'down'},
      {f:'Smoking', d:'down'},
      {f:'Refined carbs', d:'down'},
      {f:'Moderate alcohol', d:'up'},
    ],
    plan:[
      'Maintain Zone 2 cardio 4x/week',
      'Continue current Mediterranean-style eating pattern',
      'Trajectory is excellent — no changes needed',
    ],
    related:['ApoB','Triglycerides','ApoA1'],
  },
  {
    id:'trig', name:'Triglycerides', full:'Serum triglycerides', cat:'lipids',
    value:86, unit:'mg/dL', status:'opt',
    rangeLo:30, rangeHi:250, optLo:60, optHi:100, prev:94,
    history:[125,118,108,98,94,86],
    labels:['Q4 24','Q1 25','Q2 25','Q3 25','Q4 25','Q1 26'],
    desirable:'down',
    what:'The storage form of fat in the blood. Elevated triglycerides reflect carbohydrate excess and insulin resistance more than dietary fat intake. They form a powerful trio with HDL and fasting glucose for diagnosing metabolic syndrome.',
    moves:[
      {f:'Refined carbohydrates', d:'up'},
      {f:'Alcohol intake', d:'up'},
      {f:'Omega-3 fatty acids', d:'down'},
      {f:'Exercise', d:'down'},
      {f:'Body fat', d:'up'},
      {f:'Fructose intake', d:'up'},
    ],
    plan:[
      'Hold steady — refined-carb reduction is paying off',
      'Continue 2g EPA+DHA daily',
      'Maintain alcohol below 4 drinks per week',
    ],
    related:['HbA1c','Fasting insulin','VLDL'],
  },
  {
    id:'hba1c', name:'HbA1c', full:'Glycated hemoglobin', cat:'metabolic',
    value:5.2, unit:'%', status:'opt',
    rangeLo:4, rangeHi:7, optLo:4.8, optHi:5.6, prev:5.3,
    history:[5.5,5.4,5.4,5.3,5.3,5.2],
    labels:['Q4 24','Q1 25','Q2 25','Q3 25','Q4 25','Q1 26'],
    desirable:'down',
    what:'Average blood glucose over the past 90 days, measured via glycated hemoglobin. The single best summary of long-term metabolic health and one of the strongest predictors of all-cause mortality.',
    moves:[
      {f:'Refined carb intake', d:'up'},
      {f:'Sleep deprivation', d:'up'},
      {f:'Resistance training', d:'down'},
      {f:'Body fat percentage', d:'up'},
      {f:'Time-restricted eating', d:'down'},
      {f:'Walking after meals', d:'down'},
    ],
    plan:[
      'Maintain current eating window (16:8)',
      'Continue resistance training 3x/week',
      'No changes — this is an excellent value',
    ],
    related:['Fasting glucose','Fasting insulin','HOMA-IR'],
  },
  {
    id:'fg', name:'Fasting glucose', full:'Plasma glucose, fasting', cat:'metabolic',
    value:88, unit:'mg/dL', status:'opt',
    rangeLo:60, rangeHi:120, optLo:75, optHi:95, prev:91,
    history:[94,92,93,91,90,88],
    labels:['Q4 24','Q1 25','Q2 25','Q3 25','Q4 25','Q1 26'],
    desirable:'down',
    what:'Glucose level after 8+ hours fasting. A spot-check of basal glucose regulation. Less informative than HbA1c or fasting insulin in isolation, but useful as part of a metabolic panel.',
    moves:[
      {f:'Late-night meals', d:'up'},
      {f:'Stress', d:'up'},
      {f:'Sleep quality', d:'down'},
      {f:'Resistance training', d:'down'},
      {f:'Morning cortisol', d:'up'},
      {f:'Cold exposure', d:'down'},
    ],
    plan:[
      'Continue current routine',
      'Optional: track with CGM for 14 days next quarter',
    ],
    related:['HbA1c','Fasting insulin','Cortisol'],
  },
  {
    id:'fi', name:'Fasting insulin', full:'Serum insulin, fasting', cat:'metabolic',
    value:5.8, unit:'μIU/mL', status:'opt',
    rangeLo:0, rangeHi:20, optLo:3, optHi:8, prev:7.1,
    history:[8.4,7.8,7.5,7.1,6.4,5.8],
    labels:['Q4 24','Q1 25','Q2 25','Q3 25','Q4 25','Q1 26'],
    desirable:'down',
    what:'The earliest and most sensitive indicator of insulin resistance — often abnormal years before glucose moves. Considered by many longevity clinicians the single most important metabolic marker to track.',
    moves:[
      {f:'Body fat percentage', d:'up'},
      {f:'Refined carb intake', d:'up'},
      {f:'Resistance training', d:'down'},
      {f:'Sleep quality', d:'down'},
      {f:'Time-restricted eating', d:'down'},
      {f:'Visceral adiposity', d:'up'},
    ],
    plan:[
      'Strong downward trajectory — keep the 16:8 protocol',
      'Maintain current training volume',
      'Aim for the lower half of the optimal range',
    ],
    related:['HbA1c','Glucose','HOMA-IR'],
  },
  {
    id:'alt', name:'ALT', full:'Alanine aminotransferase', cat:'metabolic',
    value:42, unit:'U/L', status:'att',
    rangeLo:5, rangeHi:80, optLo:15, optHi:30, prev:32,
    history:[22,24,28,30,32,42],
    labels:['Q4 24','Q1 25','Q2 25','Q3 25','Q4 25','Q1 26'],
    desirable:'down',
    what:'A liver enzyme released into circulation when hepatocytes are stressed or damaged. The most sensitive routine marker for liver health. Modest elevations can occur with intense training, alcohol, statins, or fatty liver.',
    moves:[
      {f:'Alcohol intake', d:'up'},
      {f:'Hepatic steatosis', d:'up'},
      {f:'Intense exercise (transient)', d:'up'},
      {f:'Some medications', d:'up'},
      {f:'Body fat percentage', d:'up'},
      {f:'Acetaminophen', d:'up'},
    ],
    plan:[
      'Repeat ALT/AST in 4 weeks to confirm trend',
      'Schedule hepatic ultrasound',
      'Audit alcohol intake and training load',
      'Review all medications and supplements',
    ],
    related:['AST','GGT','Bilirubin'],
  },
  {
    id:'t', name:'Testosterone', full:'Total testosterone', cat:'hormones',
    value:612, unit:'ng/dL', status:'opt',
    rangeLo:250, rangeHi:1100, optLo:500, optHi:900, prev:580,
    history:[520,540,560,575,580,612],
    labels:['Q4 24','Q1 25','Q2 25','Q3 25','Q4 25','Q1 26'],
    desirable:'up',
    what:'The primary male sex hormone, also involved in body composition, mood regulation, bone density, libido, and metabolic health. Free testosterone (the unbound fraction) is generally more biologically relevant than total.',
    moves:[
      {f:'Body fat percentage', d:'down'},
      {f:'Sleep quality', d:'up'},
      {f:'Resistance training', d:'up'},
      {f:'Chronic stress', d:'down'},
      {f:'Zinc & vitamin D', d:'up'},
      {f:'Endurance overtraining', d:'down'},
    ],
    plan:[
      'Trajectory is excellent — keep current protocol',
      'Continue prioritizing 7.5+ hours sleep',
      'Recheck with free testosterone & SHBG next panel',
    ],
    related:['Free testosterone','SHBG','Estradiol'],
  },
  {
    id:'tsh', name:'TSH', full:'Thyroid stimulating hormone', cat:'hormones',
    value:1.8, unit:'mIU/L', status:'opt',
    rangeLo:0.3, rangeHi:5, optLo:0.8, optHi:2.5, prev:1.9,
    history:[2.1,2.0,1.9,1.9,1.9,1.8],
    labels:['Q4 24','Q1 25','Q2 25','Q3 25','Q4 25','Q1 26'],
    desirable:'flat',
    what:'The pituitary signal to the thyroid gland. Elevated TSH indicates the pituitary is working harder to coax thyroid output. Sits comfortably in the optimal mid-range for metabolic and cognitive function.',
    moves:[
      {f:'Iodine deficiency', d:'up'},
      {f:'Selenium deficiency', d:'up'},
      {f:'Chronic stress', d:'up'},
      {f:'Autoimmunity', d:'up'},
      {f:'Caloric restriction', d:'up'},
    ],
    plan:[
      'Stable and optimal — annual rechecks sufficient',
      'No supplementation needed at this time',
    ],
    related:['Free T4','Free T3','Anti-TPO'],
  },
  {
    id:'crp', name:'hs-CRP', full:'High-sensitivity C-reactive protein', cat:'inflammation',
    value:0.6, unit:'mg/L', status:'opt',
    rangeLo:0, rangeHi:5, optLo:0, optHi:1, prev:0.9,
    history:[1.4,1.2,1.0,0.9,0.7,0.6],
    labels:['Q4 24','Q1 25','Q2 25','Q3 25','Q4 25','Q1 26'],
    desirable:'down',
    what:'The most accessible marker of systemic inflammation and an independent risk factor for cardiovascular events. Chronic low-grade elevation correlates with metabolic dysfunction, poor sleep, and overall mortality.',
    moves:[
      {f:'Visceral fat', d:'up'},
      {f:'Refined carbs', d:'up'},
      {f:'Sleep quality', d:'down'},
      {f:'Omega-3 intake', d:'down'},
      {f:'Periodontal health', d:'down'},
      {f:'Regular exercise', d:'down'},
    ],
    plan:[
      'Excellent — continue current anti-inflammatory practices',
      'Maintain omega-3 supplementation',
    ],
    related:['IL-6','Fibrinogen','Ferritin'],
  },
  {
    id:'hcy', name:'Homocysteine', full:'Plasma homocysteine', cat:'inflammation',
    value:8.2, unit:'μmol/L', status:'opt',
    rangeLo:4, rangeHi:15, optLo:5, optHi:9, prev:8.4,
    history:[9.1,8.9,8.6,8.5,8.4,8.2],
    labels:['Q4 24','Q1 25','Q2 25','Q3 25','Q4 25','Q1 26'],
    desirable:'down',
    what:'An amino acid intermediate in methylation. Elevations indicate B-vitamin pathway issues (folate, B12, B6) and correlate independently with cardiovascular events, cognitive decline, and dementia risk.',
    moves:[
      {f:'B12 deficiency', d:'up'},
      {f:'Folate deficiency', d:'up'},
      {f:'MTHFR variants', d:'up'},
      {f:'Alcohol intake', d:'up'},
      {f:'Coffee (high intake)', d:'up'},
      {f:'Methylated B complex', d:'down'},
    ],
    plan:[
      'Continue current methylated B-complex',
      'Optional: test methylmalonic acid if curious about B12 status',
    ],
    related:['Vitamin B12','Folate','Methylmalonic acid'],
  },
  {
    id:'vd', name:'Vitamin D, 25-OH', full:'25-hydroxyvitamin D', cat:'vitamins',
    value:48, unit:'ng/mL', status:'opt',
    rangeLo:10, rangeHi:100, optLo:40, optHi:80, prev:42,
    history:[28,32,36,40,42,48],
    labels:['Q4 24','Q1 25','Q2 25','Q3 25','Q4 25','Q1 26'],
    desirable:'up',
    what:'Hormonally active vitamin involved in bone health, immune function, mood regulation, and the expression of over 200 genes. Most adults benefit from supplementation, particularly at higher latitudes.',
    moves:[
      {f:'Sun exposure', d:'up'},
      {f:'D3 supplementation', d:'up'},
      {f:'Body fat (sequesters)', d:'down'},
      {f:'Magnesium status (cofactor)', d:'up'},
      {f:'Vitamin K2 (works with)', d:'up'},
    ],
    plan:[
      'Continue 4000 IU D3 + 100mcg K2 daily',
      'Target upper third of optimal range (60+ ng/mL)',
    ],
    related:['Calcium','PTH','Magnesium'],
  },
];

function fmt(n) {
  return Math.abs(n) < 1 ? Number(n).toFixed(1) : Math.round(n).toString();
}

function markerPercent(b, val) {
  const v = val !== undefined ? val : b.value;
  if (v < b.optLo) return Math.max(2, ((v - b.rangeLo) / (b.optLo - b.rangeLo)) * 32);
  if (v <= b.optHi) return 32 + ((v - b.optLo) / (b.optHi - b.optLo)) * 36;
  return Math.min(98, 68 + ((v - b.optHi) / (b.rangeHi - b.optHi)) * 32);
}

function isGoodDelta(b) {
  const delta = b.value - b.prev;
  if (b.desirable === 'flat') return Math.abs(delta) < 0.5;
  if (b.desirable === 'up') return delta > 0;
  return delta < 0;
}

function makeSparkline(data, status) {
  const w = 80, h = 26;
  const max = Math.max(...data), min = Math.min(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 6) - 3;
    return x.toFixed(1) + ',' + y.toFixed(1);
  }).join(' ');
  const color = status === 'opt' ? '#2E7D5A' : status === 'bord' ? '#B8761C' : '#B23A3A';
  const last = data[data.length-1];
  const lastY = h - ((last - min) / range) * (h - 6) - 3;
  return `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}"><polyline points="${points}" fill="none" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="${w}" cy="${lastY.toFixed(1)}" r="2.5" fill="${color}"/></svg>`;
}

function renderBiomarkers(cat) {
  const grid = document.getElementById('bmgrid');
  const filtered = cat === 'all' ? biomarkers : biomarkers.filter(b => b.cat === cat);
  grid.innerHTML = filtered.map((b, i) => {
    const mk = markerPercent(b);
    const mkPrev = markerPercent(b, b.prev);
    const delta = b.value - b.prev;
    const good = isGoodDelta(b);
    const deltaClass = good ? 'good' : 'bad';
    const deltaStr = (delta > 0 ? '+' : '') + fmt(delta);
    const arrow = delta > 0 ? 'ti-arrow-up-right' : delta < 0 ? 'ti-arrow-down-right' : 'ti-arrow-right';
    const catLabel = b.cat.charAt(0).toUpperCase() + b.cat.slice(1);
    const statusLabel = b.status === 'opt' ? 'optimal' : b.status === 'bord' ? 'borderline' : 'attention';
    const lo = Math.min(mk, mkPrev), hi = Math.max(mk, mkPrev);
    const connStyle = `left:${lo}%; width:${(hi-lo)}%`;
    return `
      <button class="bm" data-drill="${b.id}" style="animation-delay: ${i*40}ms">
        <div class="bm-h">
          <div>
            <p class="bm-name">${b.name}</p>
            <p class="bm-cat">${catLabel}</p>
          </div>
          <span class="dot ${b.status}" aria-label="${statusLabel}"></span>
        </div>
        <div class="bm-v">
          <span class="bm-num">${b.value}</span>
          <span class="bm-u">${b.unit}</span>
        </div>
        <div class="bm-prev">Previous: ${b.prev} ${b.unit}</div>
        <div class="rng">
          <div class="rng-t">
            <span class="z z-lo" style="width:18%"></span>
            <span class="z z-bl" style="width:14%"></span>
            <span class="z z-op" style="width:36%"></span>
            <span class="z z-bh" style="width:14%"></span>
            <span class="z z-hi" style="width:18%"></span>
            <span class="rng-conn" style="${connStyle}"></span>
            <span class="mk-prev" style="left:${mkPrev}%"></span>
            <span class="mk" style="left:${mk}%"></span>
          </div>
          <div class="rng-m">
            <span>${b.rangeLo}</span>
            <span>${b.optLo}–${b.optHi}</span>
            <span>${b.rangeHi}</span>
          </div>
        </div>
        <div class="bm-f">
          <span class="delta ${deltaClass}">
            <i class="ti ${arrow}"></i>${deltaStr} ${b.unit}
          </span>
          ${makeSparkline(b.history, b.status)}
        </div>
        <div class="bm-more">Click here to learn more <i class="ti ti-arrow-right"></i></div>
      </button>
    `;
  }).join('');
}

function renderChart(b) {
  const w = 480, h = 200, padL = 36, padR = 16, padT = 28, padB = 24;
  const max = Math.max(...b.history, b.optHi * 1.2);
  const min = Math.min(...b.history, b.optLo * 0.8);
  const range = max - min;
  const xStep = (w - padL - padR) / (b.history.length - 1);
  const yFor = v => padT + (1 - (v - min) / range) * (h - padT - padB);
  const points = b.history.map((v, i) => `${padL + i * xStep},${yFor(v)}`).join(' ');
  const lastIdx = b.history.length - 1;
  const optTop = yFor(b.optHi);
  const optBot = yFor(b.optLo);
  const color = b.status === 'opt' ? '#2E7D5A' : b.status === 'bord' ? '#B8761C' : '#B23A3A';
  return `
    <svg viewBox="0 0 ${w} ${h}" style="width:100%; height:auto;" preserveAspectRatio="xMidYMid meet">
      <rect x="${padL}" y="${optTop}" width="${w-padL-padR}" height="${optBot-optTop}" fill="rgba(46,125,90,0.07)"/>
      <text x="${padL+4}" y="${optTop-4}" font-size="9" fill="#2E7D5A" font-family="JetBrains Mono, monospace" font-weight="500">Optimal ${b.optLo}–${b.optHi}</text>
      <line x1="${padL}" y1="${yFor(min)}" x2="${w-padR}" y2="${yFor(min)}" stroke="rgba(26,25,22,0.08)" stroke-width="0.5"/>
      <text x="${padL-6}" y="${optTop+3}" font-size="9" fill="#8A8A8A" font-family="JetBrains Mono, monospace" text-anchor="end">${fmt(b.optHi)}</text>
      <text x="${padL-6}" y="${optBot+3}" font-size="9" fill="#8A8A8A" font-family="JetBrains Mono, monospace" text-anchor="end">${fmt(b.optLo)}</text>
      <polyline points="${points}" fill="none" stroke="#1A1A1A" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
      ${b.history.map((v,i)=>`<circle cx="${padL+i*xStep}" cy="${yFor(v)}" r="${i===lastIdx?4:2.5}" fill="${i===lastIdx?color:'#1A1A1A'}" ${i===lastIdx?'stroke="#FFFFFF" stroke-width="2"':''}/>`).join('')}
      <text x="${padL + lastIdx*xStep}" y="${yFor(b.history[lastIdx])-10}" font-size="11" fill="${color}" font-family="JetBrains Mono, monospace" font-weight="500" text-anchor="end">${b.value}</text>
      ${b.labels.map((l,i)=>i%2===0?`<text x="${padL+i*xStep}" y="${h-6}" font-size="9" fill="#8A8A8A" font-family="Inter, sans-serif" text-anchor="middle">${l}</text>`:'').join('')}
    </svg>
  `;
}

function openDrill(id) {
  const b = biomarkers.find(x => x.id === id);
  if (!b) return;
  const mk = markerPercent(b);
  const delta = b.value - b.prev;
  const good = isGoodDelta(b);
  const deltaStr = (delta > 0 ? '+' : '') + fmt(delta);
  const statusLabel = b.status === 'opt' ? 'Optimal' : b.status === 'bord' ? 'Borderline' : 'Needs attention';
  const catLabel = b.cat.charAt(0).toUpperCase() + b.cat.slice(1);

  const panel = document.getElementById('drillPanel');
  panel.innerHTML = `
    <div class="drill-head">
      <button class="drill-close" id="drillClose" aria-label="Close"><i class="ti ti-x"></i></button>
      <span class="drill-tag">${catLabel} panel</span>
      <h2 class="drill-name">${b.name}</h2>
      <p class="drill-fullname">${b.full}</p>
      <div class="drill-headline">
        <div>
          <span class="drill-headline-num">${b.value}</span>
          <span class="drill-headline-unit">${b.unit}</span>
        </div>
        <div class="drill-status ${b.status}">
          <span class="dot ${b.status}"></span> ${statusLabel}
        </div>
        <div class="delta ${good?'good':'bad'}" style="font-size: 13px;">
          <i class="ti ${delta>0?'ti-arrow-up-right':'ti-arrow-down-right'}"></i>
          ${deltaStr} ${b.unit} vs last quarter
        </div>
      </div>
    </div>
    <div class="drill-body">

      <div class="drill-section">
        <h3 class="drill-section-h">Reference range</h3>
        <div class="drill-range">
          <div class="drill-range-bar">
            <span class="z z-lo" style="width:18%"></span>
            <span class="z z-bl" style="width:14%"></span>
            <span class="z z-op" style="width:36%"></span>
            <span class="z z-bh" style="width:14%"></span>
            <span class="z z-hi" style="width:18%"></span>
            <span class="drill-range-mk" data-val="${b.value}" style="left:${mk}%"></span>
          </div>
          <div class="drill-range-labels">
            <span>${b.rangeLo}</span>
            <span>${b.optLo}</span>
            <span>${b.optHi}</span>
            <span>${b.rangeHi}</span>
          </div>
        </div>
      </div>

      <div class="drill-section">
        <h3 class="drill-section-h">8-quarter trajectory</h3>
        <div class="drill-chart-wrap">${renderChart(b)}</div>
      </div>

      <div class="drill-section">
        <h3 class="drill-section-h">What this measures</h3>
        <p class="drill-prose">${b.what}</p>
      </div>

      <div class="drill-section">
        <h3 class="drill-section-h">What moves it</h3>
        <div class="factor-grid">
          ${b.moves.map(m => `
            <div class="factor">
              <span class="arrow ${m.d}">${m.d === 'up' ? '↑' : '↓'}</span>
              <span>${m.f}</span>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="drill-section">
        <h3 class="drill-section-h">Your plan</h3>
        <ul class="plan-list">
          ${b.plan.map(p => `<li class="plan-item"><i class="ti ti-circle-check"></i><span>${p}</span></li>`).join('')}
        </ul>
      </div>

      <div class="drill-section">
        <h3 class="drill-section-h">Related markers</h3>
        <div class="related-pills">
          ${b.related.map(r => `<span class="related-pill">${r}</span>`).join('')}
        </div>
      </div>

    </div>
  `;

  document.getElementById('drillOverlay').classList.add('open');
  panel.classList.add('open');
  panel.setAttribute('aria-hidden', 'false');

  document.getElementById('drillClose').addEventListener('click', closeDrill);
}

function closeDrill() {
  document.getElementById('drillOverlay').classList.remove('open');
  const panel = document.getElementById('drillPanel');
  panel.classList.remove('open');
  panel.setAttribute('aria-hidden', 'true');
}

// Initial render
renderBiomarkers('all');

// Pill filter
document.querySelectorAll('#pills .pill').forEach(p => {
  p.addEventListener('click', () => {
    document.querySelectorAll('#pills .pill').forEach(x => x.classList.remove('active'));
    p.classList.add('active');
    renderBiomarkers(p.dataset.cat);
  });
});

// Compare toggle
const compareToggle = document.getElementById('compareToggle');
compareToggle.addEventListener('click', () => {
  compareToggle.classList.toggle('on');
  document.body.classList.toggle('compare-mode');
});

// Drill clicks (event delegation)
document.body.addEventListener('click', (e) => {
  const target = e.target.closest('[data-drill]');
  if (target) {
    openDrill(target.dataset.drill);
  }
});

// Overlay close
document.getElementById('drillOverlay').addEventListener('click', closeDrill);

// ESC close
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeDrill();
});
// ---------- PDF Export ----------
function statusLabel(s) { return s === 'opt' ? 'Optimal' : s === 'bord' ? 'Borderline' : 'Attention'; }
function fmtDelta(d) {
  const sign = d > 0 ? '+' : '';
  return sign + (Math.abs(d) < 1 ? d.toFixed(1) : Math.round(d));
}

function renderApoBChart() {
  // 8-quarter ApoB trajectory: 112 → 78
  const data = [112, 102, 95, 88, 82, 78];
  const labels = ['Q4 24','Q1 25','Q2 25','Q3 25','Q4 25','Q1 26'];
  const w = 360, h = 140, padL = 36, padR = 12, padT = 22, padB = 24;
  const max = 130, min = 60;
  const xStep = (w - padL - padR) / (data.length - 1);
  const yFor = v => padT + (1 - (v - min) / (max - min)) * (h - padT - padB);
  const points = data.map((v, i) => `${padL + i * xStep},${yFor(v)}`).join(' ');
  const optTop = yFor(90), optBot = yFor(60);
  return `
    <svg viewBox="0 0 ${w} ${h}" style="width:100%; height:auto; display:block;" preserveAspectRatio="xMidYMid meet">
      <rect x="${padL}" y="${optTop}" width="${w-padL-padR}" height="${optBot-optTop}" fill="rgba(46, 125, 90, 0.08)"/>
      <text x="${padL+4}" y="${optTop-4}" font-size="8" fill="#1F5B41" font-family="JetBrains Mono, monospace" font-weight="500">Optimal &lt;90</text>
      <line x1="${padL}" y1="${yFor(130)}" x2="${w-padR}" y2="${yFor(130)}" stroke="#e0e0dc" stroke-width="0.5"/>
      <line x1="${padL}" y1="${yFor(60)}" x2="${w-padR}" y2="${yFor(60)}" stroke="#e0e0dc" stroke-width="0.75"/>
      <text x="${padL-6}" y="${yFor(130)+3}" font-size="8" fill="#525252" font-family="JetBrains Mono, monospace" text-anchor="end">130</text>
      <text x="${padL-6}" y="${optTop+3}" font-size="8" fill="#525252" font-family="JetBrains Mono, monospace" text-anchor="end">90</text>
      <text x="${padL-6}" y="${optBot+3}" font-size="8" fill="#525252" font-family="JetBrains Mono, monospace" text-anchor="end">60</text>
      <polyline points="${points}" fill="none" stroke="#1a1a1a" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      ${data.map((v,i)=>{
        const last = i === data.length - 1;
        return `<circle cx="${padL+i*xStep}" cy="${yFor(v)}" r="${last?3.5:2}" fill="${last?'#2E7D5A':'#1a1a1a'}" ${last?'stroke="#fff" stroke-width="1.5"':''}/>`;
      }).join('')}
      <text x="${padL + (data.length-1)*xStep - 4}" y="${yFor(data[data.length-1])-9}" font-size="9.5" fill="#1F5B41" font-family="JetBrains Mono, monospace" font-weight="500" text-anchor="end">78</text>
      <text x="${padL}" y="${yFor(data[0])-9}" font-size="8.5" fill="#525252" font-family="JetBrains Mono, monospace" text-anchor="middle">112</text>
      ${labels.map((l,i)=>`<text x="${padL+i*xStep}" y="${h-6}" font-size="8" fill="#525252" font-family="JetBrains Mono, monospace" text-anchor="middle">${l}</text>`).join('')}
    </svg>
  `;
}

function buildReport() {
  const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const reportId = 'BMK-2026-Q1-AC';

  // Direction-of-good lookup for the table delta coloring
  const dirGood = {
    'LDL-C':'down','HDL-C':'up','Triglycerides':'down','HbA1c':'down','Fasting glucose':'down',
    'Fasting insulin':'down','ALT':'down','Testosterone, total':'up','TSH':'flat',
    'hs-CRP':'down','Homocysteine':'down','Vitamin D, 25-OH':'up'
  };

  const tableRows = biomarkers.map(b => {
    const delta = b.value - b.prev;
    const dir = dirGood[b.name];
    const isGood = dir === 'flat' ? Math.abs(delta) < 0.3 : (dir === 'up' ? delta > 0 : delta < 0);
    const arrow = delta > 0 ? '↑' : delta < 0 ? '↓' : '→';
    return `
      <tr>
        <td><strong>${b.name}</strong></td>
        <td class="cat">${b.cat}</td>
        <td class="num">${b.value} <span style="font-family:var(--font-sans); color:#525252; font-weight:400;">${b.unit}</span></td>
        <td class="dim">${b.optLo}–${b.optHi}</td>
        <td><span class="sdot dot-${b.status}"></span><span class="slbl">${statusLabel(b.status)}</span></td>
        <td class="num ${isGood ? 'delta-good' : 'delta-bad'}">${arrow} ${fmtDelta(delta)}</td>
      </tr>
    `;
  }).join('');

  // Brand header reused
  const brandHeader = `
    <div class="rep-h">
      <div class="rep-brand">
        <div>
          <img class="rep-logo" src="assets/img/apex-md-logo.jpg" alt="Apex MD">
          <div class="rep-brand-sub">Longevity & concierge medicine</div>
        </div>
      </div>
      <div class="rep-meta-right">
        <div>Report <strong>${reportId}</strong></div>
        <div>Generated <strong>${today}</strong></div>
      </div>
    </div>
  `;

  return `
    <!-- Page 1 -->
    <div class="pdf-page">
      ${brandHeader}

      <div class="rep-title-block">
        <h1 class="rep-title">Biomarker <em>panel</em></h1>
        <div class="rep-subtitle">Q1 2026 · Quarterly comprehensive panel</div>
      </div>

      <div class="rep-patient">
        <div class="field"><label>Patient</label><span>Alex Chen</span></div>
        <div class="field"><label>Date of birth</label><span class="mono">Mar 14, 1986 · 40 yr</span></div>
        <div class="field"><label>Member ID</label><span class="mono">APX-7834-AC</span></div>
        <div class="field"><label>Plan</label><span>Apex Longevity</span></div>
        <div class="field"><label>Drawn</label><span class="mono">Apr 28, 2026</span></div>
        <div class="field"><label>Lab</label><span>Quest Diagnostics</span></div>
        <div class="field"><label>Location</label><span>San Mateo, CA</span></div>
        <div class="field"><label>Ordering provider</label><span>Maya Patel, MD</span></div>
      </div>

      <div class="rep-section">Summary</div>
      <div class="rep-kpis">
        <div class="rep-kpi">
          <div class="rule"></div>
          <div class="lbl">Biological age</div>
          <div class="val">38.2<span class="unit">yr</span></div>
          <div class="sub">5.8 below chronological</div>
        </div>
        <div class="rep-kpi">
          <div class="rule"></div>
          <div class="lbl">Longevity score</div>
          <div class="val">86<span class="unit">/100</span></div>
          <div class="sub">Top 12% for age band</div>
        </div>
        <div class="rep-kpi">
          <div class="rule bord"></div>
          <div class="lbl">In optimal range</div>
          <div class="val">23<span class="unit">/27</span></div>
          <div class="sub">1 borderline · 1 attention</div>
        </div>
        <div class="rep-kpi">
          <div class="rule"></div>
          <div class="lbl">Improving</div>
          <div class="val">14<span class="unit">markers</span></div>
          <div class="sub">Since Jan 2026</div>
        </div>
      </div>

      <div class="rep-section">Featured marker</div>
      <div class="rep-featured">
        <div>
          <span class="rep-featured-tag"><i class="ti ti-star" style="font-size:9px"></i> Most predictive</span>
          <h3>ApoB</h3>
          <div class="full-name">Apolipoprotein B · Lipids panel</div>
          <div class="feat-val">
            <span class="feat-num">78</span>
            <span class="feat-unit">mg/dL</span>
          </div>
          <div class="feat-status">Optimal · &lt;90 target</div>
          <div class="feat-delta">↓ 10 mg/dL since Q4 25 · 30% below baseline</div>
          <p>ApoB counts every atherogenic particle in your blood — the strongest lipid-panel predictor of cardiovascular events. Each LDL, IDL, and VLDL particle carries one ApoB. Your value sits comfortably below the &lt;90 mg/dL primary-prevention threshold.</p>
        </div>
        <div class="rep-trend-wrap">
          ${renderApoBChart()}
          <div class="rep-trend-cap">8-quarter trajectory · 112 → 78 mg/dL</div>
        </div>
      </div>

      <div class="rep-footer">
        <span>Apex MD · Alex Chen · Q1 2026 biomarker panel</span>
        <span>Page 1 of 2 · Confidential</span>
      </div>
    </div>

    <!-- Page 2 -->
    <div class="pdf-page">
      ${brandHeader}

      <div class="rep-section">Complete panel · ${biomarkers.length} markers</div>
      <table class="rep-table">
        <thead>
          <tr>
            <th>Marker</th>
            <th>Category</th>
            <th>Value</th>
            <th>Optimal range</th>
            <th>Status</th>
            <th>vs Q4 25</th>
          </tr>
        </thead>
        <tbody>${tableRows}</tbody>
      </table>

      <div class="rep-section">Patterns & insights</div>
      <div class="rep-insights">
        <div class="rep-insight good">
          <i class="ti ti-trending-down ic"></i>
          <div class="tx"><strong>Lipid trajectory improving across the board.</strong> ApoB ↓30%, LDL ↓27%, and triglycerides ↓31% since rosuvastatin started in October. Cardiovascular risk profile is the strongest in three years.</div>
        </div>
        <div class="rep-insight alert">
          <i class="ti ti-alert-triangle ic"></i>
          <div class="tx"><strong>ALT trending up across three panels.</strong> Liver enzymes have moved 24 → 32 → 42 U/L. May correlate with increased training load and statin initiation. Worth a hepatic ultrasound and alcohol intake check at the next visit.</div>
        </div>
        <div class="rep-insight info">
          <i class="ti ti-bulb ic"></i>
          <div class="tx"><strong>Pattern noticed.</strong> Fasting insulin and hs-CRP both dropped sharply after the 14-day continuous glucose monitor cycle in February. Repeating that protocol once per quarter could compound the gains.</div>
        </div>
      </div>

      <div class="rep-disclaimer">
        This report is intended for the named patient and their authorized care team. Interpretation should occur in consultation with your Apex MD physician. Not a substitute for clinical judgment. © 2026 Apex Health Enterprises.
      </div>

      <div class="rep-footer">
        <span>Apex MD · Alex Chen · Q1 2026 biomarker panel</span>
        <span>Page 2 of 2 · Confidential</span>
      </div>
    </div>
  `;
}

function openPdfModal() {
  const wrap = document.getElementById('pdfPagesWrap');
  const modal = document.getElementById('pdfModal');
  wrap.innerHTML = buildReport();
  // Update generated-time label
  const meta = document.getElementById('pdfMetaTime');
  if (meta) {
    const t = new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
    meta.textContent = 'Generated ' + t;
  }
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closePdfModal() {
  const modal = document.getElementById('pdfModal');
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

document.getElementById('exportPdfBtn').addEventListener('click', openPdfModal);
document.getElementById('pdfCloseBtn').addEventListener('click', closePdfModal);
document.getElementById('pdfSaveBtn').addEventListener('click', () => window.print());
document.getElementById('pdfPrintBtn').addEventListener('click', () => window.print());

// Close on overlay click (but not when clicking pages)
document.getElementById('pdfModal').addEventListener('click', (e) => {
  if (e.target.id === 'pdfModal' || e.target.id === 'pdfPagesWrap') closePdfModal();
});

// Escape to close
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && document.getElementById('pdfModal').classList.contains('open')) {
    closePdfModal();
  }
});
