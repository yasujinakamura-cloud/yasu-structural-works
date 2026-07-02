/* Shared SEO helpers — Yasu Nakamura Photography */
(function (global) {
  const SITE_URL = "https://yasu-nakamura.com";
  const SITE_NAME = "Yasu Nakamura Photography";
  const AUTHOR_NAME = "Yasu Nakamura";
  const YOUTUBE_URL = "https://www.youtube.com/@YasuNakamura";

  const SERIES_DESC = {
    structure: "Monochrome architecture shot on Leica — geometry, tension, and resistance.",
    light: "Monochrome studies where light becomes force — Leica photography by Yasu Nakamura.",
    nocturne: "Night as structure — silence, shadow, and drift. Monochrome Leica work.",
    velocity: "Time in motion — color studies of speed and trace on Leica.",
  };

  const SERIES_SUBTITLE = {
    structure: "RESISTANCE IN FORM",
    light: "FORCE AGAINST VOID",
    nocturne: "SILENCE WITH TEETH",
    velocity: "MOTION AS PRESSURE",
  };

  function upsertMeta(selector, attrName, attrValue, content) {
    let el = document.querySelector(selector);
    if (!el) {
      el = document.createElement("meta");
      el.setAttribute(attrName, attrValue);
      document.head.appendChild(el);
    }
    el.setAttribute("content", content);
  }

  function upsertLink(rel, href) {
    let el = document.querySelector(`link[rel="${rel}"]`);
    if (!el) {
      el = document.createElement("link");
      el.setAttribute("rel", rel);
      document.head.appendChild(el);
    }
    el.setAttribute("href", href);
  }

  function upsertJsonLd(id, obj) {
    let el = document.getElementById(id);
    if (!el) {
      el = document.createElement("script");
      el.type = "application/ld+json";
      el.id = id;
      document.head.appendChild(el);
    }
    el.textContent = JSON.stringify(obj);
  }

  function normalizeGear(value) {
    return String(value || "").trim();
  }

  function formatGear(camera, lens) {
    const c = normalizeGear(camera);
    const l = normalizeGear(lens);
    if (c && l) return `${c}, ${l}`;
    return c || l || "";
  }

  function buildPhotoDescription(row, series, seriesTitle) {
    const statement = normalizeGear(row.statement);
    const gear = formatGear(row.camera, row.lens);
    const title = (seriesTitle || series || "").toUpperCase();
    const base = SERIES_DESC[series] || `Monochrome photography by ${AUTHOR_NAME}.`;

    if (statement && gear) {
      return `${statement} — ${gear}. ${title} series. ${AUTHOR_NAME}.`;
    }
    if (statement) {
      return `${statement} — ${title} series. Monochrome by ${AUTHOR_NAME}.`;
    }
    if (gear) {
      return `${gear}. ${title} — monochrome by ${AUTHOR_NAME}.`;
    }
    return base;
  }

  function buildPhotoTitle(seriesTitle, pageIndex) {
    const name = (seriesTitle || "").toUpperCase();
    const num = String(pageIndex + 1).padStart(2, "0");
    return `${name} ${num} | Leica Photography | ${AUTHOR_NAME}`;
  }

  function buildPhotoKeywords(row, series) {
    const words = ["Leica", "monochrome photography", "Yasu Nakamura"];
    const gear = formatGear(row.camera, row.lens);
    if (gear) words.push(gear);
    if (series) words.push(series);
    return words.join(", ");
  }

  function personSchema(extra) {
    return Object.assign(
      {
        "@type": "Person",
        name: AUTHOR_NAME,
        url: SITE_URL + "/",
        jobTitle: "Photographer",
        knowsAbout: [
          "Leica photography",
          "Monochrome photography",
          "Street photography",
          "Architectural photography",
        ],
        sameAs: [YOUTUBE_URL],
      },
      extra || {}
    );
  }

  function applyPhotoSeo(options) {
    const {
      series,
      seriesTitle,
      row,
      pageIndex,
      total,
      imageAbs,
      pageAbs,
    } = options;

    const title = buildPhotoTitle(seriesTitle || series, pageIndex);
    const description = buildPhotoDescription(row, series, seriesTitle);
    const photoName = `${(seriesTitle || series).toUpperCase()} ${String(pageIndex + 1).padStart(2, "0")}`;
    const seriesUrl = new URL(`./${series}-01.html`, pageAbs).href;

    document.title = title;

    upsertLink("canonical", pageAbs);
    upsertMeta('meta[name="description"]', "name", "description", description);
    upsertMeta('meta[property="og:type"]', "property", "og:type", "article");
    upsertMeta('meta[property="og:site_name"]', "property", "og:site_name", SITE_NAME);
    upsertMeta('meta[property="og:title"]', "property", "og:title", title);
    upsertMeta('meta[property="og:description"]', "property", "og:description", description);
    upsertMeta('meta[property="og:url"]', "property", "og:url", pageAbs);
    upsertMeta('meta[property="og:image"]', "property", "og:image", imageAbs);
    upsertMeta('meta[name="twitter:card"]', "name", "twitter:card", "summary_large_image");
    upsertMeta('meta[name="twitter:title"]', "name", "twitter:title", title);
    upsertMeta('meta[name="twitter:description"]', "name", "twitter:description", description);
    upsertMeta('meta[name="twitter:image"]', "name", "twitter:image", imageAbs);

    upsertJsonLd("ld-photo", {
      "@context": "https://schema.org",
      "@type": "Photograph",
      name: photoName,
      description,
      image: imageAbs,
      url: pageAbs,
      keywords: buildPhotoKeywords(row, series),
      mainEntityOfPage: pageAbs,
      author: personSchema(),
      isPartOf: {
        "@type": "CollectionPage",
        name: (seriesTitle || series).toUpperCase(),
        url: seriesUrl,
      },
    });

    upsertJsonLd("ld-breadcrumb", {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: SITE_URL + "/",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: (seriesTitle || series).toUpperCase(),
          item: seriesUrl,
        },
        {
          "@type": "ListItem",
          position: 3,
          name: photoName,
          item: pageAbs,
        },
      ],
    });

    return { title, description, photoName };
  }

  global.SiteSeo = {
    SITE_URL,
    SITE_NAME,
    AUTHOR_NAME,
    YOUTUBE_URL,
    SERIES_DESC,
    SERIES_SUBTITLE,
    upsertMeta,
    upsertLink,
    upsertJsonLd,
    personSchema,
    buildPhotoDescription,
    buildPhotoTitle,
    applyPhotoSeo,
    formatGear,
  };
})(window);
