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
  // theme.css に:
  //   .viewer{opacity:0;}
  //   html.is-ready .viewer{opacity:1; transition: opacity .12s ease;}
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
  // ex) /series/structure/structure-01.html から見て
  //     images/001.jpg になる
  const IMG_DIR = 'images/';

  // JSON は「このHTMLと同階層」に置く
  // ex) /series/structure/structure.json
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

    // title
    if (titleEl) titleEl.textContent = data.title || series.toUpperCase();

    // series theme statement (top) -> 非表示（空にする）
    if (themeEl) themeEl.textContent = '';

    // per-photo statement（写真ごとの文言：右上に出している想定）
    const photoStatementEl = viewer.querySelector('[data-photo-statement]');
    if (photoStatementEl) {
      photoStatementEl.textContent = img.statement || '';
    }

    // ===== per-photo GEAR (camera/lens) =====
    const gearEl = viewer.querySelector('[data-photo-gear]');
    if (gearEl) {
    const camera = (img.camera || '').trim();
    const lens   = (img.lens || '').trim();

  // 2行表示（片方だけでもOK）
    const lines = [];
    if (camera) lines.push(camera);
    if (lens)   lines.push(lens);

    gearEl.textContent = lines.join(' / '); // ← 1行で出すならこれ
  // gearEl.innerHTML = lines.map(s => `<div>${escapeHtml(s)}</div>`).join(''); // ← 2行にしたいならこっち（その場合 escapeHtml が必要）

// ===== GEAR TOGGLE (persist) =====
const toggle = viewer.querySelector('[data-gear-toggle]');
if (toggle) {
  const saved = localStorage.getItem('gearHidden');
  if (saved === 'true') viewer.classList.add('hide-gear');

  toggle.addEventListener('click', () => {
    viewer.classList.toggle('hide-gear');
    localStorage.setItem('gearHidden', viewer.classList.contains('hide-gear'));
  });
}



}




    // pager count
    if (countEl) countEl.textContent = `${pad2(i + 1)} / ${pad2(images.length)}`;

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

    // image src（画像が読み込めてから “is-ready” を付けて表示）
    if (imageEl) {
      const src = IMG_DIR + img.file; // images/001.jpg
      imageEl.alt = `${(data.title || series).toUpperCase()} ${pad2(i + 1)}`;

      // 画像がロードされてから表示（Safariのチラ見え防止）
      imageEl.onload = () => {
        document.documentElement.classList.add('is-ready');
      };
      imageEl.onerror = () => {
        // 画像が読めない場合も、画面が真っ黒のままにならないよう表示はする
        document.documentElement.classList.add('is-ready');
        console.error('Failed to load image:', src);
      };

      // キャッシュで onload が発火しないケース対策
      imageEl.src = src;
      if (imageEl.complete) {
        // complete でも失敗している可能性はあるが、ここでは“表示だけ”を優先
        document.documentElement.classList.add('is-ready');
      }
    } else {
      // 画像要素がないなら、その時点で表示
      document.documentElement.classList.add('is-ready');
    }
  }

  function showFatal(msg) {
    viewer.innerHTML = `<p style="padding:24px;opacity:.8">${escapeHtml(msg)}</p>`;
    // エラー時も真っ黒固定にならないよう表示
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

