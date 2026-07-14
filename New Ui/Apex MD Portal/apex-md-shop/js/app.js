/* Apex MD Shop — icons, SVG helpers, tab config, card renderer, and init.
   Requires photos.js + products.js loaded first. */
/* ---------------- Icons ---------------- */
const CAL = '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/></svg>';
const EXT = '<svg viewBox="0 0 24 24"><path d="M14 4h6v6"/><path d="M20 4l-9 9"/><path d="M18 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h5"/></svg>';
const ARROW = '<svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
const I = {
  medical:'<svg viewBox="0 0 24 24"><rect x="8.3" y="2.5" width="7.4" height="3.4" rx="1.3"/><path d="M9.3 5.9v1.3l-1.1 1.1A2 2 0 0 0 7.6 9.7V19a2 2 0 0 0 2 2h4.8a2 2 0 0 0 2-2V9.7a2 2 0 0 0-.6-1.4l-1.1-1.1V5.9"/><path d="M12 12.3v4M10 14.3h4"/></svg>',
  supplements:'<svg viewBox="0 0 24 24"><path d="M10.5 20.5a6 6 0 0 1-8.5-8.5l7-7a6 6 0 0 1 8.5 8.5z"/><path d="M8.5 8.5l7 7"/></svg>',
  memberships:'<svg viewBox="0 0 24 24"><circle cx="12" cy="6" r="3.3"/><path d="M5 21v-1a7 7 0 0 1 14 0v1"/><path d="M9.2 12.4v2.1a2.8 2.8 0 0 0 5.6 0v-1"/><circle cx="16.8" cy="14" r="1.4"/></svg>',
  programs:'<svg viewBox="0 0 24 24"><path d="M4 19h12.5a1.5 1.5 0 0 0 1.5-1.5V7.5a2.5 2.5 0 0 0-5 0V10a4.5 4.5 0 0 1-4.5 4.5H4Z"/><path d="M4 14.5c0-3 2-5.5 5-5.5"/><path d="M13.5 7.5v-2M16 7.5v-2"/></svg>',
  training:'<svg viewBox="0 0 24 24"><path d="M4 9v6M7 7v10M17 7v10M20 9v6M7 12h10"/></svg>'
};
const PLAN_ICON = {
  memberships:'<svg viewBox="0 0 24 24"><circle cx="12" cy="6" r="3.3"/><path d="M5 21v-1a7 7 0 0 1 14 0v1"/><path d="M9.2 12.4v2.1a2.8 2.8 0 0 0 5.6 0v-1"/><circle cx="16.8" cy="14" r="1.4"/></svg>',
  programs:'<svg viewBox="0 0 24 24"><path d="M4 19h12.5a1.5 1.5 0 0 0 1.5-1.5V7.5a2.5 2.5 0 0 0-5 0V10a4.5 4.5 0 0 1-4.5 4.5H4Z"/><path d="M4 14.5c0-3 2-5.5 5-5.5"/><path d="M13.5 7.5v-2M16 7.5v-2"/></svg>',
  training:'<svg viewBox="0 0 24 24"><path d="M4 9v6M7 7v10M17 7v10M20 9v6M7 12h10"/></svg>'
};

