import { productData } from "./data.js";
import { initCounter } from "./counter.js";
import { renderGallery } from "./gallery.js";
import { initPurchase } from "./purchase.js";
import { renderProductContent } from "./product-content.js";

document.addEventListener("DOMContentLoaded", () => {
  renderProductContent(productData);
  renderGallery(productData);
  initPurchase(productData);
  initCounter(productData.socialProof.mattressesDonated);
});
