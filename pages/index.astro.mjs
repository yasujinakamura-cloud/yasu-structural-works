import { c as createComponent, d as renderTemplate, b as renderScript, a as addAttribute, r as renderHead } from '../chunks/astro/server_C3xbjXms.mjs';
import 'piccolore';
import 'html-escaper';
import 'clsx';
export { renderers } from '../renderers.mjs';

const cats = [
	{
		slug: "structure",
		title: "STRUCTURE",
		subtitle: "RESISTANCE IN FORM",
		href: "series/structure/intro.html?v=20260223b",
		cover: "images/covers/structure.jpg"
	},
	{
		slug: "light",
		title: "LIGHT",
		subtitle: "FORCE AGAINST VOID",
		href: "series/light/intro.html",
		mobileHref: "series/light/mobile.html",
		cover: "images/covers/light.jpg"
	},
	{
		slug: "velocity",
		title: "VELOCITY",
		subtitle: "MOTION AS PRESSURE",
		href: "series/velocity/intro.html",
		mobileHref: "series/velocity/mobile.html",
		cover: "images/covers/velocity.jpg"
	},
	{
		slug: "nocturne",
		title: "NOCTURNE",
		subtitle: "SILENCE WITH TEETH",
		href: "series/nocturne/intro.html",
		mobileHref: "series/nocturne/mobile.html",
		cover: "images/covers/nocturne.jpg"
	}
];

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$Index = createComponent(($$result, $$props, $$slots) => {
  const title = "Yasu Nakamura — Monochrome Photography";
  const norm = cats.map((c) => {
    const href = String(c.href || "").replace(/\?.*$/, "");
    const mobileHref = c.mobileHref || href.replace(/\/intro\.html$/, "/mobile.html");
    return {
      slug: c.slug,
      title: c.title,
      subtitle: c.subtitle || "",
      cover: c.cover || "",
      href,
      mobileHref
    };
  });
  return renderTemplate(_a || (_a = __template(['<html lang="ja"> <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>', '</title><!-- NOTE: いったん現状維持（base対応は次ステップで） --><link rel="stylesheet"', ">", '</head> <body> <main id="siteMain"> <!-- HERO --> <section class="hero" aria-label="Hero statement"> <a class="hero__mail" href="mailto:yasuji.nakamura@gmail.com?subject=Portfolio%20Inquiry">\nCONTACT\n</a> <div class="hero__inner"> <h1 class="hero__statement"> <span>LIGHT IS FORCE.</span> <span>STRUCTURE IS RESISTANCE.</span> </h1> <p class="hero__sub">STUDIES IN LIGHT AND FORM</p> <p class="hero__credit">WORKS BY YASU NAKAMURA</p> <a class="hero__enter" href="#grid" aria-label="Enter gallery">\nENTER <span aria-hidden="true">→</span> </a> </div> <div class="hero__scroll" aria-hidden="true"> <span class="hero__scrollLine"></span> </div> </section> <!-- CATEGORY GRID --> <section id="grid" class="frontGrid" aria-label="Categories"> <div class="frontGrid__inner"> <div class="frontGrid__head"> <h2 class="frontGrid__title">CATEGORIES</h2> <p class="frontGrid__note">ENTER A SERIES.</p> </div> <div class="frontGrid__items"> ', " </div> </div> </section> </main> <script", " defer></script> ", " </body> </html>"])), title, addAttribute(`${"/"}assets/theme.css`, "href"), renderHead(), norm.map((c) => renderTemplate`<a class="catCard"${addAttribute(`${"/"}${c.href.replace(/^\/+/, "")}`, "href")}${addAttribute(c.slug, "data-slug")}${addAttribute(c.title, "aria-label")}> ${c.cover ? renderTemplate`<img class="catCard__img"${addAttribute(`${"/"}${c.cover.replace(/^\/+/, "")}`, "src")} alt="" loading="lazy" decoding="async">` : null} <div class="catCard__overlay" aria-hidden="true"></div> <div class="catCard__text"> <div class="catCard__title">${c.title}</div> <div class="catCard__sub">${c.subtitle}</div> <div class="catCard__enter">ENTER →</div> </div> </a>`), addAttribute(`${"/"}assets/app.js`, "src"), renderScript($$result, "/Users/nakamura_yasu/astro-yasu/src/pages/index.astro?astro&type=script&index=0&lang.ts"));
}, "/Users/nakamura_yasu/astro-yasu/src/pages/index.astro", void 0);
const $$file = "/Users/nakamura_yasu/astro-yasu/src/pages/index.astro";
const $$url = "";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
