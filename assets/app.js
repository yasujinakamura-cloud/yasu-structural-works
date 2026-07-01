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

  const isAlreadyMobile =
    path.endsWith("/mobile.html") ||
    path.endsWith("/mobile/index.html") ||
    path === "/mobile" ||
    path === "/mobile/";

  if (isMobile && isTop && !isAlreadyMobile) {
    const mobilePath = new URL("./mobile/index.html", location.href).pathname;
    location.replace(mobilePath + (location.search || "") + (location.hash || ""));
  }
})();

// Top: --dur-top-hold 後に #grid へ translate（--dur-site-settle）。水滴は --dur-cat-drip-hold 後にフェードアウトしカテゴリとクロスフェード。
(function () {
  const main = document.getElementById("siteMain");
  const grid = document.getElementById("grid");
  if (!main || !grid) return;

  const rootStyle = getComputedStyle(document.documentElement);
  const parseDurMs = (varName, fallbackSec) => {
    const raw = rootStyle.getPropertyValue(varName).trim();
    const n = parseFloat(raw);
    return Number.isFinite(n) ? Math.round(n * 1000) : Math.round(fallbackSec * 1000);
  };

  const TOP_HOLD_MS = parseDurMs("--dur-top-hold", 4);
  const TRANS_MS = parseDurMs("--dur-site-settle", 5.25);
  const DRIP_HOLD_MS = parseDurMs("--dur-cat-drip-hold", 4);
  const PRELUDE_MS = parseDurMs("--dur-cat-prelude", 1.5);
  const PRELUDE_FADE_MS = parseDurMs("--dur-cat-prelude-fade", 0.45);

  const preludeOverlay = document.createElement("div");
  preludeOverlay.id = "catPreludeOverlay";
  preludeOverlay.className = "catPreludeOverlay";
  preludeOverlay.setAttribute("aria-hidden", "true");

  const PRELUDE_GAME_DONE_MS = 720;

  const PRELUDE_SHELL = `
<div class="catPreludeOverlay__shell">
  <div class="catPreludeScatter" aria-hidden="true"></div>
  <div class="catPreludeOverlay__footer">
    <p class="catPreludeOverlay__slots" id="catPreludeSlots" aria-live="polite" aria-atomic="true"></p>
    <p class="catPreludeOverlay__hint">Letters settle into place.</p>
  </div>
</div>`;
  const dripOverlay = document.createElement("div");
  dripOverlay.id = "catDripOverlay";
  dripOverlay.className = "catDripOverlay";
  dripOverlay.setAttribute("aria-hidden", "true");
  dripOverlay.innerHTML = `
<div class="catDripOverlay__backdrop"></div>
<div class="catDripOverlay__wrap">
  <div class="catDripOverlay__stage">
    <div class="catDripOverlay__floor">
      <span class="catDripOverlay__ripple catDripOverlay__ripple--a"></span>
      <span class="catDripOverlay__ripple catDripOverlay__ripple--b"></span>
      <span class="catDripOverlay__ripple catDripOverlay__ripple--c"></span>
    </div>
    <div class="catDripBurst catDripBurst--1" aria-hidden="true">
      <span></span><span></span><span></span><span></span><span></span>
    </div>
    <div class="catDripBurst catDripBurst--2" aria-hidden="true">
      <span></span><span></span><span></span><span></span><span></span>
    </div>
    <div class="catDripBurst catDripBurst--3" aria-hidden="true">
      <span></span><span></span><span></span><span></span><span></span>
    </div>
    <span class="catDrip catDrip--1"></span>
    <span class="catDrip catDrip--2"></span>
    <span class="catDrip catDrip--3"></span>
  </div>
  <p class="catDripOverlay__caption">Just kick back and enjoy the vibe.</p>
</div>`;
  document.body.appendChild(dripOverlay);
  document.body.appendChild(preludeOverlay);

  const showDripOverlay = () => dripOverlay.classList.add("catDripOverlay--visible");

  const stripDripOverlay = () => {
    dripOverlay.classList.remove("catDripOverlay--visible", "catDripOverlay--exiting");
  };

  /** シリーズ等から index.html#grid で戻ったとき：待ちアニメを挟まずカテゴリを確定表示（lift は畳み後と同じ 0） */
  const applyDirectToGrid = () => {
    try {
      history.scrollRestoration = "manual";
    } catch (_) {}
    window.scrollTo(0, 0);
    main.style.setProperty("transition", "none");
    main.style.setProperty("--siteMainLift", "0px");
    main.classList.add("siteMain--settled", "siteMain--liftDone", "siteMain--gridReveal");
    document.documentElement.classList.add("home--grid-direct");
    void main.offsetHeight;
    main.style.removeProperty("transition");
    stripDripOverlay();
    YasuCategoryStage.prepare();
    YasuCategoryStage.run();
  };

  const settleReduced = () => {
    main.classList.add("siteMain--settled", "siteMain--liftDone");
    main.style.setProperty("--siteMainLift", "0px");
  };

  const applyLiftDone = () => {
    main.style.setProperty("transition", "none");
    main.classList.remove("siteMain--gridReveal");
    main.classList.add("siteMain--liftDone");
    main.style.setProperty("--siteMainLift", "0px");
    void main.offsetHeight;
    main.style.removeProperty("transition");
    YasuCategoryStage.prepare();
  };

  const revealCategoryGrid = () => {
    YasuCategoryStage.prepare();
    main.classList.add("siteMain--gridReveal");
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => YasuCategoryStage.run());
    });
  };

  const PRELUDE_TARGET = "Savor the moment.";
  const PRELUDE_FILLER =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz.,;:!?&";

  const shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  const PRELUDE_AUTO_START_MS = parseDurMs("--dur-cat-prelude-auto-start", 0.45);
  const PRELUDE_AUTO_HIGHLIGHT_MS = parseDurMs("--dur-cat-prelude-auto-highlight", 0.16);
  const PRELUDE_AUTO_STEP_MS = parseDurMs("--dur-cat-prelude-auto-step", 0.26);

  const initPreludeLetterAuto = () => {
    preludeOverlay.innerHTML = PRELUDE_SHELL;
    const scatter = preludeOverlay.querySelector(".catPreludeScatter");
    const slotsEl = preludeOverlay.querySelector("#catPreludeSlots");
    if (!scatter || !slotsEl) return () => {};

    slotsEl.innerHTML = [...PRELUDE_TARGET]
      .map(
        (_, i) =>
          `<span class="catPreludeSlot" data-idx="${i}"><span class="catPreludeSlot__face">\u00b7</span></span>`
      )
      .join("");

    const poolChars = [...PRELUDE_TARGET];
    for (let i = 0; i < 92; i++) {
      poolChars.push(PRELUDE_FILLER[i % PRELUDE_FILLER.length]);
    }
    const shuffled = shuffle(poolChars);

    const tiles = [];
    shuffled.forEach((ch) => {
      const el = document.createElement("span");
      el.className = "catPreludeTile";
      el.dataset.char = ch;
      el.setAttribute("aria-hidden", "true");
      const display = ch === " " ? "\u2423" : ch;
      el.textContent = display;
      el.style.left = `${4 + Math.random() * 89}%`;
      el.style.top = `${5 + Math.random() * 78}%`;
      el.style.setProperty("--catPreludeRot", `${(Math.random() * 38 - 19).toFixed(1)}deg`);
      const blinkMs = Math.round((0.72 + Math.random() * 1.68) * 1000);
      const blinkDelayMs = Math.round(Math.random() * 3200);
      el.style.setProperty("--catPreludeBlinkMs", `${blinkMs}ms`);
      el.style.setProperty("--catPreludeBlinkDelay", `${blinkDelayMs}ms`);
      scatter.appendChild(el);
      tiles.push(el);
    });

    const slotFaces = slotsEl.querySelectorAll(".catPreludeSlot__face");
    let progress = 0;
    let cancelled = false;
    let chainTimer = null;

    const clearChain = () => {
      if (chainTimer !== null) {
        window.clearTimeout(chainTimer);
        chainTimer = null;
      }
    };

    const schedule = (fn, ms) => {
      clearChain();
      chainTimer = window.setTimeout(fn, ms);
    };

    const runOneChar = () => {
      if (cancelled) return;
      if (progress >= PRELUDE_TARGET.length) {
        preludeOverlay.dispatchEvent(new CustomEvent("catPreludeComplete"));
        return;
      }

      const need = PRELUDE_TARGET[progress];
      const candidates = tiles.filter(
        (t) => !t.classList.contains("catPreludeTile--used") && t.dataset.char === need
      );
      const pick =
        candidates.length > 0
          ? candidates[Math.floor(Math.random() * candidates.length)]
          : null;

      if (!pick) return;

      pick.classList.add("catPreludeTile--autoTarget");
      schedule(() => {
        if (cancelled) return;
        pick.classList.remove("catPreludeTile--autoTarget");
        pick.classList.add("catPreludeTile--picked", "catPreludeTile--used");
        const face = slotFaces[progress];
        if (face) {
          face.textContent = need === " " ? "\u00a0" : need;
          face.closest(".catPreludeSlot")?.classList.add("catPreludeSlot--filled");
        }
        progress += 1;
        if (progress >= PRELUDE_TARGET.length) {
          preludeOverlay.dispatchEvent(new CustomEvent("catPreludeComplete"));
        } else {
          schedule(runOneChar, PRELUDE_AUTO_STEP_MS);
        }
      }, PRELUDE_AUTO_HIGHLIGHT_MS);
    };

    schedule(runOneChar, PRELUDE_AUTO_START_MS);

    return () => {
      cancelled = true;
      clearChain();
    };
  };

  /** 水滴のあとプリリュード（文字の自動綴じ）→ カテゴリへ */
  const runPreludeThenRevealCategory = () => {
    stripDripOverlay();

    let preludeCompleteFn = null;

    let preludeDone = false;
    const finishPreludeOut = () => {
      if (preludeDone) return;
      preludeDone = true;
      preludeOverlay.removeEventListener("transitionend", onPreludeFade);
      if (preludeCompleteFn) {
        preludeOverlay.removeEventListener("catPreludeComplete", preludeCompleteFn);
        preludeCompleteFn = null;
      }
      preludeOverlay.innerHTML = "";
      preludeOverlay.classList.remove(
        "catPreludeOverlay--visible",
        "catPreludeOverlay--out",
        "catPreludeOverlay--game"
      );
      preludeOverlay.removeAttribute("role");
      preludeOverlay.setAttribute("aria-hidden", "true");
      revealCategoryGrid();
    };

    const onPreludeFade = (ev) => {
      if (ev.target !== preludeOverlay || ev.propertyName !== "opacity") return;
      finishPreludeOut();
    };

    const startFadeOut = () => {
      preludeOverlay.addEventListener("transitionend", onPreludeFade);
      preludeOverlay.classList.add("catPreludeOverlay--out");
      window.setTimeout(finishPreludeOut, PRELUDE_FADE_MS + 160);
    };

    const onGameComplete = () => {
      window.setTimeout(startFadeOut, PRELUDE_GAME_DONE_MS);
    };

    preludeOverlay.classList.remove("catPreludeOverlay--game", "catPreludeOverlay--out");
    preludeOverlay.classList.add("catPreludeOverlay--visible");

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      preludeOverlay.innerHTML =
        '<p class="catPreludeOverlay__text">Savor the moment.</p>';
      window.setTimeout(() => {
        preludeOverlay.addEventListener("transitionend", onPreludeFade);
        preludeOverlay.classList.add("catPreludeOverlay--out");
        window.setTimeout(finishPreludeOut, PRELUDE_FADE_MS + 160);
      }, PRELUDE_MS);
      return;
    }

    preludeCompleteFn = () => {
      preludeOverlay.removeEventListener("catPreludeComplete", preludeCompleteFn);
      detachScatter();
      preludeOverlay.removeAttribute("role");
      preludeOverlay.setAttribute("aria-hidden", "true");
      onGameComplete();
    };

    preludeOverlay.classList.add("catPreludeOverlay--game");
    const detachScatter = initPreludeLetterAuto();
    preludeOverlay.setAttribute("aria-hidden", "false");
    preludeOverlay.setAttribute("role", "region");
    preludeOverlay.setAttribute("aria-label", "Savor the moment.");
    preludeOverlay.addEventListener("catPreludeComplete", preludeCompleteFn);
  };

  const finishLift = () => {
    if (main.classList.contains("siteMain--liftDone")) return;
    applyLiftDone();
  };

  const settleMotion = () => {
    const liftPx = -grid.getBoundingClientRect().top;
    main.style.setProperty("--siteMainLift", `${liftPx}px`);
    main.classList.add("siteMain--settled");

    if (Math.abs(liftPx) < 0.5) {
      requestAnimationFrame(() => finishLift());
      return;
    }

    showDripOverlay();

    let dripHoldTimer = 0;
    let fallbackTimer = 0;
    let liftFinished = false;

    const cleanup = () => {
      main.removeEventListener("transitionend", onTransformEnd);
      window.clearTimeout(dripHoldTimer);
      window.clearTimeout(fallbackTimer);
    };

    const onTransformEnd = (ev) => {
      if (ev.target !== main || ev.propertyName !== "transform") return;
      if (liftFinished) return;
      liftFinished = true;
      cleanup();
      finishLift();
    };

    dripHoldTimer = window.setTimeout(() => {
      runPreludeThenRevealCategory();
    }, DRIP_HOLD_MS);

    main.addEventListener("transitionend", onTransformEnd);
    fallbackTimer = window.setTimeout(() => {
      if (liftFinished) return;
      liftFinished = true;
      cleanup();
      finishLift();
    }, TRANS_MS + 250);
  };

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    if (location.hash === "#grid") {
      applyDirectToGrid();
    } else {
      settleReduced();
    }
    return;
  }

  if (location.hash === "#grid") {
    stripDripOverlay();
    requestAnimationFrame(() => {
      requestAnimationFrame(applyDirectToGrid);
    });
    return;
  }

  window.setTimeout(() => {
    requestAnimationFrame(settleMotion);
  }, TOP_HOLD_MS);
})();