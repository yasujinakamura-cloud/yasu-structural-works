(function () {
  const root = document.documentElement;
  root.classList.add("is-ready");

  const main = document.querySelector("[data-series-viewer]");
  const img = document.querySelector("[data-series-image]");
  if (!main || !img) return;

  document.body.classList.add("viewer-page");
  main.classList.add("viewer--editorial");

  const series = main.getAttribute("data-series") || "structure";
  let index = parseInt(main.getAttribute("data-index") || "0", 10);

  const hang = img.closest(".viewerHang");
  const markLoaded = () => {
    img.classList.add("is-loaded");
    hang?.classList.add("is-dropped");
  };

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    hang?.classList.add("is-dropped");
  }

  const stmt = document.querySelector("[data-photo-statement]");
  const gear = document.querySelector("[data-photo-gear]");
  const count = document.querySelector("[data-series-count]");
  const toggle = document.querySelector("[data-gear-toggle]");
  const prev = document.querySelector("[data-series-prev]");
  const next = document.querySelector("[data-series-next]");

  function pageName(i) {
    return `${series}-${String(i + 1).padStart(2, "0")}.html`;
  }

  function formatGear(row) {
    if (window.SiteSeo) return window.SiteSeo.formatGear(row.camera, row.lens);
    const c = (row.camera || "").trim();
    const l = (row.lens || "").trim();
    if (c && l) return `${c} · ${l}`;
    return c || l || "";
  }

  function setPagerDisabled(link, disabled) {
    if (!link) return;
    link.classList.toggle("pager__link--disabled", disabled);
    if (disabled) {
      link.removeAttribute("href");
      link.setAttribute("aria-disabled", "true");
    } else {
      link.removeAttribute("aria-disabled");
    }
  }

  function applyRow(row, total, pageIndex, seriesTitle) {
    const file = row.file;
    if (!file) return;

    const imageAbs = new URL(`images/${file}`, window.location.href).href;
    const pageAbs = window.location.href.split("#")[0];

    if (window.SiteSeo) {
      const seo = window.SiteSeo.applyPhotoSeo({
        series,
        seriesTitle,
        row,
        pageIndex,
        total,
        imageAbs,
        pageAbs,
      });
      img.alt = row.statement
        ? `${row.statement} — ${window.SiteSeo.formatGear(row.camera, row.lens)}`.replace(/ — $/, "")
        : seo.photoName;
    } else {
      img.alt = row.statement || `${series.toUpperCase()} — ${pageIndex + 1}`;
    }

    img.addEventListener("load", markLoaded, { once: true });
    img.src = imageAbs;

    if (stmt) stmt.textContent = row.statement || "";
    if (gear) gear.textContent = formatGear(row);
    if (count) count.textContent = `${pageIndex + 1} / ${total}`;

    if (img.complete) markLoaded();

    if (prev) {
      setPagerDisabled(prev, pageIndex <= 0);
      if (pageIndex > 0) prev.setAttribute("href", pageName(pageIndex - 1));
    }
    if (next) {
      setPagerDisabled(next, pageIndex >= total - 1);
      if (pageIndex < total - 1) next.setAttribute("href", pageName(pageIndex + 1));
    }
  }

  if (toggle && main) {
    toggle.addEventListener("click", () => {
      main.classList.toggle("hide-gear");
    });
  }

  const jsonUrl = new URL(`${series}.json`, window.location.href);
  fetch(jsonUrl.href)
    .then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    })
    .then((data) => {
      const images = data.images || [];
      const total = images.length;
      if (total === 0) return;

      let pageIndex = index;
      if (pageIndex < 0) pageIndex = 0;
      if (pageIndex >= total) pageIndex = total - 1;

      const row = images[pageIndex];
      if (!row) return;
      applyRow(row, total, pageIndex, data.title || series);
    })
    .catch(() => {
      if (stmt) stmt.textContent = "Could not load series data.";
    });
})();
