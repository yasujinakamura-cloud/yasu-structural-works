import { c as createComponent, a as addAttribute, r as renderHead, b as renderScript, d as renderTemplate } from '../chunks/astro/server_C3xbjXms.mjs';
import 'piccolore';
import 'html-escaper';
import 'clsx';
export { renderers } from '../renderers.mjs';

const $$Mobile = createComponent(($$result, $$props, $$slots) => {
  const BASE = "/";
  const target = `${BASE}mobile/`;
  return renderTemplate`<html lang="en"> <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Redirecting…</title><meta http-equiv="refresh"${addAttribute(`0; url=${target}`, "content")}><link rel="canonical"${addAttribute(target, "href")}>${renderHead()}</head> <body> <p>Redirecting… <a${addAttribute(target, "href")}>Go to mobile</a></p> ${renderScript($$result, "/Users/nakamura_yasu/astro-yasu/src/pages/mobile.html.astro?astro&type=script&index=0&lang.ts")} </body> </html>`;
}, "/Users/nakamura_yasu/astro-yasu/src/pages/mobile.html.astro", void 0);
const $$file = "/Users/nakamura_yasu/astro-yasu/src/pages/mobile.html.astro";
const $$url = "/mobile.html";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Mobile,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
