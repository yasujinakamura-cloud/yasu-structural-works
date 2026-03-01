/* =========================================================
   app.js
   - Mobile-only redirect (Top -> /mobile.html)
   NOTE:
   - Category grid is rendered by Astro now (no DOM injection here).
========================================================= */

// ===== Mobile redirect (Top -> /mobile.html) =====
(function () {
  // ?desktop=1 を付けたらモバイルでもPCトップを見れる
  const params = new URLSearchParams(location.search);
  if (params.get("desktop") === "1") return;

  const isMobile = window.matchMedia("(max-width: 700px)").matches;

  const path = location.pathname;

  // Top 判定：
  //  - / (Astro index)
  //  - /index.html (legacy)
  //  - GitHub Pages の /yasu-structural-works/ 互換も残す
  const isTop =
    path === "/" ||
    path.endsWith("/index.html") ||
    path.endsWith("/yasu-structural-works/") ||
    path.endsWith("/yasu-structural-works");

  const isAlreadyMobile = path.endsWith("/mobile.html");

  if (isMobile && isTop && !isAlreadyMobile) {
    location.replace(
      "/mobile.html" + (location.search || "") + (location.hash || "")
    );
  }
})();