// Animate gauge + bars on load
  window.addEventListener('load',()=>{
    const arc=document.querySelector('.arc');
    if(arc){const c=515.2; requestAnimationFrame(()=>arc.style.strokeDashoffset=(c*(1-0.89)).toFixed(1));
      arc.style.transition='stroke-dashoffset 1.3s cubic-bezier(.22,1,.36,1)';}
    document.querySelectorAll('.bar i').forEach(b=>{
      const w=b.getAttribute('data-w'); requestAnimationFrame(()=>b.style.width=w+'%');
    });
  });

  // Before/after compare slider
  const slider=document.getElementById('slider');
  const after=document.getElementById('afterLayer');
  const handle=document.getElementById('handle');
  if(slider){
    const upd=v=>{after.style.clipPath=`inset(0 0 0 ${v}%)`;handle.style.left=v+'%';};
    slider.addEventListener('input',e=>upd(e.target.value));
    upd(50);
  }
  // Mobile sidebar drawer
  const sb=document.getElementById('sidebar'),ov=document.getElementById('overlay'),hb=document.getElementById('hamburger');
  const closeSb=()=>{sb.classList.remove('open');ov.classList.remove('show');};
  if(hb){hb.addEventListener('click',()=>{sb.classList.add('open');ov.classList.add('show');});
    ov.addEventListener('click',closeSb);
    sb.querySelectorAll('.nav a').forEach(a=>a.addEventListener('click',closeSb));}