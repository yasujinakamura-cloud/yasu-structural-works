(async function () {
  const mount = document.getElementById('mCatGrid');
  if (!mount) return;

  try {
    const res = await fetch('data/categories.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to load categories.json');
    const cats = await res.json();

    mount.innerHTML = cats.map(c => {
      // モバイル優先リンク： series/<slug>/mobile.html があればそこへ
      // 今はSTRUCTUREだけ存在するので、他は通常の href を使う
      const mobileHref = `series/${c.slug}/mobile.html`;
      const fallback = c.href; // 既存 (例: series/structure/intro.html or series/structure/index.html)

      // STRUCTURE以外はまだmobile.htmlが無い前提 → fallbackへ
      const href = (c.slug === 'structure') ? mobileHref : fallback;

      const hasCover = Boolean(c.cover);
      return `
        <a class="mCard" href="${escapeHtml(href)}" aria-label="${escapeHtml(c.title)}">
          ${hasCover ? `<img class="mCard__img" src="${escapeHtml(c.cover)}" alt="" loading="lazy" decoding="async">` : ``}
          <div class="mCard__overlay" aria-hidden="true"></div>
          <div class="mCard__text">
            <div class="mCard__title">${escapeHtml(c.title)}</div>
            <div class="mCard__sub">${escapeHtml(c.subtitle || '')}</div>
            <div class="mCard__enter">ENTER →</div>
          </div>
        </a>
      `;
    }).join('');

  } catch (e) {
    mount.innerHTML = `<p style="padding:16px;opacity:.8">FAILED TO LOAD CATEGORIES.</p>`;
    console.error(e);
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

