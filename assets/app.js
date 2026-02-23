/* =========================================================
   app.js
   - Top page category grid renderer
   - Mobile-only redirect to /mobile.html (root)
========================================================= */

// ===== Mobile redirect (Top -> /mobile.html) =====
(function () {
  // ?desktop=1 を付けたらモバイルでもPCトップを見れる
  const params = new URLSearchParams(location.search);
  if (params.get("desktop") === "1") return;

  const isMobile = window.matchMedia("(max-width: 700px)").matches;

  // GitHub Pages: /yasu-structural-works/ でも /index.html でもOKにする
  const path = location.pathname;
  const isTop =
    path.endsWith("/index.html") ||
    path.endsWith("/yasu-structural-works/") ||
    path.endsWith("/yasu-structural-works");

  const isAlreadyMobile = path.endsWith("/mobile.html");

  if (isMobile && isTop && !isAlreadyMobile) {
    location.replace("mobile.html" + (location.search || "") + (location.hash || ""));
  }
})();


// ===== Category grid renderer =====
(async function () {
  const mount = document.getElementById("catGrid");
  if (!mount) return;

  const isMobile = window.matchMedia("(max-width: 700px)").matches;

  try {
    const res = await fetch("data/categories.json", { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to load categories.json");
    const cats = await res.json();

    mount.innerHTML = cats
      .map((c) => {
        const hasCover = Boolean(c.cover);

        // ★ここが核心：スマホなら mobileHref を優先
        const raw = c.href; // スマホでも必ず intro.html を踏む
        const link = raw.replace(/^\/+/, "");

        return `
        <a class="catCard" href="${escapeHtml(link)}"
           data-slug="${escapeHtml(c.slug)}"
           aria-label="${escapeHtml(c.title)}">
          ${
            hasCover
              ? `<img class="catCard__img" src="${escapeHtml(
                  c.cover
                )}" alt="" loading="lazy" decoding="async">`
              : ``
          }
          <div class="catCard__overlay" aria-hidden="true"></div>
          <div class="catCard__text">
            <div class="catCard__title">${escapeHtml(c.title)}</div>
            <div class="catCard__sub">${escapeHtml(c.subtitle || "")}</div>
            <div class="catCard__enter">ENTER →</div>
          </div>
        </a>
      `;
      })
      .join("");
  } catch (e) {
    mount.innerHTML = `<p class="frontGrid__empty">FAILED TO LOAD CATEGORIES.</p>`;
    console.error(e);
  }

  function escapeHtml(s) {
    return String(s ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }
})();
