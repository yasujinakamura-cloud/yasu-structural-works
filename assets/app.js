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

  const categoryStage = (() => {
    const CARD_W = 220;
    const CARD_H = 147;
    const BURST_MS = 920;
    const PAUSE_MS = 110;
    const BURST_EASE = "cubic-bezier(0.11, 0.94, 0.16, 1)";
    const ORBIT_SPEED = 0.0022;
    const ZOOM_TARGET = 1.2;
    const ZOOM_DURATION_MS = 34000;
    const FLASH_COOLDOWN_MS = 6200;
    const FLASH_ANGLE_EPS = 0.18; // rad (~10deg)

    const sleep = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));
    const nextFrame = () => new Promise((resolve) => requestAnimationFrame(() => resolve()));
    const txOnly = (x, y) => `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;
    const txForm = (x, y, scale = 1, rot = 0) =>
      `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) rotate(${rot}deg) scale(${scale})`;
    const normRad = (a) => {
      const twoPi = Math.PI * 2;
      let x = a % twoPi;
      if (x < -Math.PI) x += twoPi;
      if (x > Math.PI) x -= twoPi;
      return x;
    };

    const shuffleOrder = (arr) => {
      const a = arr.slice();
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    };

    const waapi = (el, keyframes, duration) => {
      if (typeof el.animate !== "function") {
        const last = keyframes[keyframes.length - 1];
        if (last.transform) el.style.transform = last.transform;
        if (last.opacity != null) el.style.opacity = String(last.opacity);
        if (last.filter) el.style.filter = last.filter;
        return sleep(duration);
      }
      return el
        .animate(keyframes, { duration, easing: BURST_EASE, fill: "forwards" })
        .finished.catch(() => {});
    };

    const clearItemMotion = (li) => {
      if (typeof li.getAnimations === "function") {
        li.getAnimations().forEach((anim) => anim.cancel());
      }
      li.style.removeProperty("transform");
      li.style.removeProperty("filter");
    };

    const resetItem = (li) => {
      li.classList.remove("is-active", "is-placed", "cat-card--orbit");
      li.style.animation = "none";
      clearItemMotion(li);
      li.style.opacity = "0";
      li.style.filter = "blur(10px)";
      li.style.pointerEvents = "none";
      li.style.transform = txForm(0, 0, 0.45);
      li.style.zIndex = "1";
    };

    const settlePlaced = (li, slot, z) => {
      clearItemMotion(li);
      li.classList.add("is-placed", "cat-card--orbit");
      li.classList.remove("is-active");
      li.style.pointerEvents = "auto";
      li.style.opacity = "1";
      li.style.zIndex = String(z);
      li.style.transform = txOnly(slot.x, slot.y);
    };

    const stage = {
      root: null,
      items: [],
      slots: [],
      running: false,
      done: false,
      orbitRaf: 0,
      orbitPaused: false,
      orbitAngle: 0,
      orbitAnglePrev: 0,
      zoomScale: 1,
      zoomStart: 0,
      lastFlashAtByIndex: [],

      init() {
        this.root = grid.querySelector(".frontGrid__items");
        if (!this.root) return false;
        this.items = [...this.root.children].filter((el) => el.tagName === "LI");
        this.root.style.setProperty("--cat-w", `${CARD_W}px`);
        this.root.style.setProperty("--cat-h", `${CARD_H}px`);
        if (!this.root.dataset.orbitBound) {
          this.root.dataset.orbitBound = "1";
          this.root.addEventListener("mouseenter", () => {
            this.orbitPaused = true;
          });
          this.root.addEventListener("mouseleave", () => {
            this.orbitPaused = false;
          });
        }
        return this.items.length > 0;
      },

      prepare() {
        if (!this.init()) return;
        this.stopOrbitMotion();
        this.orbitAngle = 0;
        this.zoomScale = 1;
        this.root.classList.remove("cat-stage--alive", "cat-stage--done", "cat-stage--orbit");
        this.root.classList.add("cat-stage-ready", "cat-stage");
        this.items.forEach(resetItem);
        void this.root.offsetHeight;
      },

      computeTargets() {
        const rect = this.root.getBoundingClientRect();
        const w = Math.max(rect.width, 320);
        const h = Math.max(rect.height, 360);
        const radius = Math.min(w, h) * 0.38;
        const base = Math.random() * Math.PI * 2;
        const n = this.items.length;
        this.slots = this.items.map((_, i) => {
          const angle = base + (i / n) * Math.PI * 2;
          return {
            angle,
            radius,
            x: Math.cos(angle) * radius,
            y: Math.sin(angle) * radius,
          };
        });
        return this.slots;
      },

      applyOrbitFrame() {
        this.root.style.transform = `scale(${this.zoomScale.toFixed(4)})`;
        this.root.style.transformOrigin = "50% 50%";
        this.items.forEach((li, i) => {
          const slot = this.slots[i];
          if (!slot) return;
          const a = slot.angle + this.orbitAngle;
          const x = Math.cos(a) * slot.radius;
          const y = Math.sin(a) * slot.radius;
          li.style.transform = txOnly(x, y);
        });
      },

      maybeFlashAtZero(nowMs) {
        const n = Math.min(this.items.length, this.slots.length);
        if (n <= 0) return;
        if (!Array.isArray(this.lastFlashAtByIndex) || this.lastFlashAtByIndex.length !== n) {
          this.lastFlashAtByIndex = Array.from({ length: n }, () => 0);
        }

        for (let i = 0; i < n; i++) {
          const li = this.items[i];
          const slot = this.slots[i];
          if (!li || !slot) continue;

          if (nowMs - (this.lastFlashAtByIndex[i] || 0) < FLASH_COOLDOWN_MS) continue;

          const aPrev = normRad(slot.angle + this.orbitAnglePrev);
          const aNow = normRad(slot.angle + this.orbitAngle);

          const nearNow = Math.abs(aNow) <= FLASH_ANGLE_EPS;
          const crossed =
            (aPrev < 0 && aNow >= 0) ||
            (aPrev > 0 && aNow <= 0) ||
            (Math.abs(aPrev - aNow) > Math.PI && nearNow);

          if (!(nearNow || crossed)) continue;

          this.lastFlashAtByIndex[i] = nowMs;
          li.classList.remove("catCard--flash");
          void li.offsetWidth;
          li.classList.add("catCard--flash");
          window.setTimeout(() => li.classList.remove("catCard--flash"), 6200);
        }
      },

      stopOrbitMotion() {
        if (this.orbitRaf) cancelAnimationFrame(this.orbitRaf);
        this.orbitRaf = 0;
        if (this.root) {
          this.root.style.removeProperty("transform");
          this.root.style.removeProperty("transform-origin");
          this.root.style.removeProperty("--cat-scale");
        }
      },

      startOrbitMotion() {
        this.stopOrbitMotion();
        this.items.forEach(clearItemMotion);
        this.root.classList.add("cat-stage--orbit");
        this.orbitAngle = 0;
        this.orbitAnglePrev = 0;
        this.zoomScale = 1;
        this.zoomStart = performance.now();
        this.lastFlashAtByIndex = Array.from({ length: this.items.length }, () => 0);
        this.items.forEach((li, i) => {
          const slot = this.slots[i];
          if (slot) li.style.transform = txOnly(slot.x, slot.y);
        });
        this.applyOrbitFrame();

        const tick = (now) => {
          this.orbitAnglePrev = this.orbitAngle;
          if (!this.orbitPaused) this.orbitAngle += ORBIT_SPEED;

          const t = Math.min(1, (now - this.zoomStart) / ZOOM_DURATION_MS);
          const eased = 1 - (1 - t) * (1 - t);
          this.zoomScale = 1 + (ZOOM_TARGET - 1) * eased;

          this.applyOrbitFrame();
          this.maybeFlashAtZero(now);
          this.orbitRaf = requestAnimationFrame(tick);
        };

        this.orbitRaf = requestAnimationFrame(tick);
      },

      async waitForStageSize(maxTry) {
        for (let i = 0; i < maxTry; i++) {
          const rect = this.root.getBoundingClientRect();
          if (rect.width >= 80 && rect.height >= 80) return;
          await nextFrame();
        }
      },

      async burstOne(li, slot, zIndex) {
        resetItem(li);
        void li.offsetWidth;
        li.classList.add("is-active");
        li.style.zIndex = "40";

        await waapi(
          li,
          [
            {
              transform: txForm(0, 0, 0.45, 0),
              opacity: 0,
              filter: "blur(10px)",
            },
            {
              transform: txForm(slot.x * 0.52, slot.y * 0.52, 1.26, 0),
              opacity: 1,
              filter: "blur(0px)",
              offset: 0.52,
            },
            {
              transform: txForm(slot.x, slot.y, 1, 0),
              opacity: 1,
              filter: "blur(0px)",
            },
          ],
          BURST_MS
        );

        settlePlaced(li, slot, zIndex);
      },

      isReady() {
        return (
          main.classList.contains("siteMain--settled") &&
          (main.classList.contains("siteMain--gridReveal") ||
            document.documentElement.classList.contains("home--grid-direct"))
        );
      },

      placeAllStatic() {
        this.items.forEach((li, i) => {
          const slot = this.slots[i];
          if (!slot) return;
          li.style.zIndex = String(i + 1);
          settlePlaced(li, slot, i + 1);
        });
        this.root.classList.add("cat-stage--done", "cat-stage--alive");
        this.done = true;
        this.running = false;
        this.startOrbitMotion();
      },

      startAlive() {
        this.root.classList.add("cat-stage--done", "cat-stage--alive");
        this.done = true;
        this.running = false;
        this.startOrbitMotion();
      },

      async run() {
        if (this.running || this.done) return;
        if (!this.init()) return;
        if (!this.isReady()) return;

        this.running = true;
        this.prepare();
        await this.waitForStageSize(60);
        await nextFrame();

        this.computeTargets();
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (reduced) {
          this.placeAllStatic();
          return;
        }

        const order = shuffleOrder(this.items.map((_, i) => i));
        try {
          for (let rank = 0; rank < order.length; rank++) {
            const idx = order[rank];
            await this.burstOne(this.items[idx], this.slots[idx], idx + 1);
            if (rank < order.length - 1) await sleep(PAUSE_MS);
          }
          this.startAlive();
        } catch (_) {
          this.placeAllStatic();
        }
      },

      abortToGrid() {
        this.stopOrbitMotion();
        this.running = false;
        this.done = true;
        if (!this.root) return;
        this.root.classList.remove(
          "cat-stage",
          "cat-stage-ready",
          "cat-stage--done",
          "cat-stage--alive",
          "cat-stage--orbit"
        );
        this.items.forEach((li) => {
          li.classList.remove("is-active", "is-placed", "cat-card--orbit");
          li.style.removeProperty("transform");
          li.style.removeProperty("opacity");
          li.style.removeProperty("filter");
          li.style.removeProperty("animation");
          li.style.removeProperty("pointer-events");
          li.style.removeProperty("z-index");
        });
      },
    };

    stage.init();
    return stage;
  })();

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
    categoryStage.prepare();
    void categoryStage.run().catch(() => categoryStage.abortToGrid());
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
    categoryStage.prepare();
  };

  const revealCategoryGrid = () => {
    categoryStage.prepare();
    main.classList.add("siteMain--gridReveal");
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        void categoryStage.run().catch(() => categoryStage.abortToGrid());
      });
    });
  };

  const revealAfterLift = () => {
    if (Math.abs(parseFloat(main.style.getPropertyValue("--siteMainLift")) || 0) < 0.5) {
      runPreludeThenRevealCategory();
      return;
    }
    showDripOverlay();
    window.setTimeout(runPreludeThenRevealCategory, DRIP_HOLD_MS);
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
      requestAnimationFrame(() => {
        finishLift();
        revealAfterLift();
      });
      return;
    }

    let fallbackTimer = 0;
    let liftFinished = false;

    const cleanup = () => {
      main.removeEventListener("transitionend", onTransformEnd);
      window.clearTimeout(fallbackTimer);
    };

    const onTransformEnd = (ev) => {
      if (ev.target !== main || ev.propertyName !== "transform") return;
      if (liftFinished) return;
      liftFinished = true;
      cleanup();
      finishLift();
    };

    revealAfterLift();

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