/* ---------------- Product imagery (SVG, self-contained) ---------------- */
const MARK = (cx,y,scale=1)=>{
  const p=`M${cx-9} ${y} L${cx-4} ${y-7} L${cx-1} ${y-3} L${cx+2} ${y-8} L${cx+5} ${y-3} L${cx+8} ${y-7} L${cx+13} ${y} Z`;
  return `<path d="${p}" fill="#D30603"/>`;
};
function labelBlock(cx, topY, kind, name){
  const fs = name.length>13 ? 5 : name.length>10 ? 6 : 7;
  return `
    ${MARK(cx, topY+10)}
    <text x="${cx}" y="${topY+20}" text-anchor="middle" font-family="Inter,sans-serif" font-size="7" font-weight="800" fill="#16181c" letter-spacing="0.4">APEX MD</text>
    <line x1="${cx-15}" y1="${topY+25}" x2="${cx+15}" y2="${topY+25}" stroke="#D30603" stroke-width="1"/>
    <text x="${cx}" y="${topY+33}" text-anchor="middle" font-family="Inter,sans-serif" font-size="4.4" fill="#9aa0ab" letter-spacing="0.6">${kind}</text>
    <text x="${cx}" y="${topY+43}" text-anchor="middle" font-family="Inter,sans-serif" font-size="${fs}" font-weight="700" fill="#16181c">${name}</text>`;
}
function vialSVG(name, kind){
  return `<svg class="prod-svg" viewBox="0 0 110 180" xmlns="http://www.w3.org/2000/svg" aria-label="${name}">
    <ellipse cx="55" cy="170" rx="26" ry="5" fill="#000" opacity="0.07"/>
    <rect x="38" y="10" width="34" height="19" rx="4" fill="#C0241E"/>
    <rect x="38" y="10" width="34" height="7" rx="4" fill="#DA453F"/>
    <rect x="36" y="28" width="38" height="11" rx="2" fill="#C7CBD1"/>
    <rect x="36" y="28" width="38" height="4" fill="#E2E5E9"/>
    <rect x="42" y="38" width="26" height="8" fill="#E7EEF2"/>
    <path d="M30 46 H80 V150 a12 12 0 0 1 -12 12 H42 a12 12 0 0 1 -12 -12 Z" fill="#E9F1F6"/>
    <path d="M30 122 H80 V150 a12 12 0 0 1 -12 12 H42 a12 12 0 0 1 -12 -12 Z" fill="#D6E5EE"/>
    <rect x="34" y="50" width="6" height="106" rx="3" fill="#ffffff" opacity="0.65"/>
    <rect x="71" y="50" width="7" height="106" rx="3" fill="#C0D2DC" opacity="0.6"/>
    <rect x="27" y="84" width="56" height="58" rx="3" fill="#ffffff" stroke="#E4E4E4"/>
    ${labelBlock(55, 90, kind, name)}
  </svg>`;
}
function bottleSVG(name, kind){
  return `<svg class="prod-svg" viewBox="0 0 110 180" xmlns="http://www.w3.org/2000/svg" aria-label="${name}">
    <ellipse cx="55" cy="170" rx="28" ry="5" fill="#000" opacity="0.07"/>
    <rect x="38" y="12" width="34" height="15" rx="3" fill="#C0241E"/>
    <rect x="38" y="12" width="34" height="5" rx="3" fill="#DA453F"/>
    <rect x="44" y="26" width="22" height="9" fill="#ECECE9"/>
    <path d="M30 35 H80 V152 a8 8 0 0 1 -8 8 H38 a8 8 0 0 1 -8 -8 Z" fill="#F4F4F1" stroke="#E2E2DE"/>
    <rect x="34" y="40" width="6" height="116" rx="3" fill="#ffffff" opacity="0.7"/>
    <rect x="27" y="70" width="56" height="76" rx="3" fill="#ffffff" stroke="#E6E6E2"/>
    ${labelBlock(55, 80, kind, name)}
  </svg>`;
}
function kitSVG(name){
  return `<svg class="prod-svg" viewBox="0 0 130 180" xmlns="http://www.w3.org/2000/svg" aria-label="${name}">
    <ellipse cx="65" cy="168" rx="40" ry="5" fill="#000" opacity="0.07"/>
    <rect x="22" y="46" width="86" height="116" rx="8" fill="#ffffff" stroke="#E2E2DE"/>
    <rect x="22" y="46" width="86" height="34" rx="8" fill="#D30603"/>
    <rect x="22" y="70" width="86" height="10" fill="#D30603"/>
    <path d="M${65-9} 66 L${65-4} 59 L${65-1} 63 L${65+2} 58 L${65+5} 63 L${65+8} 59 L${65+13} 66 Z" fill="#fff"/>
    <text x="65" y="78" text-anchor="middle" font-family="Inter,sans-serif" font-size="9" font-weight="800" fill="#ffffff" letter-spacing="0.5">APEX MD</text>
    <text x="65" y="100" text-anchor="middle" font-family="Inter,sans-serif" font-size="5.5" fill="#9aa0ab" letter-spacing="1">AT-HOME LAB KIT</text>
    <line x1="40" y1="108" x2="90" y2="108" stroke="#E2E2DE" stroke-width="1"/>
    <text x="65" y="128" text-anchor="middle" font-family="Inter,sans-serif" font-size="${name.length>18?7:8.5}" font-weight="700" fill="#16181c">${name}</text>
    <rect x="40" y="140" width="50" height="8" rx="4" fill="#F1F1EE"/>
  </svg>`;
}

