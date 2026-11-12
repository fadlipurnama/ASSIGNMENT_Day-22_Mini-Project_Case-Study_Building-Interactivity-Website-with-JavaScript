import { $, $$ } from "./utils.js";

let imgIdx = 0;

export function renderGallery(productData) {
  const main = $("#gallery-main");
  const thumbs = $("#gallery-thumbs");
  const badge = $("#gallery-badge");
  const prev = $("#gal-prev");
  const next = $("#gal-next");
  if (!main || !thumbs) return;

  if (badge) badge.textContent = productData.promo.badge;
  thumbs.innerHTML = productData.images
    .map(
      (img, i) => `
    <div class="gallery-thumb${i === 0 ? " is-active" : ""}" role="listitem" data-i="${i}" tabindex="0" aria-label="${img.alt}">
      <img src="${img.src}" alt="${img.alt}" loading="lazy"/>
    </div>`,
    )
    .join("");

  setImg(0, productData);
  thumbs.addEventListener("click", (e) => {
    const thumb = e.target.closest(".gallery-thumb");
    if (thumb) setImg(Number(thumb.dataset.i), productData);
  });
  thumbs.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    const thumb = e.target.closest(".gallery-thumb");
    if (!thumb) return;
    e.preventDefault();
    setImg(Number(thumb.dataset.i), productData);
  });
  prev?.addEventListener("click", () =>
    setImg((imgIdx - 1 + productData.images.length) % productData.images.length, productData),
  );
  next?.addEventListener("click", () =>
    setImg((imgIdx + 1) % productData.images.length, productData),
  );
}

function setImg(index, productData) {
  const main = $("#gallery-main");
  const thumbs = $("#gallery-thumbs");
  if (!main) return;

  imgIdx = index;
  main.classList.add("fading");
  setTimeout(() => {
    main.src = productData.images[index].src;
    main.alt = productData.images[index].alt;
    main.classList.remove("fading");
  }, 150);
  $$(".gallery-thumb", thumbs).forEach((thumb, i) =>
    thumb.classList.toggle("is-active", i === index),
  );
}
