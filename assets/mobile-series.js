(function () {
  const FEED = document.getElementById("mFeed");
  const infoBtn = document.querySelector(".m-info");
  const head = document.querySelector(".m-head");
  const title = document.querySelector(".m-title");
  const btnUp = document.querySelector('[data-nav="up"]');
  const btnDown = document.querySelector('[data-nav="down"]');

  if (!FEED || !btnUp || !btnDown) return;

  const series = document.body.dataset.series || "structure";
  const jsonUrl = new URL(`${series}.json`, window.location.href).href;
  const imgDir = new URL("images/", window.location.href).href;

  function setHeadVars() {
    const h = head ? head.getBoundingClientRect().height : 0;
    const th = title ? title.getBoundingClientRect().height : 0;
    document.documentElement.style.setProperty("--mhead-h", h + "px");
    document.documentElement.style.setProperty("--mtitle-h", th + "px");
  }

  let showInfo = false;

  function applyInfoState() {
    document.documentElement.classList.toggle("show-info", showInfo);
    if (infoBtn) infoBtn.setAttribute("aria-pressed", String(showInfo));
  }

  if (infoBtn) {
    infoBtn.addEventListener("click", () => {
      showInfo = !showInfo;
      applyInfoState();
    });
  }
  applyInfoState();

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  function getCurrentIndex(total) {
    const h = FEED.clientHeight || 1;
    return clamp(Math.round(FEED.scrollTop / h), 0, total - 1);
  }

  function setBtnState(i, total) {
    const upDisabled = i <= 0;
    const downDisabled = i >= total - 1;
    btnUp.disabled = upDisabled;
    btnDown.disabled = downDisabled;
    btnUp.style.opacity = upDisabled ? "0.35" : "1";
    btnDown.style.opacity = downDisabled ? "0.35" : "1";
  }

  function goToIndex(i, total) {
    const h = FEED.clientHeight || 1;
    const next = clamp(i, 0, total - 1);
    const cur = getCurrentIndex(total);
    if (next === cur) return;
    FEED.scrollTo({ top: next * h, behavior: "smooth" });
    setBtnState(next, total);
  }

  function escapeHtml(s) {
    return String(s ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  setHeadVars();
  window.addEventListener("resize", setHeadVars, { passive: true });
  window.addEventListener("orientationchange", setHeadVars, { passive: true });

  fetch(jsonUrl, { cache: "no-store" })
    .then((res) => {
      if (!res.ok) throw new Error(`JSON load failed: ${res.status} | ${jsonUrl}`);
      return res.json();
    })
    .then((data) => {
      const images = Array.isArray(data.images) ? data.images : [];
      if (!images.length) throw new Error(`No images in JSON | ${jsonUrl}`);

      FEED.innerHTML = images
        .map((it, idx) => {
          const n = String(idx + 1).padStart(2, "0");
          const stmt = escapeHtml(it.statement || "");
          const cam = escapeHtml(it.camera || "");
          const lens = escapeHtml(it.lens || "");
          const camLine = cam ? `<div class="m-gear__line m-gear__cam">${cam}</div>` : "";
          const lensLine = lens ? `<div class="m-gear__line m-gear__lens">${lens}</div>` : "";

          return `
          <article class="m-post" data-index="${idx}">
            <figure class="m-frame">
              <img class="m-photo"
                   src="${imgDir + escapeHtml(it.file)}"
                   alt="${escapeHtml((data.title || series).toUpperCase())} ${n}"
                   loading="lazy"
                   decoding="async">
            </figure>
            <div class="m-meta">
              <div class="m-statement">${stmt}</div>
              <div class="m-gear" data-gear>
                ${camLine}
                ${lensLine}
              </div>
            </div>
            <div class="m-count">${n} / ${String(images.length).padStart(2, "0")}</div>
          </article>
        `;
        })
        .join("");

      setHeadVars();
      const total = images.length;
      setBtnState(0, total);

      btnUp.addEventListener("click", () => goToIndex(getCurrentIndex(total) - 1, total));
      btnDown.addEventListener("click", () => goToIndex(getCurrentIndex(total) + 1, total));

      let ticking = false;
      FEED.addEventListener(
        "scroll",
        () => {
          if (ticking) return;
          ticking = true;
          requestAnimationFrame(() => {
            setBtnState(getCurrentIndex(total), total);
            ticking = false;
          });
        },
        { passive: true }
      );
    })
    .catch((e) => {
      console.error(e);
      FEED.innerHTML = `
        <p style="padding:18px;opacity:.85;letter-spacing:.08em;line-height:1.5">
          Series data not found.<br>
          <span style="opacity:.7;font-size:12px;display:block;margin-top:10px">
            ${escapeHtml(String(e.message || e))}
          </span>
        </p>
      `;
      btnUp.disabled = true;
      btnDown.disabled = true;
      btnUp.style.opacity = "0.35";
      btnDown.style.opacity = "0.35";
    });
})();
