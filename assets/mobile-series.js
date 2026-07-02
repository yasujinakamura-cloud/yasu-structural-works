(function () {
  const FEED = document.getElementById("mFeed");
  const infoBtn = document.querySelector(".m-info");
  const head = document.querySelector(".m-head");
  const progressFill = document.querySelector("[data-progress-fill]");
  const btnUp = document.querySelector('[data-nav="up"]');
  const btnDown = document.querySelector('[data-nav="down"]');

  if (!FEED || !btnUp || !btnDown) return;

  const series = document.body.dataset.series || "structure";
  const jsonUrl = new URL(`${series}.json`, window.location.href).href;
  const imgDir = new URL("images/", window.location.href).href;

  function setHeadVars() {
    const h = head ? head.getBoundingClientRect().height : 0;
    document.documentElement.style.setProperty("--mhead-h", h + "px");
  }

  let showInfo = false;
  let totalPosts = 0;

  function applyInfoState() {
    document.documentElement.classList.toggle("show-info", showInfo);
    document.body.classList.toggle("m-info-on", showInfo);
    if (infoBtn) {
      infoBtn.setAttribute("aria-pressed", String(showInfo));
      infoBtn.classList.toggle("m-info--active", showInfo);
    }
  }

  if (infoBtn) {
    infoBtn.addEventListener("click", () => {
      showInfo = !showInfo;
      applyInfoState();
      setHeadVars();
    });
  }
  applyInfoState();

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  function getCurrentIndex() {
    const h = FEED.clientHeight || 1;
    return clamp(Math.round(FEED.scrollTop / h), 0, Math.max(totalPosts - 1, 0));
  }

  function updateProgress() {
    if (!progressFill || totalPosts <= 1) {
      if (progressFill) progressFill.style.width = totalPosts === 1 ? "100%" : "0%";
      return;
    }
    const i = getCurrentIndex();
    progressFill.style.width = `${((i + 1) / totalPosts) * 100}%`;
  }

  function setBtnState(i) {
    const upDisabled = i <= 0;
    const downDisabled = i >= totalPosts - 1;
    btnUp.disabled = upDisabled;
    btnDown.disabled = downDisabled;
    btnUp.classList.toggle("m-navBtn--disabled", upDisabled);
    btnDown.classList.toggle("m-navBtn--disabled", downDisabled);
  }

  function goToIndex(i) {
    const h = FEED.clientHeight || 1;
    const next = clamp(i, 0, totalPosts - 1);
    const cur = getCurrentIndex();
    if (next === cur) return;
    FEED.scrollTo({ top: next * h, behavior: "smooth" });
    setBtnState(next);
    updateProgress();
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

      const seriesTitle = (data.title || series).toUpperCase();
      const seriesLabel = document.querySelector(".m-head__series");
      if (seriesLabel) seriesLabel.textContent = seriesTitle;
      document.title = `${seriesTitle} — Yasu Nakamura`;

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
                   alt="${escapeHtml(seriesTitle)} ${n}"
                   loading="lazy"
                   decoding="async">
            </figure>
            <div class="m-meta">
              <p class="m-statement">${stmt}</p>
              <div class="m-gear">${camLine}${lensLine}</div>
            </div>
            <p class="m-count"><span class="m-count__cur">${n}</span><span class="m-count__sep">/</span><span class="m-count__total">${String(images.length).padStart(2, "0")}</span></p>
          </article>
        `;
        })
        .join("");

      FEED.querySelectorAll(".m-photo").forEach((img) => {
        const mark = () => img.classList.add("is-loaded");
        img.addEventListener("load", mark, { once: true });
        if (img.complete) mark();
      });

      totalPosts = images.length;
      setHeadVars();
      setBtnState(0);
      updateProgress();

      btnUp.addEventListener("click", () => goToIndex(getCurrentIndex() - 1));
      btnDown.addEventListener("click", () => goToIndex(getCurrentIndex() + 1));

      let ticking = false;
      FEED.addEventListener(
        "scroll",
        () => {
          if (ticking) return;
          ticking = true;
          requestAnimationFrame(() => {
            const i = getCurrentIndex();
            setBtnState(i);
            updateProgress();
            ticking = false;
          });
        },
        { passive: true }
      );

      if (window.SiteSeo) {
        const pageIndex = parseInt(document.body.getAttribute("data-index") || "0", 10);
        let pageIdx = pageIndex;
        if (pageIdx < 0) pageIdx = 0;
        if (pageIdx >= images.length) pageIdx = 0;
        const row = images[pageIdx];
        if (row) {
          const imageAbs = new URL(`images/${row.file}`, window.location.href).href;
          window.SiteSeo.applyPhotoSeo({
            series,
            seriesTitle: data.title || series,
            row,
            pageIndex: pageIdx,
            total: images.length,
            imageAbs,
            pageAbs: window.location.href.split("#")[0],
          });
        }
      }
    })
    .catch((e) => {
      console.error(e);
      FEED.innerHTML = `
        <p class="m-error">Series data not found.</p>
      `;
      btnUp.disabled = true;
      btnDown.disabled = true;
    });
})();
