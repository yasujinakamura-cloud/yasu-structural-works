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

  const series = (viewer.dataset.series || '').trim();        // ex: "structure"
  const index  = Number(viewer.dataset.index || 0);           // 0-based

  const titleEl = viewer.querySelector('[data-series-title]');
  const themeEl = viewer.querySelector('[data-series-statement]'); // series statement (theme)
  const imageEl = viewer.querySelector('[data-series-image]');
  const countEl = viewer.querySelector('[data-series-count]');
  const prevEl  = viewer.querySelector('[data-series-prev]');
  const nextEl  = viewer.querySelector('[data-series-next]');

  // ★固定パス（このHTMLと同階層）
  const IMG_DIR  = './images/';
  const JSON_URL = `./${series}.json`;

const SERIES_DESC = {
  structure: 'Monochrome architecture—geometry, tension, and resistance.',
  light:    'Monochrome studies where light becomes force.',
  nocturne: 'Night as structure—silence, shadow, and drift.',
  velocity: 'Time in motion—color studies of speed and trace.'
};
   

  init().catch(err => {
    console.error(err);
    showFatal('Series data not found.');
  });

  async function init() {
    if (!series) throw new Error('Missing data-series on viewer');

    const res = await fetch(JSON_URL, { cache: 'no-store' });
    if (!res.ok) throw new Error(`Failed to load: ${JSON_URL}`);

    const data = await res.json();

// ===== Force unified descriptions (series-level) =====
const d = SERIES_DESC[series] || '';
if (d) {
  upsertMeta('meta[name="description"]', 'name', 'description', d);
  upsertMeta('meta[property="og:description"]', 'property', 'og:description', d);
  upsertMeta('meta[name="twitter:description"]', 'name', 'twitter:description', d);
  upsertMeta('meta[property="og:site_name"]', 'property', 'og:site_name', 'Yasu Nakamura Photography');
  upsertMeta('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image');
}

     

    const images = Array.isArray(data.images) ? data.images : [];
    if (!images.length) throw new Error('No images in JSON.');

    // clamp index
    const i = clamp(index, 0, images.length - 1);
    const img = images[i];

    // title
    if (titleEl) titleEl.textContent = data.title || series.toUpperCase();

    // series theme statement (top) -> 非表示（空にする）
    if (themeEl) themeEl.textContent = '';

    // per-photo statement
    const photoStatementEl = viewer.querySelector('[data-photo-statement]');
    if (photoStatementEl) photoStatementEl.textContent = img.statement || '';

    // per-photo GEAR
    const gearEl = viewer.querySelector('[data-photo-gear]');
    if (gearEl) {
      const camera = (img.camera || '').trim();
      const lens   = (img.lens || '').trim();
      const lines = [];
      if (camera) lines.push(camera);
      if (lens)   lines.push(lens);
      gearEl.textContent = lines.join(' / ');
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
    if (countEl) countEl.textContent = `${pad2(i + 1)} / ${pad2(images.length)}`;

    // ---- navigation: keep href for SEO, but always replace() to HTML (no JSON accidents)
    const goTo = (n) => {
      const url = `./${series}-${pad2(n)}.html`;
      location.replace(url + (location.search || '') + (location.hash || ''));
    };

    if (prevEl) {
      if (i <= 0) {
        prevEl.removeAttribute('href');
        prevEl.setAttribute('aria-disabled', 'true');
        prevEl.style.opacity = '0.35';
        prevEl.style.pointerEvents = 'none';
      } else {
        const n = i; // i=1 -> 01
        prevEl.href = `${series}-${pad2(n)}.html`;
        prevEl.addEventListener('click', (e) => { e.preventDefault(); goTo(n); });
      }
    }

    if (nextEl) {
      if (i >= images.length - 1) {
        nextEl.removeAttribute('href');
        nextEl.setAttribute('aria-disabled', 'true');
        nextEl.style.opacity = '0.35';
        nextEl.style.pointerEvents = 'none';
      } else {
        const n = i + 2; // i=0 -> 02
        nextEl.href = `${series}-${pad2(n)}.html`;
        nextEl.addEventListener('click', (e) => { e.preventDefault(); goTo(n); });
      }
    }

    // image src（画像が読み込めてから “is-ready” を付けて表示）
    if (imageEl) {
      const file = (typeof img === 'string') ? img : img.file;
      const src = IMG_DIR + file;

      // alt（JSONに alt があればそれを優先）
      imageEl.alt = img.alt || `${(data.title || series).toUpperCase()} ${pad2(i + 1)}`;

      imageEl.onload = () => document.documentElement.classList.add('is-ready');
      imageEl.onerror = () => {
        document.documentElement.classList.add('is-ready');
        console.error('Failed to load image:', src);
      };

      
       
       
       // ===== OG/Twitter image injection (absolute URL) =====
      const imgAbs = new URL(src, location.href).href;
      upsertMeta('meta[property="og:image"]', 'property', 'og:image', imgAbs);
      upsertMeta('meta[name="twitter:image"]', 'name', 'twitter:image', imgAbs);

       // ===== JSON-LD (Photograph) =====
         const pageAbs = location.href.split('#')[0];
         const title = `${(data.title || series).toUpperCase()} ${pad2(i + 1)}`;
         const desc  = SERIES_DESC[series] || '';

         upsertJsonLd('ld-photo', {
           "@context": "https://schema.org",
           "@type": "Photograph",
           "name": title,
           "description": desc,
           "image": imgAbs,
           "url": pageAbs,
           "mainEntityOfPage": pageAbs,
           "author": {
             "@type": "Person",
             "name": "Yasu Nakamura",
             "url": "https://yasu-nakamura.com/"
           },
           "isPartOf": {
             "@type": "CollectionPage",
             "name": (data.title || series).toUpperCase(),
             "url": new URL('./', location.href).href
           }
});

// ===== JSON-LD (BreadcrumbList) =====
const homeAbs = 'https://yasu-nakamura.com/index.html';
const seriesAbs = new URL(`./${series}-01.html`, location.href).href; // intro(noindex)は使わない
const currentAbs = pageAbs;

upsertJsonLd('ld-breadcrumb', {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": homeAbs
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": (data.title || series).toUpperCase(),
      "item": seriesAbs
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": `${(data.title || series).toUpperCase()} ${pad2(i + 1)}`,
      "item": currentAbs
    }
  ]
});
       
// ===== JSON-LD (Photograph) =====
const pageAbs = location.href.split('#')[0];
const title = `${(data.title || series).toUpperCase()} ${pad2(i + 1)}`;
const desc  = SERIES_DESC[series] || '';

upsertJsonLd('ld-photo', {
  "@context": "https://schema.org",
  "@type": "Photograph",
  "name": title,
  "description": desc,
  "image": imgAbs,
  "url": pageAbs,
  "mainEntityOfPage": pageAbs,
  "author": {
    "@type": "Person",
    "name": "Yasu Nakamura",
    "url": "https://yasu-nakamura.com/"
  },
  "isPartOf": {
    "@type": "CollectionPage",
    "name": (data.title || series).toUpperCase(),
    "url": new URL('./', location.href).href
  }
});

// ===== JSON-LD (BreadcrumbList) =====
upsertJsonLd('ld-breadcrumb', {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://yasu-nakamura.com/index.html"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": (data.title || series).toUpperCase(),
      "item": new URL(`./${series}-01.html`, location.href).href
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": title,
      "item": pageAbs
    }
  ]
});       

// 保険：ページ側に無い場合でもカード形式を固定
   upsertMeta('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image');

// srcセット（注入の後）
      imageEl.src = src;

       
      // キャッシュで onload が発火しないケース対策
      if (imageEl.complete) document.documentElement.classList.add('is-ready');
    } else {
      document.documentElement.classList.add('is-ready');
    }
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

   function upsertMeta(selector, attrName, attrValue, content){
     let m = document.querySelector(selector);
     if (!m) {
       m = document.createElement('meta');
       m.setAttribute(attrName, attrValue);
       document.head.appendChild(m);
  }
  m.setAttribute('content', content);
}


   
  function escapeHtml(s) {
  return String(s ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function upsertMeta(selector, attrName, attrValue, content){
  let m = document.querySelector(selector);
  if (!m) {
    m = document.createElement('meta');
    m.setAttribute(attrName, attrValue);
    document.head.appendChild(m);
  }
  m.setAttribute('content', content);
}

function upsertJsonLd(id, obj){
  let s = document.getElementById(id);
  if (!s) {
    s = document.createElement('script');
    s.type = 'application/ld+json';
    s.id = id;
    document.head.appendChild(s);
  }
  s.textContent = JSON.stringify(obj);
}

})();

