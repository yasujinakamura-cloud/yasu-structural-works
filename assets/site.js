// Shared navigation: native anchors retain browser history and scroll restoration.
(() => {
  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const cityFlow = document.querySelector('.city-flow');
  const cityToggle = document.querySelector('.city-motion__toggle');
  if (cityFlow && cityToggle && !cityFlow.hidden) {
    let enabled = true;
    let visible = true;
    const syncCityMotion = () => {
      const reduced = motionPreference.matches;
      cityFlow.classList.toggle('is-paused', !enabled || !visible || document.hidden || reduced);
      cityToggle.hidden = reduced;
      cityToggle.setAttribute('aria-pressed', String(enabled));
      cityToggle.setAttribute('aria-label', enabled ? 'Pause city motion' : 'Play city motion');
      cityToggle.innerHTML = enabled ? 'MOTION ON <span aria-hidden="true">Ⅱ</span>' : 'MOTION OFF <span aria-hidden="true">▶</span>';
    };
    cityToggle.addEventListener('click', () => { enabled = !enabled; syncCityMotion(); });
    motionPreference.addEventListener('change', syncCityMotion);
    document.addEventListener('visibilitychange', syncCityMotion);
    if ('IntersectionObserver' in window) {
      const cityObserver = new IntersectionObserver(entries => {
        visible = entries[0].isIntersecting;
        syncCityMotion();
      });
      cityObserver.observe(cityFlow);
    }
    syncCityMotion();
  }
  const main = document.querySelector('[data-series-viewer]');
  if (!main) return;
  // Film-style fades only for the photo pager; native links retain history.
  const transitionKey = 'portfolio-noir-entry';
  let leaving = false;
  let leaveTimer;
  const frame = main.querySelector('.frame');
  const clearNoir = () => {
    main.classList.remove('noir-enter', 'noir-leave');
    leaving = false;
  };
  try {
    const entry = JSON.parse(sessionStorage.getItem(transitionKey) || 'null');
    sessionStorage.removeItem(transitionKey);
    if (!motionPreference.matches && entry && entry.path === location.pathname && Date.now() - entry.at < 8000) {
      main.classList.add('noir-enter');
      // Reveal starts after decoding so a slow image does not appear abruptly.
      const photo = main.querySelector('[data-series-image]');
      if (photo && typeof photo.decode === 'function') {
        main.classList.add('noir-loading');
        const ready = () => main.classList.remove('noir-loading');
        photo.decode().catch(() => {}).finally(ready);
        window.setTimeout(ready, 1500);
      }
    }
  } catch { /* Storage may be unavailable; normal page navigation still works. */ }
  frame?.addEventListener('animationend', event => {
    if (event.animationName === 'noir-grain') main.classList.remove('noir-enter');
  });
  main.addEventListener('click', event => {
    const link = event.target.closest('[data-series-prev][href], [data-series-next][href]');
    if (!link || event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey || link.target === '_blank' || link.hasAttribute('download') || motionPreference.matches) return;
    const destination = new URL(link.href, location.href);
    if (destination.origin !== location.origin) return;
    event.preventDefault();
    if (leaving) return;
    leaving = true;
    main.classList.remove('noir-enter', 'noir-loading');
    main.classList.add('noir-leave');
    const navigate = () => {
      try { sessionStorage.setItem(transitionKey, JSON.stringify({ path: destination.pathname, at: Date.now() })); } catch {}
      location.assign(destination.href);
    };
    leaveTimer = window.setTimeout(navigate, 550);
  });
  window.addEventListener('pageshow', event => {
    if (event.persisted) {
      clearTimeout(leaveTimer);
      clearNoir();
      main.classList.remove('noir-loading');
    }
  });
  motionPreference.addEventListener('change', event => {
    if (event.matches) main.classList.remove('noir-enter', 'noir-loading');
  });
  document.addEventListener('keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || /INPUT|TEXTAREA|SELECT/.test(event.target.tagName) || event.target.isContentEditable) return;
    const direction = event.key === 'ArrowRight' ? 'next' : event.key === 'ArrowLeft' ? 'prev' : null;
    if (direction) {
      const link = main.querySelector(`[data-series-${direction}][href]`);
      if (link) { event.preventDefault(); link.click(); }
    }
    if (event.key === 'Escape') location.href = `/series/${main.dataset.series}/intro.html`;
  });
})();