/* ---------------- Catalog data ---------------- */

const TABS = [
  {id:'medical',label:'Medical',icon:I.medical,
    pills:[
      {label:'All',sec:'weight-loss'},
      {label:'Weight Loss',sec:'weight-loss'},
      {label:'Peptide Blends',sec:'peptide-blends'},
      {label:'TRT',sec:'trt'},
      {label:'HRT',sec:'hrt'},
      {label:'Peptides',sec:'peptides'},
      {label:'Lab Diagnostics',sec:'lab'}
    ],
    sections:[
      {id:'weight-loss',accent:'red',badge:'GLP-1 Medications',title:'Weight Loss',sub:'Clinically-supervised GLP-1 weight loss programs. Start with a quick quiz to find your best fit.',action:'Take the quiz',products:wl},
      {id:'peptide-blends',accent:'grey',badge:'Combination Therapies',title:'Peptide Blends',sub:'Physician-formulated multi-peptide blends for recovery, performance, and regeneration.',products:peptideBlends},
      {id:'trt',accent:'black',badge:'Hormone Optimization',title:'TRT - $199/month',sub:'<strong style="color:var(--ink)">All Testosterone enhancement programs start with labs and an Apex MD physician consult</strong> where the type of testosterone will be selected by the physician to best fit your needs and goals. <strong style="color:var(--ink)">Quarterly labs, medication and physician consults are included in the $199/month charge.</strong>',products:trt},
      {id:'hrt',accent:'pink',badge:'Hormone Balance',title:'Women’s HRT - $249/month',sub:'<strong style="color:var(--ink)">All women’s Hormone enhancement programs start with labs and an Apex MD physician consult</strong> where the type of hormone therapy will be selected by the physician to best fit your needs and goals. <strong style="color:var(--ink)">Quarterly labs, medication and physician consults are included in the $249/month charge.</strong>',products:hrt},
      {id:'peptides',accent:'grey',badge:'Targeted Peptides',title:'Peptides',sub:'Targeted peptide therapies for recovery, performance, and wellness.',products:peptides},
      {id:'lab',accent:'red',badge:'At-Home Diagnostics',title:'Lab Diagnostics',sub:'Physician-reviewed at-home lab kits — collect at home, we handle the rest.',products:labdx}
    ]},
  {id:'supplements',label:'Supplements',icon:I.supplements,
    sections:[{id:'supps',accent:'green',badge:'Daily Performance',title:'Supplements',sub:'Pharmaceutical-grade supplements, formulated and reviewed by Apex MD physicians.',products:supplements}]},
  {id:'memberships',label:'Concierge Program',icon:I.memberships,planIcon:'memberships',
    sections:[{id:'mem',accent:'red',badge:'Concierge Care',title:'Concierge Program',sub:'Personalized longevity care — 100+ biomarkers and a physician-guided protocol built to expand your healthspan.',products:memberships}]},
  {id:'programs',label:'Fitness Programs',icon:I.programs,planIcon:'programs',
    sections:[{id:'prog',accent:'purple',badge:'Bundled Clinical Programs',title:'Fitness Programs',sub:'All-in-one programs that bundle medication, labs, coaching, and follow-up care.',products:programs}]},
  {id:'training',label:'Training',icon:I.training,planIcon:'training',
    sections:[{id:'train',accent:'orange',badge:'Apex Fit Personal Training',title:'Training',sub:'Remote personal training and nutrition coaching from the Apex Fit team.',products:training}]}
];

