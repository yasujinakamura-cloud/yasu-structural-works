async function loadSeries(name) {
  const res = await fetch(`../data/${name}.json`);
  const data = await res.json();

  document.getElementById("series-title").textContent = data.title;
  document.getElementById("series-statement").textContent = data.statement;

  const gallery = document.getElementById("gallery");

  data.images.forEach(file => {
    const img = document.createElement("img");
    img.src = `../images/${name}/${file}`;
    img.loading = "lazy";

    img.addEventListener("click", () => {
      openLightbox(img.src);
    });

    gallery.appendChild(img);
  });
}

/* ---------- Lightbox ---------- */

const lb = document.getElementById("lb");
const lbImg = document.getElementById("lbImg");
const lbClose = document.getElementById("lbClose");

function openLightbox(src) {
  lbImg.src = src;
  lb.hidden = false;
  document.body.style.overflow = "hidden";
}

lbClose.addEventListener("click", () => {
  lb.hidden = true;
  document.body.style.overflow = "";
});