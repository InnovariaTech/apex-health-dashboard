/* Apex MD — renderers. Pure view layer; consumes globals from data.js.
   Defines render functions but does not run them (app.js drives init). */

/* helpers */
function cssVars(t){return '--c:'+t.c+';--c2:'+t.c2+';--tint:'+t.tint+';';}
var FLAME='<svg viewBox="0 0 24 24" style="stroke:'+'currentColor'+'"><path d="M12 3c2 3 0 5-1 6.5C9.8 11 9 12.5 9 14a3 3 0 0 0 6 0c0-1-.5-2.4-1-3 .8 1 1 2 1 3a4 4 0 0 1-8 0c0-2.6 1.8-4 3-6 .6-1 1.2-2.5 2-5z"/></svg>';
var TROPHY='<svg viewBox="0 0 24 24"><path d="M8 20h8M12 16v4M7 4h10v6a5 5 0 0 1-10 0z"/><path d="M7 7H5.2A1.2 1.2 0 0 1 4 5.8v0A1.2 1.2 0 0 1 5.2 4.6H7M17 7h1.8A1.2 1.2 0 0 0 20 5.8v0A1.2 1.2 0 0 0 18.8 4.6H17"/></svg>';

function renderNav(el,items){
  el.innerHTML = items.map(function(it){
    return '<a href="#"'+(it[2]?' class="active"':'')+'>'+icon(it[1])+'<span>'+it[0]+'</span></a>';
  }).join('');
}

function renderCheckins(){
  document.getElementById('checkins').innerHTML = CHECKINS.map(function(h,i){
    var t=THEME[h.theme];
    return '<div class="card" style="'+cssVars(t)+'--badge:'+t.badge+';--sbg:'+t.sbg+'" data-i="'+i+'">'
      +'<div class="card-top">'
        +'<div class="h-badge" style="background:'+t.badge+'"><svg viewBox="0 0 24 24" style="stroke:'+t.c+'">'+ICONS[h.icon]+'</svg></div>'
        +'<div class="card-titles"><h3>'+h.name+'</h3><div class="ctype">Custom habit</div></div>'
        +'<span class="status scheduled"><span class="dot"></span>Scheduled</span>'
      +'</div>'
      +'<div class="streaks">'
        +'<div class="streak cur'+(h.cur===0?' zero':'')+'" style="--sbg:'+t.sbg+'"><div class="sl" style="color:'+t.c+'">'+FLAME+'Current streak</div><div class="sv">'+h.cur+'d</div></div>'
        +'<div class="streak" style="--sbg:'+t.sbg+'"><div class="sl">'+TROPHY+'Longest</div><div class="sv" style="color:var(--ink)">'+h.longest+'d</div></div>'
      +'</div>'
      +'<div class="cta-row">'
        +'<button class="btn-complete" onclick="toggleDone(this,'+i+')"><svg viewBox="0 0 24 24"><path d="M5 12l5 5 9-11"/></svg><span>Mark today complete</span></button>'
        +'<button class="btn-trash" aria-label="Remove"><svg viewBox="0 0 24 24"><path d="M5 7h14M10 4h4M9 7v11M15 7v11M6 7l1 13h10l1-13"/></svg></button>'
      +'</div>'
      +'<div class="card-meta"><span><b>dailyItemId</b> '+h.id+'</span><span>\u00B7</span><span>'+h.date+'</span></div>'
    +'</div>';
  }).join('');
}

function renderYours(){
  document.getElementById('yourHabits').innerHTML = YOURS.map(function(h){
    var t=THEME[h.theme];
    var days = h.days.map(function(d){return '<span class="day">'+d+'</span>';}).join('');
    return '<div class="card" style="'+cssVars(t)+'--badge:'+t.badge+';--sbg:'+t.sbg+'">'
      +'<div class="card-top">'
        +'<div class="h-badge" style="background:'+t.badge+'"><svg viewBox="0 0 24 24" style="stroke:'+t.c+'">'+ICONS[h.icon]+'</svg></div>'
        +'<div class="card-titles"><h3>'+h.name+'</h3><div class="ctype">Custom habit</div></div>'
        +'<span class="range-pill">'+h.range+'</span>'
      +'</div>'
      +'<div class="streaks">'
        +'<div class="streak cur'+(h.cur===0?' zero':'')+'" style="--sbg:'+t.sbg+'"><div class="sl" style="color:'+t.c+'">'+FLAME+'Current streak</div><div class="sv">'+h.cur+'d</div></div>'
        +'<div class="streak" style="--sbg:'+t.sbg+'"><div class="sl">'+TROPHY+'Longest</div><div class="sv" style="color:var(--ink)">'+h.longest+'d</div></div>'
      +'</div>'
      +'<div class="prog-line"><div class="pdone">'+h.done+' <span>/ '+h.total+' completed</span></div><div class="ppct">'+h.pct+'%</div></div>'
      +'<div class="bar"><i style="width:'+Math.max(h.pct,2)+'%"></i></div>'
      +'<div class="days">'+days+'</div>'
      +'<div class="hint"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></svg><span>Check in from the &ldquo;Today&#39;s check-ins&rdquo; section above &mdash; series IDs can&#39;t be tracked directly.</span></div>'
    +'</div>';
  }).join('');
}