const ACC = {blue:'var(--blue)',purple:'var(--purple)',teal:'var(--teal)',pink:'var(--pink)',orange:'var(--orange)',green:'var(--green)',red:'var(--accent)',grey:'#6b7280',black:'var(--black)'};

/* ---------------- Render ---------------- */
function card(p, planIconKey){
  if(p.type==='intro'){
    return `<article class="card intro-card">
    <div class="prod-img prod-img--photo"><img class="prod-fill fill-cover" src="${p.img}" alt=""></div>
    <div class="card-body">
      <h4 class="intro-title">${p.lead}<br><span class="intro-accent">${p.lead2}</span></h4>
      <span class="intro-rule"></span>
      <p class="pdesc">${p.desc}</p>
      <div class="card-foot"><button class="cta-btn intro-btn">${p.cta} ${ARROW}</button></div>
    </div>
  </article>`;
  }
  let img, imgCls='prod-img', imgStyle='';
  if(p.img){ const poster=p.fit==='poster'; img = `<img class="prod-fill${p.fit==='cover'?' fill-cover':''}${poster?' fill-poster':''}" src="${p.img}" alt="${p.name}">`; imgCls='prod-img prod-img--photo'+(poster?' prod-img--poster':''); imgStyle=` style="background:${p.tile||'#ececea'}"`; }
  else if(p.type==='vial') img = vialSVG(p.name, p.kind||'');
  else if(p.type==='bottle') img = bottleSVG(p.name, p.kind||'');
  else if(p.type==='kit') img = kitSVG(p.name);
  else img = `<div class="plan-mark" style="background:${ACC[planIcon_accent]}">${PLAN_ICON[planIconKey]||PLAN_ICON.programs}</div>`;
  const badge = p.badge ? `<span class="pbadge pbadge--${p.badge.color}">${p.badge.text}</span>` : '';
  const per = p.per ? `<span class="per">${p.per}</span>` : '';
  const tag = p.clickable ? 'a' : 'article';
  const linkAttr = p.clickable ? ' href="#" onclick="return false" role="button"' : '';
  return `<${tag} class="card${p.clickable?' card-clickable':''}${p.soon?' is-soon':''}"${linkAttr}>
    <div class="${imgCls}"${imgStyle}>${img}</div>
    <div class="card-body">
      <div class="card-top"><h4 class="pname">${p.name}${p.topPrice ? ` - ${p.topPrice}` : ''}</h4>${badge}</div>${p.topNote ? `<div style="font-weight:500;font-size:12px;color:var(--ink-3);letter-spacing:0;margin-top:2px">${p.topNote}</div>` : ''}
      <p class="pdesc">${p.desc}</p>
      ${p.features ? `<button class="readmore-btn" aria-expanded="false" onclick="toggleReadMore(this)"><span class="rm-label">See Details</span><svg class="rm-chev" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg></button><div class="readmore-wrap"><div style="margin:2px 0 4px;">${p.features.map(f=>`<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;padding:9px 0;border-top:1px solid #ececec;"><div><div style="font-weight:700;color:var(--ink);font-size:13px;line-height:1.3;">${f.name}</div><div style="color:var(--ink-2);font-size:12px;line-height:1.35;margin-top:3px;">${f.desc}</div></div><span style="color:${f.inc===false?'var(--ink-3)':'var(--ink)'};font-weight:700;font-size:14px;line-height:1.3;flex:none;">${f.inc===false?'—':'✓'}</span></div>`).join('')}</div></div>` : ''}
      ${p.soon ? `<div class="card-foot soon"><span class="soon-date">${CAL} ${p.soon}</span></div>` : p.cta ? `<div class="card-foot"><button class="cta-btn">${p.cta}</button></div>` : `<div class="card-foot"><div class="price">${p.price}${per}</div><span class="shop-link">Shop ${EXT}</span></div>`}
    </div>
  </${tag}>`;
}
function toggleReadMore(btn){
  const wrap = btn.nextElementSibling;
  const open = !wrap.classList.contains('open');
  wrap.classList.toggle('open', open);
  btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  btn.querySelector('.rm-label').textContent = open ? 'Hide Details' : 'See Details';
  wrap.style.maxHeight = open ? (wrap.scrollHeight + 'px') : '0px';
}
let planIcon_accent='red';
function section(s, planIconKey){
  planIcon_accent = s.accent;
  const acc = ACC[s.accent];
  const action = s.action ? `<button class="quiz-btn">${s.action} ${EXT}</button>` : '';
  return `<section class="cat" id="sec-${s.id}" style="--acc:${acc}">
    <div class="cat-bar"></div>
    <div class="cat-head">
      <div>
        <span class="cat-badge" style="background:${acc}">${s.badge}</span>
        <h2 class="cat-title">${s.title}</h2>
        <p class="cat-sub">${s.sub}</p>
      </div>
      ${action}
    </div>
    <div class="grid">${s.products.map(p=>card(p, planIconKey)).join('')}</div>
  </section>`;
}

