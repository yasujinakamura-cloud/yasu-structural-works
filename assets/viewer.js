(function(){
  const el = document.querySelector('[data-viewer]');
  if(!el) return;

  const series = el.getAttribute('data-series');
  const idx = Number(el.getAttribute('data-index'));
  const max = Number(el.getAttribute('data-max'));
  const img = document.getElementById('vImg');

  const prevBtn = document.getElementById('btnPrev');
  const nextBtn = document.getElementById('btnNext');
  const backBtn = document.getElementById('btnBack');

  const leftZone = document.getElementById('zoneLeft');
  const rightZone = document.getElementById('zoneRight');

  function pad3(n){ return String(n).padStart(3,'0'); }
  function pad2(n){ return String(n).padStart(2,'0'); }

  function pageUrl(n){
    return `/series/${series}/${pad2(n)}/`;
  }

  function imgUrl(n){
    return `/series/${series}/images/${pad3(n)}.jpg`;
  }

  function setDisabled(btn, disabled){
    if(!btn) return;
    btn.classList.toggle('disabled', !!disabled);
    btn.setAttribute('aria-disabled', disabled ? 'true' : 'false');
  }

  if(img){
    img.src = imgUrl(idx);
    img.alt = `${series.toUpperCase()} ${pad3(idx)}`;
  }

  const atStart = idx <= 1;
  const atEnd = idx >= max;

  setDisabled(prevBtn, atStart);
  setDisabled(nextBtn, atEnd);

  function go(n){
    if(n < 1 || n > max) return;
    location.href = pageUrl(n);
  }

  prevBtn && prevBtn.addEventListener('click', () => go(idx - 1));
  nextBtn && nextBtn.addEventListener('click', () => go(idx + 1));
  backBtn && backBtn.addEventListener('click', () => location.href = `/series/${series}/intro/`);

  leftZone && leftZone.addEventListener('click', () => go(idx - 1));
  rightZone && rightZone.addEventListener('click', () => go(idx + 1));

  window.addEventListener('keydown', (e) => {
    if(e.key === 'ArrowLeft'){ e.preventDefault(); go(idx - 1); }
    if(e.key === 'ArrowRight'){ e.preventDefault(); go(idx + 1); }
    if(e.key === 'Escape'){ e.preventDefault(); location.href = `/series/${series}/intro/`; }
  });

  if(!atEnd){
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = imgUrl(idx + 1);
    document.head.appendChild(link);
  }
})();