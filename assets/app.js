/* =========================================================
   app.js
   - Top page category grid renderer
   - Mobile-only redirect (Top -> mobile.html)
========================================================= */

(function () {
  // ?desktop=1 を付けたらスマホでもPCトップを見れる
  const params = new URLSearchParams(location.search);
  if (params.get("desktop") === "1") return;

  const isMobile = window.matchMedia("(max-width: 700px)").matches;

  // GitHub Pages とローカル両方で「トップ」を判定
  const path = location.pathname;
  const isTop =
    path.endsWith("/index.html") ||
    path.endsWith("/yasu-structural-works/") ||
    path.endsWith("/yasu-structural-works") ||
    path === "/" ||
    path === "";

  const isAlreadyMobile = path.endsWith("/mobile.html");

  if (isMobile && isTop && !isAlreadyMobile) {
    // hash / query を引き継ぐ（必要なら）
    const suffix = (location.search || "") + (location.hash || "");
    location.replace("mobile.html" + suffix);
  }
})();

(async function () {
  // =====================================================
  // Category grid rendering
  // =====================================================
  const mount = document.getElementById("catGrid");
  if (!mount) return;

  try {
    const res = await fetch("data/categories.json", { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to load categories.json");
    const cats = await res.json();

    mount.innerHTML = cats
      .map((c) => {
        const hasCover = Boolean(c.cover);
        return `
          <a class="catCard" href="${escapeHtml(c.href)}" data-slug="${escapeHtml(
            c.slug
          )}" aria-label="${escapeHtml(c.title)}">
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