const tabsEl = document.getElementById('tabs');
const panelsEl = document.getElementById('panels');

tabsEl.innerHTML = TABS.map((t,i)=>`<button class="tab${i===0?' active':''}" data-tab="${t.id}">${t.icon}${t.label}</button>`).join('');

panelsEl.innerHTML = TABS.map((t,i)=>{
  const pills = t.pills ? `<div class="pills" data-pills="${t.id}">${t.pills.map((p,j)=>`<button class="pill${j===0?' active':''}" data-sec="sec-${p.sec}">${p.label}</button>`).join('')}</div>` : '';
  const secs = t.sections.map(s=>section(s, t.planIcon)).join('');
  return `<div class="panel${i===0?' active':''}" data-panel="${t.id}">${pills}${secs}</div>`;
}).join('');

/* Tab switching */
tabsEl.querySelectorAll('.tab').forEach(btn=>{
  btn.addEventListener('click',()=>{
    tabsEl.querySelectorAll('.tab').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    const id = btn.dataset.tab;
    panelsEl.querySelectorAll('.panel').forEach(p=>p.classList.toggle('active', p.dataset.panel===id));
    window.scrollTo({top:0,behavior:'smooth'});
  });
});

/* Filter pills -> smooth scroll + active state */
panelsEl.querySelectorAll('.pill').forEach(pill=>{
  pill.addEventListener('click',()=>{
    pill.parentElement.querySelectorAll('.pill').forEach(p=>p.classList.remove('active'));
    pill.classList.add('active');
    const el = document.getElementById(pill.dataset.sec);
    if(el){ const y = el.getBoundingClientRect().top + window.scrollY - 84; window.scrollTo({top:y,behavior:'smooth'}); }
  });
});

/* Scroll-spy for medical pills */
const medPills = panelsEl.querySelector('[data-pills="medical"]');
if(medPills){
  const map = {};
  medPills.querySelectorAll('.pill').forEach(p=>{ map[p.dataset.sec]=p; });
  const obs = new IntersectionObserver(entries=>{
    entries.forEach(e=>{
      if(e.isIntersecting && map[e.target.id]){
        medPills.querySelectorAll('.pill').forEach(p=>p.classList.remove('active'));
        map[e.target.id].classList.add('active');
      }
    });
  },{rootMargin:'-90px 0px -70% 0px',threshold:0});
  Object.keys(map).forEach(id=>{ const el=document.getElementById(id); if(el) obs.observe(el); });
}
