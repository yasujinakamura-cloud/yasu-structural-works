(function () {
  const cfg = window.SERIES;
  if (!cfg || typeof cfg.slug !== "string") return;

  const grid = document.getElementById("seriesGrid");
  if (!grid) return;

  const empty = document.querySelector(".seriesEmpty");
  const lb = document.getElementById("lb");
  const lbClose = document.getElementById("lbClose");

  const dataUrl = cfg.dataUrl || `${cfg.slug}.json`;
  const slug = cfg.slug;
  const seriesTitle = cfg.title || slug.toUpperCase();

  function closeLightbox() {
    if (!lb) return;
    lb.hidden = true;
    document.body.style.overflow = "";
  }

  if (lbClose) {
    lbClose.addEventListener("click", closeLightbox);
  }

  if (lb) {
    lb.addEventListener("click", (e) => {
      if (e.target === lb) closeLightbox();
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && lb && !lb.hidden) closeLightbox();
  });

  fetch(new URL(dataUrl, window.location.href).href)
    .then((r) => {
      if (!r.ok) throw new Error(String(r.status));
      return r.json();
    })
    .then((data) => {
      const images = data.images || [];
      if (images.length === 0) {
        if (empty) {
          empty.hidden = false;
        }
        return;
      }
      if (empty) empty.hidden = true;

      images.forEach((row, idx) => {
        const file = typeof row === "string" ? row : row && row.file;
        if (!file) return;

        const figure = document.createElement("figure");
        figure.className = "shot";

        const viewerHref = `${slug}-${String(idx + 1).padStart(2, "0")}.html`;
        const imgSrc = new URL(`images/${file}`, window.location.href).href;
        const alt =
          typeof row === "object" && row.statement
            ? row.statement
            : `${seriesTitle} — ${String(idx + 1).padStart(2, "0")}`;

        const a = document.createElement("a");
        a.className = "shot__link";
        a.href = viewerHref;
        a.setAttribute("aria-label", `${seriesTitle} ${idx + 1}`);

        const img = document.createElement("img");
        img.className = "shot__img";
        img.src = imgSrc;
        img.alt = alt;
        img.loading = "lazy";
        img.decoding = "async";

        a.appendChild(img);

        const cap = document.createElement("figcaption");
        cap.className = "shot__cap";
        cap.textContent = String(idx + 1).padStart(2, "0");

        figure.appendChild(a);
        figure.appendChild(cap);
        grid.appendChild(figure);
      });
    })
    .catch(() => {
      if (empty) {
        empty.hidden = false;
        empty.textContent = "COULD NOT LOAD GALLERY.";
      }
    });
})();
