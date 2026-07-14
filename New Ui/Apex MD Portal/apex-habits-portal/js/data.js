/* Apex MD — Habits data layer.
   Load order: icons.js -> data.js -> render.js -> app.js
   Canonical source mirrored in /data/habits.json. Edit there + run tools/build.mjs,
   or edit here directly for quick changes. Renderers consume these arrays. */

/* Sidebar navigation */
var NAV_MD = [
  ['Dashboard','home'],['Health Analysis','pulse'],['My Cases','link'],['Chat','chat'],
  ['Biomarkers','flask'],['Genetics','genetics'],['Progress','trend'],['Lab Kits','vial'],
  ['Wearables','watch'],['Documents','folder'],['My Treatments','link'],
  ['Shop','bag'],['Profile','user']
];
var NAV_FIT = [
  ['Program','clipboard'],['Nutrition','apple'],
  ['Habits','listdots',true],['Trainer Messages','chat2']
];

/* Per-habit theme palette (accent, gradient, tints) */
var THEME = {
  blue:{c:'#2563EB',c2:'#3b82f6',tint:'rgba(37,99,235,.07)',badge:'rgba(37,99,235,.11)',sbg:'rgba(37,99,235,.045)'},
  slate:{c:'#475569',c2:'#64748b',tint:'rgba(71,85,105,.06)',badge:'rgba(71,85,105,.10)',sbg:'rgba(71,85,105,.045)'},
  purple:{c:'#7C3AED',c2:'#9061f0',tint:'rgba(124,58,237,.07)',badge:'rgba(124,58,237,.11)',sbg:'rgba(124,58,237,.045)'},
  red:{c:'#D30603',c2:'#ef2a27',tint:'rgba(211,6,3,.06)',badge:'rgba(211,6,3,.10)',sbg:'rgba(211,6,3,.04)'}
};

/* Today's check-ins */
var CHECKINS = [
  {name:'Drink 8 glass of water',icon:'droplet',theme:'blue',cur:0,longest:0,id:'1136767401',date:'2026-06-30'},
  {name:'Drink milk every day',icon:'milk',theme:'slate',cur:0,longest:3,id:'1136712796',date:'2026-06-30'},
  {name:'Eat yougurt every day',icon:'bowl',theme:'purple',cur:0,longest:3,id:'1142022763',date:'2026-06-30'},
  {name:'RUN - !0K',icon:'run',theme:'red',cur:0,longest:3,id:'1136766398',date:'2026-06-30'}
];

/* Active habit series ("Your habits") */
var YOURS = [
  {name:'Drink milk every day',icon:'milk',theme:'slate',range:'Jun 3 \u2192 Jun 30',cur:0,longest:3,done:3,total:19,pct:16,days:['Mon','Tue','Wed','Thu','Fri']},
  {name:'Eat yougurt every day',icon:'bowl',theme:'purple',range:'Jun 3 \u2192 Jun 30',cur:0,longest:3,done:3,total:20,pct:15,days:['Mon','Tue','Wed','Thu','Fri']},
  {name:'RUN - !0K',icon:'run',theme:'red',range:'Jun 3 \u2192 Jun 30',cur:0,longest:3,done:3,total:20,pct:15,days:['Mon','Tue','Wed','Thu','Fri']},
  {name:'Drink 8 glass of water',icon:'droplet',theme:'blue',range:'Jun 24 \u2192 Jul 21',cur:0,longest:0,done:0,total:12,pct:0,days:['Mon','Tue','Wed']}
];
