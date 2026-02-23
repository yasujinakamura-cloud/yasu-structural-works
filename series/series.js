/* =========================================================
   series.js  (ONE FILE for all series)
   - Each series folder contains:
       /series/<series>/
         <series>-01.html ... (viewer pages)
         <series>.json          (ex: structure.json)
         /images/001.jpg ...
   ========================================================= */

(function () {
  const viewer = document.querySelector('[data-series-viewer]');
  if (!viewer) return;

  // ==== FOUC対策：JS準備完了まで表示しない（theme.css側とセット） ====
  document.documentElement.classList.remove('is-ready');

  const series = viewer.dataset.series;             // ex: "structure"
  const index  = Number(viewer.dataset.index || 0); // 0-based

  const titleEl = viewer.querySelector('[data-series-title]');
  const themeEl = viewer.querySelector('[data-series-statement]'); // series statement (theme)
  const imageEl = viewer.querySelector('[data-series-image]');
  const countEl = viewer.querySelector('[data-series-count]');
  const prevEl  = viewer.querySelector('[data-series-prev]');
  const nextEl  = viewer.querySelector('[data-series-next]');

  // ★重要：画像は「このHTMLと同階層の images/」に入っている前提
  const IMG_DIR = 'images/';

  // JSON は「このHTMLと同階層」に置く
  const JSON_URL = `./${series}.json`;

  init().catch(err => {
    console.error(err);
    showFatal('Series data not found.');
  });

  async function init() {
    const res = await fetch(JSON_URL, { cache: 'no-store' });
    if (!res.ok) throw new Error(`Failed to load: ${JSON_URL}`);

    const data = await res.json();

    const images = Array.isArray(data.images) ? data.images : [];
    if (!images.length) throw new Error('No images in JSON.');

    // clamp index
    const i = clamp(index, 0, images.length - 1);
    const img = images[i];

    const seriesTitle = (data.title || series).toUpperCase();
    const num = pad2(i + 1);

    // series title (if exists in DOM)
    if (titleEl) titleEl.textContent = data.title || seriesTitle;

    // series theme statement (top) -> 非表示（空にする）
    if (themeEl) themeEl.textContent = '';

    // per-photo statement
    const photoStatementEl = viewer.querySelector('[data-photo-statement]');
    if (photoStatementEl) photoStatementEl.textContent = img.statement || '';

    // per-photo GEAR (camera/lens)
    const gearEl = viewer.querySelector('[data-photo-gear]');
    const camera = (img.camera || '').trim();
    const lens   = (img.lens || '').trim();
    if (gearEl) {
      const lines = [];
      if (camera) lines.push(camera);
      if (lens)   lines.push(lens);
      gearEl.textContent = lines.join(' / '); // 1行表示
    }

    // GEAR TOGGLE (persist)
    const toggle = viewer.querySelector('[data-gear-toggle]');
    if (toggle) {
      const saved = localStorage.getItem('gearHidden');
      if (saved === 'true') viewer.classList.add('hide-gear');

      toggle.addEventListener('click', () => {
        viewer.classList.toggle('hide-gear');
        localStorage.setItem('gearHidden', viewer.classList.contains('hide-gear'));
      });
    }

    // pager count
    if (countEl) countEl.textContent = `${num} / ${pad2(images.length)}`;

    // pager links（ファイル名は structure-01.html, structure-02.html... 前提）
    if (prevEl) {
      if (i <= 0) {
        prevEl.removeAttribute('href');
        prevEl.setAttribute('aria-disabled', 'true');
        prevEl.style.opacity = '0.35';
        prevEl.style.pointerEvents = 'none';
      } else {
        prevEl.href = `${series}-${pad2(i)}.html`; // i=1 -> structure-01.html
      }
    }

    if (nextEl) {
      if (i >= images.length - 1) {
        nextEl.removeAttribute('href');
        nextEl.setAttribute('aria-disabled', 'true');
        nextEl.style.opacity = '0.35';
        nextEl.style.pointerEvents = 'none';
      } else {
        nextEl.href = `${series}-${pad2(i + 2)}.html`; // i=0 -> structure-02.html
      }
    }

    // image src + SEO alt + social image meta
    if (imageEl) {
      const srcRel = IMG_DIR + img.file; // images/001.jpg
      const srcAbs = new URL(srcRel, window.location.href).toString();

      // --- ALT: JSONのaltを最優先。無い場合は自動生成 ---
      imageEl.alt = buildAlt({
        seriesTitle,
        num,
        statement: img.statement,
        camera,
        lens,
        jsonAlt: img.alt
      });

      // --- ページtitle（SNSやタブでの視認性向上） ---
      // SEOの主はHTMLの<title>だが、UXとして補強（JSは実行されない場合もあるので“上書きしても致命ではない”設計に）
      const base = `${seriesTitle} ${num} | Yasu Nakamura Photography`;
      const st = (img.statement || '').trim();
      document.title = st ? `${seriesTitle} ${num} — ${st} | Yasu Nakamura Photography` : base;

      // --- OG/Twitter 画像を自動で差し替え（共有強化） ---
      setMetaContent('property', 'og:image', srcAbs);
      setMetaContent('name', 'twitter:image', srcAbs);

      // 画像がロードされてから表示
      imageEl.onload = () => {
        document.documentElement.classList.add('is-ready');
      };
      imageEl.onerror = () => {
        document.documentElement.classList.add('is-ready');
        console.error('Failed to load image:', srcRel);
      };

      imageEl.src = srcRel;

      // キャッシュで onload が発火しないケース対策
      if (imageEl.complete) {
        document.documentElement.classList.add('is-ready');
      }
    } else {
      document.documentElement.classList.add('is-ready');
    }
  }

  function buildAlt({ seriesTitle, num, statement, camera, lens, jsonAlt }) {
    const cleanJsonAlt = (jsonAlt || '').trim();
    if (cleanJsonAlt) return cleanJsonAlt;

    // 過度に断定しない（被写体・場所を推測しない）。シリーズ意図＋機材＋文言で“説明的”にする。
    const parts = [];

    parts.push(`${seriesTitle} ${num}`);
    if ((statement || '').trim()) parts.push((statement || '').trim());

    // SEOワードは控えめに入れる（スパム化しない）
    parts.push('Monochrome photography.');

    const gear = [];
    if (camera) gear.push(camera);
    if (lens) gear.push(lens);
    if (gear.length) parts.push(`Camera: ${gear.join(' / ')}.`);

    // 長すぎるaltは避ける（目安125〜160文字程度）
    const alt = parts.join(' ');
    return alt.length > 170 ? alt.slice(0, 167).trim() + '…' : alt;
  }

  function setMetaContent(attrName, attrValue, content) {
    if (!content) return;
    let el = document.querySelector(`meta[${attrName}="${attrValue}"]`);
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(attrName, attrValue);
      document.head.appendChild(el);
    }
    el.setAttribute('content', content);
  }

  function showFatal(msg) {
    viewer.innerHTML = `<p style="padding:24px;opacity:.8">${escapeHtml(msg)}</p>`;
    document.documentElement.classList.add('is-ready');
  }

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  function pad2(n) {
    return String(n).padStart(2, '0');
  }

  function escapeHtml(s) {
    return String(s ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }
})();

