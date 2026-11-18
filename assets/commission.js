/* commission.js
   - シリーズ画面用の "Commission a shoot" ブロックを生成
   - [data-copy-email] ボタンでアドレスをコピー（トップ・シリーズ共通）
*/
(function () {
  var EMAIL = "yasuji.nakamura@gmail.com";
  var BASE_SUBJECT = "Photography commission inquiry";

  if (!document.querySelector('link[href*="Cormorant"]')) {
    var f = document.createElement("link");
    f.rel = "stylesheet";
    f.href = "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600&display=swap";
    document.head.appendChild(f);
  }

  // 同じ場所の commission.css を読み込む（相対パスのページでも動く）
  try {
    var cur = document.currentScript;
    if (cur && cur.src && !document.querySelector('link[href*="commission.css"]')) {
      var link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = cur.src.replace(/commission\.js(\?.*)?$/, "commission.css$1");
      document.head.appendChild(link);
    }
  } catch (e) {}

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function mailto(seriesTitle) {
    var subject = seriesTitle ? BASE_SUBJECT + " - " + seriesTitle : BASE_SUBJECT;
    return "mailto:" + EMAIL + "?subject=" + encodeURIComponent(subject);
  }

  var uid = 0;
  function html(seriesTitle, opts) {
    opts = opts || {};
    var id = "cm" + ++uid;
    var title = esc(seriesTitle || "");
    return (
      '<section class="cm' + (opts.className ? " " + opts.className : "") + '" aria-labelledby="' + id + '">' +
      '<p class="cm__kicker">' + (title ? "End of " + title : "Photography commission") + "</p>" +
      '<h2 class="cm__title" id="' + id + '">Commission a shoot</h2>' +
      '<p class="cm__lede">Editorial, campaign and brand work in monochrome. Tell me about the story, format and timing.</p>' +
      '<a class="cm__btn" href="' + mailto(seriesTitle) + '">Commission a shoot <span aria-hidden="true">→</span></a>' +
      '<p class="cm__addr"><span class="cm__email">' + EMAIL + "</span>" +
      '<button class="cm__copy" type="button" data-copy-email>Copy</button>' +
      '<span class="cm__status" role="status" aria-live="polite"></span></p>' +
      "</section>"
    );
  }

  function fallbackCopy(text) {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.cssText = "position:fixed;left:-9999px;top:0;opacity:0";
    document.body.appendChild(ta);
    ta.select();
    var ok = false;
    try { ok = document.execCommand("copy"); } catch (e) {}
    document.body.removeChild(ta);
    return ok;
  }

  document.addEventListener("click", function (ev) {
    var btn = ev.target.closest && ev.target.closest("[data-copy-email]");
    if (!btn) return;
    var status = btn.parentNode.querySelector(".cm__status");
    var done = function (ok) {
      if (status) status.textContent = ok ? "Copied" : "Copy failed — select the address";
      btn.textContent = ok ? "Copied" : "Copy";
      window.setTimeout(function () {
        btn.textContent = "Copy";
        if (status) status.textContent = "";
      }, 2400);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(EMAIL).then(function () { done(true); }, function () { done(fallbackCopy(EMAIL)); });
    } else {
      done(fallbackCopy(EMAIL));
    }
  });

  window.Commission = { EMAIL: EMAIL, mailto: mailto, html: html };
})();
