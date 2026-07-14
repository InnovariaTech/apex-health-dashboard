/* Apex MD — app bootstrap + interactions. Load LAST. */

function initHabits(){
  renderNav(document.getElementById('navMD'), NAV_MD);
  renderNav(document.getElementById('navFit'), NAV_FIT);
  renderCheckins();
  renderYours();
}

function toggleDone(btn,i){
  var card=btn.closest('.card');
  var done=btn.classList.toggle('done');
  var label=btn.querySelector('span');
  var curBox=card.querySelector('.streak.cur');
  var curVal=curBox.querySelector('.sv');
  if(done){
    label.textContent='Checked in today';
    CHECKINS[i].cur=(CHECKINS[i].longest>0?CHECKINS[i].longest+1:1);
    curVal.textContent=CHECKINS[i].cur+'d';curBox.classList.remove('zero');
  }else{
    label.textContent='Mark today complete';
    CHECKINS[i].cur=0;curVal.textContent='0d';curBox.classList.add('zero');
  }
  var n=document.querySelectorAll('.btn-complete.done').length;
  document.getElementById('todayCount').innerHTML=n+' <small>/ 4</small>';
}

if(document.readyState!=='loading') initHabits();
else document.addEventListener('DOMContentLoaded', initHabits);
