/**
 * Category stage — 中央から1枚ずつ放射状に弾け飛ばす
 */
(function () {
  "use strict";

  const CARD_W = 220;
  const CARD_H = 147;
  const BURST_MS = 640;
  const PAUSE_MS = 90;
  const BURST_EASE = "cubic-bezier(0.16, 0.84, 0.22, 1)";

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function sleep(ms) {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
  }

  function nextFrame() {
    return new Promise((resolve) => requestAnimationFrame(() => resolve()));
  }

  function txForm(x, y) {
    return `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;
  }

  function animateBurst(li, x, y) {
    const frames = [
      { transform: txForm(0, 0), opacity: 1 },
      { transform: txForm(x, y), opacity: 1 },
    ];
    if (typeof li.animate === "function") {
      return li
        .animate(frames, { duration: BURST_MS, easing: BURST_EASE, fill: "forwards" })
        .finished.catch(() => {});
    }
    li.style.transform = txForm(x, y);
    li.style.opacity = "1";
    return sleep(BURST_MS);
  }

  function resetItem(li) {
    li.classList.remove("is-active", "is-placed");
    li.style.transform = txForm(0, 0);
    li.style.opacity = "0";
    li.style.pointerEvents = "none";
    li.style.zIndex = "1";
  }

  function placeItem(li, x, y, z) {
    li.style.transform = txForm(x, y);
    li.style.opacity = "1";
    li.style.pointerEvents = "auto";
    li.style.zIndex = String(z);
    li.classList.add("is-placed");
    li.classList.remove("is-active");
  }

  const CategoryStage = {
    root: null,
    items: [],
    running: false,
    done: false,

    init() {
      this.root = document.querySelector("#grid .frontGrid__items");
      if (!this.root) return false;
      this.items = [...this.root.querySelectorAll(":scope > li")];
      this.root.style.setProperty("--cat-w", `${CARD_W}px`);
      this.root.style.setProperty("--cat-h", `${CARD_H}px`);
      return this.items.length > 0;
    },

    prepare() {
      if (!this.root && !this.init()) return;
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

      return this.items.map((_, i) => {
        const angle = base + (i / n) * Math.PI * 2;
        return {
          x: Math.cos(angle) * radius,
          y: Math.sin(angle) * radius,
        };
      });
    },

    async waitForStageSize(maxTry) {
      for (let i = 0; i < maxTry; i++) {
        const rect = this.root.getBoundingClientRect();
        if (rect.width >= 80 && rect.height >= 80) return;
        await nextFrame();
      }
    },

    async burstOne(li, target, zIndex) {
      resetItem(li);
      void li.offsetWidth;

      li.classList.add("is-active");
      li.style.opacity = "1";
      li.style.zIndex = "40";
      li.style.transform = txForm(0, 0);
      void li.offsetWidth;

      await animateBurst(li, target.x, target.y);
      placeItem(li, target.x, target.y, zIndex);
    },

    isReady() {
      const main = document.getElementById("siteMain");
      return (
        main &&
        main.classList.contains("siteMain--settled") &&
        (main.classList.contains("siteMain--gridReveal") ||
          document.documentElement.classList.contains("home--grid-direct"))
      );
    },

    placeAll(targets) {
      this.items.forEach((li, i) => {
        const t = targets[i];
        placeItem(li, t.x, t.y, i + 1);
      });
      this.root.classList.add("cat-stage--done");
      this.done = true;
      this.running = false;
    },

    async run() {
      if (this.running || this.done) return;
      if (!this.root && !this.init()) return;
      if (!this.isReady()) return;

      this.running = true;
      this.prepare();
      await this.waitForStageSize(60);
      await nextFrame();

      const targets = this.computeTargets();
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (reduced) {
        this.placeAll(targets);
        return;
      }

      const order = shuffle(this.items.map((_, i) => i));

      try {
        for (let rank = 0; rank < order.length; rank++) {
          const idx = order[rank];
          await this.burstOne(this.items[idx], targets[idx], idx + 1);
          if (rank < order.length - 1) await sleep(PAUSE_MS);
        }
        this.done = true;
        this.running = false;
        this.root.classList.add("cat-stage--done");
      } catch (_) {
        this.placeAll(targets);
      }
    },
  };

  window.YasuCategoryStage = CategoryStage;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      CategoryStage.init();
      if (location.hash === "#grid") CategoryStage.prepare();
    });
  } else {
    CategoryStage.init();
    if (location.hash === "#grid") CategoryStage.prepare();
  }
})();
