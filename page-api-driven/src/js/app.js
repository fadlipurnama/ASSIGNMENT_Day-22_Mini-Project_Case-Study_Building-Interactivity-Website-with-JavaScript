/**
 * app.js — Leesa Adjustable Chill Pillow Detail Page
 * Vanilla JS ES Modules | Integrasi API backend
 *
 * Pola arsitektur:
 *  1. init() fetch data dari API (atau fallback lokal)
 *  2. Data diteruskan sebagai parameter ke setiap fungsi render
 *  3. Tidak ada akses global productData — semua data mengalir top-down
 */
'use strict';

import { fetchProductById } from './api.js';
import { localData } from './data.js';
import { PRODUCT_ID } from './config.js';

// ─── Helper ───────────────────────────────────────────────────────────────────
const $  = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
// Ganti ke 'while' untuk membandingkan implementasi loop; jalankan satu mode saja.
const UNIT_LOOP_MODE = 'for';

/** Format harga dengan Intl.NumberFormat sesuai currency dari API */
function formatPrice(amount, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency, maximumFractionDigits: 0,
  }).format(amount);
}

/** Escape string aman untuk textContent (hindari XSS via innerHTML) */
function esc(str) {
  return String(str ?? '');
}

// ─── UI State (terpisah dari data API) ────────────────────────────────────────
const UI = {
  sizeIdx:  0,     // index variant size yang aktif
  colorIdx: -1,    // -1 = tidak ada warna
  qty:      1,     // pilihan qty pembelian pengguna
  imgIdx:   0,     // gambar aktif di gallery
};

let remainingTotalStock = null;
let remainingVariantStocks = new Map();

// ─── Loading / Error / Content state ─────────────────────────────────────────
function showLoading() {
  $('#page-loading').hidden = false;
  $('#page-error').hidden   = true;
  $('#page-content').hidden = true;
}

function showError(message) {
  $('#page-loading').hidden = true;
  $('#page-error').hidden   = false;
  $('#page-content').hidden = true;
  const desc = $('#error-desc');
  if (desc) desc.textContent = esc(message);
}

function showContent() {
  $('#page-loading').hidden = true;
  $('#page-error').hidden   = true;
  $('#page-content').hidden = false;
}

// ─── TOP BAR ─────────────────────────────────────────────────────────────────
function renderTopBar() {
  const { promo, topBar } = localData;
  const link = $('#top-bar-promo-link');
  const nav  = $('#top-bar-nav');
  const btn  = $('#top-bar-details');

  if (link) link.textContent = esc(promo.message);
  if (nav)  nav.innerHTML = topBar
    .map(i => `<li><a href="${esc(i.href)}">${esc(i.label)}</a></li>`)
    .join('');
  btn?.addEventListener('click', () => alert('Promo details: ' + promo.message));
}

// ─── NAV ─────────────────────────────────────────────────────────────────────
function renderNav() {
  const dl = $('#main-nav-list');
  const ml = $('#mobile-nav-list');
  const hb = $('#hamburger-btn');
  const mn = $('#mobile-nav');

  const items = localData.nav
    .map(i => `<li><a href="${esc(i.href)}"${i.highlight ? ' class="nav-sale"' : ''}>${esc(i.label)}</a></li>`)
    .join('');

  if (dl) dl.innerHTML = items;
  if (ml) ml.innerHTML = items;

  if (hb && mn) {
    hb.addEventListener('click', () => {
      const isOpen = mn.hasAttribute('hidden');
      mn.toggleAttribute('hidden');
      hb.classList.toggle('is-open', isOpen);
      hb.setAttribute('aria-expanded', String(isOpen));
    });
  }
}

// ─── BREADCRUMB ───────────────────────────────────────────────────────────────
function renderBreadcrumb(product) {
  const ol = $('#breadcrumb-list');
  if (!ol) return;

  // Breadcrumb statis + nama produk dari API sebagai item terakhir
  const crumbs = [...localData.breadcrumb, { label: product.name, href: null }];

  ol.innerHTML = crumbs.map((b, i, a) => {
    const last = i === a.length - 1;
    const sep  = !last ? `<span class="bc-sep" aria-hidden="true">/</span>` : '';
    return `<li>${
      last
        ? `<span aria-current="page">${esc(b.label)}</span>`
        : `<a href="${esc(b.href)}">${esc(b.label)}</a>`
    }${sep}</li>`;
  }).join('');
}

// ─── GALLERY ─────────────────────────────────────────────────────────────────
function renderGallery(product) {
  const main   = $('#gallery-main');
  const thumbs = $('#gallery-thumbs');
  const badge  = $('#gallery-badge');
  const prev   = $('#gal-prev');
  const next   = $('#gal-next');
  if (!main || !thumbs) return;

  if (badge) badge.textContent = esc(localData.promo.badge);

  const images = product.images.length ? product.images : [{ url: product.image, alt: product.name, position: 0 }];

  thumbs.innerHTML = images.map((img, i) => `
    <div class="gallery-thumb${i === 0 ? ' is-active' : ''}" role="listitem"
         data-i="${i}" tabindex="0" aria-label="${esc(img.alt)}">
      <img src="${esc(img.url)}" alt="${esc(img.alt)}" loading="lazy"/>
    </div>`).join('');

  setImg(0, images);

  thumbs.addEventListener('click', e => {
    const t = e.target.closest('.gallery-thumb');
    if (t) setImg(+t.dataset.i, images);
  });
  thumbs.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      const t = e.target.closest('.gallery-thumb');
      if (t) { e.preventDefault(); setImg(+t.dataset.i, images); }
    }
  });
  prev?.addEventListener('click', () => setImg((UI.imgIdx - 1 + images.length) % images.length, images));
  next?.addEventListener('click', () => setImg((UI.imgIdx + 1) % images.length, images));
}

function setImg(i, images) {
  const main   = $('#gallery-main');
  const thumbs = $('#gallery-thumbs');
  if (!main) return;
  UI.imgIdx = i;
  main.classList.add('fading');
  setTimeout(() => {
    main.src = esc(images[i].url);
    main.alt = esc(images[i].alt);
    main.classList.remove('fading');
  }, 150);
  $$('.gallery-thumb', thumbs).forEach((t, j) => t.classList.toggle('is-active', j === i));
}

// ─── TITLE ───────────────────────────────────────────────────────────────────
function renderTitle(product) {
  const el = $('#product-title');
  if (el) el.textContent = esc(product.name);
}

// ─── TABS (data lokal) ────────────────────────────────────────────────────────
function renderTabs() {
  const map = { benefits: 'panel-benefits', bestFor: 'panel-bestfor', bonuses: 'panel-bonuses' };

  Object.entries(map).forEach(([key, panelId]) => {
    const p = $(`#${panelId}`);
    if (p) p.innerHTML = (localData.tabs[key] || []).map(x => `<li>${esc(x)}</li>`).join('');
  });

  $$('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.tab-btn').forEach(b => { b.classList.remove('tab-btn--active'); b.setAttribute('aria-selected', 'false'); });
      $$('.tab-panel').forEach(p => { p.classList.remove('tab-panel--active'); p.hidden = true; });
      btn.classList.add('tab-btn--active');
      btn.setAttribute('aria-selected', 'true');
      const panel = $(`#${map[btn.dataset.tab]}`);
      if (panel) { panel.classList.add('tab-panel--active'); panel.hidden = false; }
    });
  });
}

// ─── PRICE ───────────────────────────────────────────────────────────────────
function getNumericPrice(product) {
  return Number(product.price) || 0;
}

function renderPrice(product) {
  const currency = product.currency || 'USD';
  const b  = $('#price-badge');
  const s  = $('#price-sale');
  const o  = $('#price-orig');
  const sv = $('#price-save');
  const numericPrice = getNumericPrice(product);

  if (b) b.textContent  = esc(product.promo?.badge || localData.promo.badge || '');
  if (s) s.textContent  = formatPrice(numericPrice, currency);
  if (o) {
    const original = Number(product.originalPrice) || 0;
    if (original && original > numericPrice) {
      o.textContent = formatPrice(original, currency);
      o.hidden = false;
    } else {
      o.textContent = '';
      o.hidden = true;
    }
  }
  if (sv) {
    const save = product.promo?.save ?? localData.promo.save;
    sv.textContent = save ? `Save ${formatPrice(Number(save) || 0, currency)}` : '';
  }
}

// ─── SIZE SELECTOR ────────────────────────────────────────────────────────────
function renderSizeSelector(product) {
  const ss = $('#size-select');
  if (!ss) return;
  const sizes = product.variants?.size ?? [];

  if (!sizes.length) {
    UI.sizeIdx = -1;
    $('#size-row')?.setAttribute('hidden', '');
    return;
  }
  if (!Number.isInteger(UI.sizeIdx) || UI.sizeIdx < 0 || UI.sizeIdx >= sizes.length) {
    UI.sizeIdx = 0;
  }
  $('#size-row')?.removeAttribute('hidden');
  ss.innerHTML = sizes
    .map((s, i) => `<option value="${i}"${i === UI.sizeIdx ? ' selected' : ''}>${esc(s)}</option>`)
    .join('');
  ss.value = String(UI.sizeIdx);
}

// ─── COLOR SELECTOR ───────────────────────────────────────────────────────────
// Ditampilkan hanya jika API memberikan data warna (variants.color.length > 0)
function renderColorSelector(product) {
  const colorRow    = $('#color-row');
  const swatchWrap  = $('#color-swatches');
  const colors      = product.variants?.color ?? [];

  if (!colorRow || !colors.length) {
    UI.colorIdx = -1;
    colorRow?.setAttribute('hidden', '');
    return;
  }

  colorRow.removeAttribute('hidden');
  UI.colorIdx = 0;

  // Palet warna sederhana — fallback ke warna CSS named colors
  const palette = { white: '#ffffff', black: '#111111', gray: '#888888', blue: '#4a90d9', green: '#2D6A4F', beige: '#f5f0e8' };

  swatchWrap.innerHTML = colors.map((color, i) => {
    const bg = palette[color.toLowerCase()] || '#cccccc';
    return `<button class="color-swatch${i === 0 ? ' is-active' : ''}"
      data-color-idx="${i}"
      aria-label="${esc(color)}"
      aria-pressed="${i === 0}"
      title="${esc(color)}"
      style="background:${bg};border-color:${i === 0 ? 'var(--green-dark)' : 'transparent'}">
    </button>`;
  }).join('');

  swatchWrap.addEventListener('click', e => {
    const btn = e.target.closest('.color-swatch');
    if (!btn) return;
    UI.colorIdx = +btn.dataset.colorIdx;
    $$('.color-swatch', swatchWrap).forEach((b, j) => {
      b.classList.toggle('is-active', j === UI.colorIdx);
      b.setAttribute('aria-pressed', String(j === UI.colorIdx));
      b.style.borderColor = j === UI.colorIdx ? 'var(--green-dark)' : 'transparent';
    });
    $('#unitList')?.replaceChildren();
    renderQtySelector(product);
    const quantityState = validateQuantity(product);
    if (quantityState.valid) clearValidation();
    else showValidation(quantityState.message);
    syncAtcLabel(product);
  });
}

// ─── QTY SELECTOR ─────────────────────────────────────────────────────────────
/**
 * Ambil stok varian yang sedang aktif.
 * Kalau backend kirim _raw (array of variant objects), cari varian yang sesuai
 * dengan pilihan size dan color aktif. Fallback ke quantity total.
 */
function getActiveVariantStock(product) {
  const raw    = product.variants?._raw;
  const sizes  = product.variants?.size ?? [];
  const colors = product.variants?.color ?? [];

  if (Array.isArray(raw) && raw.length) {
    const activeSize  = sizes[UI.sizeIdx]  ?? null;
    const activeColor = colors[UI.colorIdx] ?? null;
    const matches = raw
      .map((variant, index) => ({ variant, index }))
      .filter(({ variant }) =>
        (!activeSize || variant.size === activeSize)
        && (!activeColor || variant.color === activeColor)
      );
    if (!activeSize && !activeColor && remainingTotalStock !== null) {
      return remainingTotalStock;
    }
    if (!matches.length) return 0;

    const quantities = matches.map(({ variant, index }) =>
      remainingVariantStocks.has(index)
        ? remainingVariantStocks.get(index)
        : toStock(variant.quantity)
    );
    if (quantities.some(quantity => quantity === null)) return null;
    return quantities.reduce((total, quantity) => total + quantity, 0);
  }

  return remainingTotalStock ?? toStock(product.variants?.quantity);
}

function toStock(value) {
  if (value === null || value === undefined || value === '') return null;
  const stock = Number(value);
  return Number.isInteger(stock) && stock >= 0 ? stock : null;
}

function initializeLocalStock(product) {
  remainingTotalStock = toStock(product.variants?.quantity);
  const raw = product.variants?._raw;
  remainingVariantStocks = new Map(
    Array.isArray(raw)
      ? raw.map((variant, index) => [index, toStock(variant.quantity)])
      : [],
  );
}

function consumeSelectedStock(product, quantity) {
  const raw = product.variants?._raw;
  if (!Array.isArray(raw) || !raw.length) {
    if (remainingTotalStock === null || quantity > remainingTotalStock) return false;
    remainingTotalStock -= quantity;
    return true;
  }

  const sizes = product.variants?.size ?? [];
  const colors = product.variants?.color ?? [];
  const activeSize = sizes[UI.sizeIdx] ?? null;
  const activeColor = colors[UI.colorIdx] ?? null;
  if (!activeSize && !activeColor) {
    if (remainingTotalStock === null || quantity > remainingTotalStock) return false;
    remainingTotalStock -= quantity;
    return true;
  }

  const matches = raw
    .map((variant, index) => ({ variant, index }))
    .filter(({ variant }) =>
      (!activeSize || variant.size === activeSize)
      && (!activeColor || variant.color === activeColor)
    );

  const available = matches.map(({ variant, index }) =>
    remainingVariantStocks.has(index)
      ? remainingVariantStocks.get(index)
      : toStock(variant.quantity)
  );
  if (
    !matches.length
    || available.some((stock) => stock === null)
    || available.reduce((total, stock) => total + stock, 0) < quantity
  ) {
    return false;
  }

  let quantityLeft = quantity;
  for (let index = 0; index < matches.length && quantityLeft > 0; index += 1) {
    const stock = available[index];
    const taken = Math.min(stock, quantityLeft);
    remainingVariantStocks.set(matches[index].index, stock - taken);
    quantityLeft -= taken;
  }

  return quantityLeft === 0;
}

function renderQtySelector(product) {
  const qs = $('#qty-select');
  if (!qs) return;

  const selection = resolveSelectedVariant(product);
  qs.min = '1';
  qs.step = '1';
  if (selection.valid && selection.stock !== null) {
    qs.max = String(selection.stock);
  } else {
    qs.removeAttribute('max');
  }
  qs.disabled = selection.valid && selection.stock === 0;
  if (selection.valid && selection.stock === 0) UI.qty = 0;
  else if (!Number.isInteger(UI.qty) || UI.qty < 1) UI.qty = 1;

  qs.value = String(UI.qty);
  syncPurchaseSummary(product);
}

function resolveSelectedVariant(product) {
  const sizes = product.variants?.size ?? [];
  const colors = product.variants?.color ?? [];
  let size = '';

  switch (UI.sizeIdx) {
    case -1:
      if (sizes.length) return { valid: false, message: 'Pilihan ukuran tidak valid.' };
      break;
    default:
      if (!Number.isInteger(UI.sizeIdx) || !sizes[UI.sizeIdx]) {
        return { valid: false, message: 'Pilihan ukuran tidak valid.' };
      }
      size = sizes[UI.sizeIdx];
      break;
  }

  let color = '';
  if (colors.length) {
    if (!Number.isInteger(UI.colorIdx) || !colors[UI.colorIdx]) {
      return { valid: false, message: 'Pilihan warna tidak valid.' };
    }
    color = colors[UI.colorIdx];
  }

  return {
    valid: true,
    size,
    color,
    label: [size, color].filter(Boolean).join(' / ') || product.name,
    stock: getActiveVariantStock(product),
  };
}

function validateQuantity(product) {
  const selection = resolveSelectedVariant(product);
  if (!selection.valid) {
    return { valid: false, message: selection.message };
  }

  if (selection.stock === null) {
    return { valid: false, message: 'Informasi stok tidak tersedia dari API.' };
  }
  if (selection.stock === 0) {
    return { valid: false, message: `Varian ${selection.label} sedang habis.` };
  }

  const qtyInput = $('#qty-select');
  if (!qtyInput || qtyInput.value.trim() === '') {
    return { valid: false, message: 'Masukkan quantity berupa bilangan bulat positif.' };
  }

  const quantity = Number(qtyInput.value);
  if (!Number.isFinite(quantity) || !Number.isInteger(quantity) || quantity <= 0) {
    return { valid: false, message: 'Jumlah harus berupa bilangan bulat positif.' };
  }
  if (quantity > selection.stock) {
    return {
      valid: false,
      message: `Jumlah melebihi stok ${selection.label}. Stok tersedia: ${selection.stock}.`,
    };
  }
  if (!qtyInput.checkValidity()) {
    return { valid: false, message: 'Quantity tidak memenuhi batas input.' };
  }

  return { valid: true, quantity, message: '' };
}

function syncPurchaseSummary(product) {
  const selection = resolveSelectedVariant(product);
  const quantityState = validateQuantity(product);
  const variantEl = $('#summary-variant');
  const quantityEl = $('#summary-qty');
  const subtotalEl = $('#summary-subtotal');
  const stockInfo = $('.stock-info');
  const numericPrice = Number(product.price);

  if (variantEl) variantEl.textContent = selection.valid ? selection.label : '—';
  if (quantityEl) quantityEl.textContent = quantityState.valid ? String(quantityState.quantity) : '—';
  if (subtotalEl) {
    subtotalEl.textContent = quantityState.valid && Number.isFinite(numericPrice)
      ? formatPrice(numericPrice * quantityState.quantity, product.currency)
      : '—';
  }
  if (stockInfo) {
    const isOutOfStock = selection.valid && selection.stock === 0;
    stockInfo.textContent = !selection.valid || selection.stock === null
      ? 'Stock information unavailable'
      : isOutOfStock
        ? `Stock: 0 — ${selection.label} out of stock`
        : `Stock: ${selection.stock}`;
    stockInfo.classList.toggle('is-out-of-stock', isOutOfStock);
  }
  syncAtcLabel(product);
}

function renderOrderUnits(unitList, variantName, quantity) {
  const addUnit = unit => {
    const item = document.createElement('li');
    item.textContent = `${variantName} — Unit ${unit}`;
    unitList.append(item);
  };

  switch (UNIT_LOOP_MODE) {
    case 'for':
      for (let unit = 1; unit <= quantity; unit += 1) addUnit(unit);
      break;
    case 'while': {
      let unit = 1;
      while (unit <= quantity) {
        addUnit(unit);
        unit += 1;
      }
      break;
    }
    default:
      throw new Error(`Unsupported unit loop mode: ${UNIT_LOOP_MODE}`);
  }
}

function processOrder(product) {
  const unitList = $('#unitList');
  unitList?.replaceChildren();
  clearValidation();

  const selection = resolveSelectedVariant(product);
  if (!selection.valid) {
    showValidation(selection.message);
    return false;
  }

  const quantityState = validateQuantity(product);
  if (!quantityState.valid) {
    showValidation(quantityState.message);
    return false;
  }

  const price = Number(product.price);
  if (!Number.isFinite(price) || price <= 0) {
    showValidation('Harga produk tidak valid.');
    return false;
  }

  const subtotal = price * quantityState.quantity;
  const subtotalEl = $('#summary-subtotal');
  if (subtotalEl) subtotalEl.textContent = formatPrice(subtotal, product.currency);
  if (unitList) renderOrderUnits(unitList, selection.label, quantityState.quantity);
  return true;
}

// ─── ATC BUTTON ──────────────────────────────────────────────────────────────
function syncAtcLabel(product) {
  const btn   = $('#atc-btn');
  if (!btn || btn.dataset.added === 'true') return;

  const selection = resolveSelectedVariant(product);
  if (!selection.valid) {
    btn.textContent = 'Choose a valid variant';
    btn.disabled = false;
    return;
  }

  if (selection.stock === null) {
    btn.textContent = 'Stock information unavailable';
    btn.disabled = false;
    return;
  }
  if (selection.stock === 0) {
    btn.textContent = `${selection.label} out of stock`;
    btn.disabled = true;
    return;
  }

  const quantityState = validateQuantity(product);
  if (!quantityState.valid) {
    btn.textContent = 'Enter a valid quantity';
    btn.disabled = false;
    return;
  }

  btn.disabled = false;
  const subtotal = Number(product.price) * quantityState.quantity;
  btn.textContent = `Add ${quantityState.quantity}x ${esc(selection.label)} to Cart — ${formatPrice(subtotal, product.currency)}`;
}

// ─── STICKY BAR ──────────────────────────────────────────────────────────────
function renderStickyBar(product) {
  const bar    = $('#sticky-bar');
  const anchor = $('#atc-section');
  const sn     = $('#sticky-name');
  const sm     = $('#sticky-meta');
  const satc   = $('#sticky-atc');
  if (!bar || !anchor) return;

  if (sn) sn.textContent = esc(product.name);
  syncStickyMeta(product);

  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      bar.classList.toggle('is-visible', !e.isIntersecting);
      bar.setAttribute('aria-hidden', String(e.isIntersecting));
    });
  }, { threshold: 0.1 });
  obs.observe(anchor);

  satc?.addEventListener('click', () => doAddToCart(product, true));
}

function syncStickyMeta(product) {
  const sm    = $('#sticky-meta');
  const sizes = product.variants?.size ?? [];
  if (sm) {
    const sizePart = sizes[UI.sizeIdx] ? `${sizes[UI.sizeIdx]} · ` : '';
    sm.textContent = `${sizePart}${formatPrice(product.price, product.currency)}`;
  }
}

// ─── NEED HELP ────────────────────────────────────────────────────────────────
function renderNeedHelp() {
  const nh = localData.needHelp;
  const t  = $('#need-help-title');
  const d  = $('#need-help-desc');
  const c  = $('#need-help-chat');
  if (t) t.textContent = esc(nh.title);
  if (d) d.textContent = esc(nh.desc);
  if (c) { c.textContent = esc(nh.chatLabel); c.addEventListener('click', () => alert('Opening chat…')); }
}

// ─── FEATURES (data lokal) ────────────────────────────────────────────────────
function renderFeatures() {
  const g = $('#features-grid');
  if (!g) return;

  const icons = {
    'icon-pressure': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/></svg>',
    'icon-snap':     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>',
    'icon-mesh':     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 3C7 3 3 7 3 12s4 9 9 9 9-4 9-9-4-9-9-9zm0 0v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6 5.6 18.4"/></svg>',
  };

  g.innerHTML = localData.features.map(f => `
    <article class="feature-card">
      <div class="feature-icon-wrap">${icons[f.svgId] || ''}</div>
      <h3 class="feature-title">${esc(f.title)}</h3>
      <p class="feature-desc">${esc(f.desc)}</p>
    </article>`).join('');
}

// ─── DETAIL SECTIONS (data lokal) ─────────────────────────────────────────────
function renderDetail() {
  const c = $('#detail-container');
  if (!c) return;
  c.innerHTML = localData.detailSections.map(s => `
    <div class="detail-pair${s.reverse ? ' is-reverse' : ''}">
      <div class="detail-img-wrap"><img src="${esc(s.image)}" alt="${esc(s.imageAlt)}" loading="lazy"/></div>
      <div class="detail-text"><h3>${esc(s.title)}</h3><p>${esc(s.desc)}</p></div>
    </div>`).join('');
}

// ─── FAQ ACCORDION (data lokal) ───────────────────────────────────────────────
function renderFaq() {
  const acc = $('#accordion');
  if (!acc) return;
  const sp = localData.specifications;
  const sh = localData.shipping;

  acc.innerHTML = localData.faq.map((item, i) => {
    let body = '';

    if (item.isSpecs) {
      // Tabel spesifikasi — teks statis, tidak dari API
      body = `<table class="specs-table" aria-label="Spesifikasi produk"><tbody>
        <tr><th>Size Queen</th><td>${esc(sp.size.Queen)}</td></tr>
        <tr><th>Size King</th><td>${esc(sp.size.King)}</td></tr>
        <tr class="specs-section"><th colspan="2">Materials</th></tr>
        <tr><th>Cover</th><td>${esc(sp.materials.cover)}</td></tr>
        <tr><th>Fill Cover</th><td>${esc(sp.materials.fillCover)}</td></tr>
        <tr><th>Fill</th><td>${esc(sp.materials.fill)}</td></tr>
        <tr><th>Fill Weight King</th><td>${esc(sp.fillWeight.King)}</td></tr>
        <tr><th>Fill Weight Queen</th><td>${esc(sp.fillWeight.Queen)}</td></tr>
        <tr class="specs-section"><th colspan="2">Care</th></tr>
        <tr><th>Outer Cover</th><td>${esc(sp.care.outerCover)}</td></tr>
        <tr><th>Fill Cover</th><td>${esc(sp.care.fillCover)}</td></tr>
        <tr><th>Fill</th><td><strong>${esc(sp.care.fill)}</strong></td></tr>
      </tbody></table>
      <p style="margin-top:12px;font-size:12px;color:#666">${esc(sp.certification)}</p>`;

    } else if (item.isShipping) {
      body = `<div class="ship-grid">
        <div class="ship-card"><div class="ship-icon">🚚</div><h4>Free Shipping</h4><p>${esc(sh.shippingNote)}</p></div>
        <div class="ship-card"><div class="ship-icon">🛡️</div><h4>${esc(sh.warranty)} Limited Warranty</h4><p>${esc(sh.warrantyNote)}</p></div>
        <div class="ship-card"><div class="ship-icon">↩️</div><h4>${esc(sh.trial)} Risk-Free Trial</h4><p>${esc(sh.trialNote)}</p></div>
      </div>`;

    } else {
      body = `<p>${esc(item.a)}</p>`;
    }

    return `<div class="acc-item" data-idx="${i}">
      <button class="acc-btn" aria-expanded="false" aria-controls="acc-body-${i}">
        <span>${esc(item.q)}</span><span class="acc-icon" aria-hidden="true"></span>
      </button>
      <div class="acc-body" id="acc-body-${i}" role="region">
        <div class="acc-content">${body}</div>
      </div>
    </div>`;
  }).join('');

  acc.addEventListener('click', e => {
    const btn = e.target.closest('.acc-btn');
    if (!btn) return;
    const item    = btn.closest('.acc-item');
    const body    = $('.acc-body', item);
    const wasOpen = item.classList.contains('is-open');

    // Tutup semua
    $$('.acc-item.is-open', acc).forEach(el => {
      el.classList.remove('is-open');
      $('.acc-body', el).classList.remove('is-open');
      $('.acc-btn', el).setAttribute('aria-expanded', 'false');
    });

    if (!wasOpen) {
      item.classList.add('is-open');
      body.classList.add('is-open');
      btn.setAttribute('aria-expanded', 'true');
    }
  });
}

// ─── SOCIAL PROOF (data lokal) ────────────────────────────────────────────────
function renderSocialProof() {
  const h = $('#social-heading');
  const d = $('#social-desc');
  if (h) h.textContent = esc(localData.socialProof.heading);
  if (d) d.textContent = esc(localData.socialProof.description);
}

// ─── FOOTER (data lokal) ─────────────────────────────────────────────────────
function renderFooter() {
  const ft = localData.footer;
  [['f-shop', ft.shop], ['f-about', ft.about], ['f-support', ft.support]].forEach(([id, items]) => {
    const el = $(`#${id}`);
    if (el) el.innerHTML = items.map(i => `<li><a href="${esc(i.href)}">${esc(i.label)}</a></li>`).join('');
  });

  const fh = $('#f-hours');
  const fp = $('#f-phone');
  const fc = $('#f-copy');
  const fl = $('#f-legal');
  if (fh) fh.textContent = ft.hours;
  if (fp) { fp.textContent = '1.844.33.LEESA'; fp.href = 'tel:18443353372'; }
  if (fc) fc.textContent  = ft.copyright;
  if (fl) fl.innerHTML    = ft.legal.map(l => `<li><a href="${esc(l.href)}">${esc(l.label)}</a></li>`).join('');

  const sl = $('#social-links');
  if (sl) sl.innerHTML = ft.social
    .map(s => `<a href="${esc(s.href)}" class="social-link" aria-label="${esc(s.label)}" rel="noopener noreferrer">${s.svg}</a>`)
    .join('');

  // Newsletter
  const btn = $('#nl-btn');
  const inp = $('#nl-email');
  const msg = $('#nl-msg');
  if (btn && inp) {
    const send = () => {
      const v  = inp.value.trim();
      const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      msg.hidden = false;
      if (ok) {
        msg.textContent = `✓ Thanks! ${v} subscribed.`;
        msg.className   = 'nl-msg ok';
        inp.value       = '';
      } else {
        msg.textContent = 'Please enter a valid email.';
        msg.className   = 'nl-msg err';
      }
    };
    btn.addEventListener('click', send);
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') send(); });
  }
}

// ─── COUNTER ANIMATION ────────────────────────────────────────────────────────
function initCounter() {
  const el = $('#counter-num');
  if (!el) return;
  const target = localData.socialProof.mattressesDonated;
  el.dataset.target = target;
  let done = false;

  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting && !done) {
        done = true;
        animateCount(el, 0, target, 2000);
      }
    });
  }, { threshold: 0.3 });
  obs.observe(el);
}

function animateCount(el, from, to, dur) {
  const t0   = performance.now();
  const step = ts => {
    const p = Math.min((ts - t0) / dur, 1);
    const e = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.floor(from + (to - from) * e).toLocaleString() + '+';
    if (p < 1) requestAnimationFrame(step);
    else el.textContent = to.toLocaleString() + '+';
  };
  requestAnimationFrame(step);
}

// ─── ADD TO CART ─────────────────────────────────────────────────────────────
function doAddToCart(product, fromSticky = false) {
  if (!processOrder(product)) return;
  const quantity = Number($('#qty-select').value);
  const selection = resolveSelectedVariant(product);
  if (!consumeSelectedStock(product, quantity)) {
    $('#unitList')?.replaceChildren();
    syncPurchaseSummary(product);
    showValidation('Stok berubah atau tidak cukup. Periksa kembali jumlah yang dipilih.');
    return;
  }
  UI.qty = selection.stock - quantity > 0 ? 1 : 0;
  $('#unitList')?.replaceChildren();
  renderQtySelector(product);
  const ab       = $('#atc-btn');
  const sa       = $('#sticky-atc');

  if (!fromSticky && ab) {
    ab.dataset.added = 'true';
    ab.textContent   = `✓ Added ${quantity}x ${selection.label} to cart!`;
    ab.classList.add('is-added');
    ab.disabled = true;
    setTimeout(() => {
      ab.dataset.added = '';
      ab.classList.remove('is-added');
      ab.disabled = false;
      syncAtcLabel(product);
    }, 2500);
  }

  if (fromSticky && sa) {
    const orig = sa.textContent;
    sa.textContent = '✓ Added!';
    sa.disabled    = true;
    setTimeout(() => { sa.textContent = orig; sa.disabled = false; }, 2000);
  }

  console.info(`[Cart] ${quantity}x ${selection.label} ${product.name} — subtotal ${formatPrice(Number(product.price) * quantity, product.currency)}`);
}

function showValidation(msg) {
  const v = $('#atc-validation');
  if (v) { v.textContent = esc(msg); v.hidden = false; }
}
function clearValidation() {
  const v = $('#atc-validation');
  if (v) { v.textContent = ''; v.hidden = true; }
}

// ─── EVENT HANDLERS (size, color, qty, ATC) ──────────────────────────────────
function initHandlers(product) {
  const ss = $('#size-select');
  const qs = $('#qty-select');
  const ab = $('#atc-btn');

  ss?.addEventListener('change', e => {
    UI.sizeIdx = e.target.value === '' ? NaN : Number(e.target.value);
    UI.qty = 1;
    if (qs) qs.value = '1';
    $('#unitList')?.replaceChildren();
    clearValidation();
    renderPrice(product);
    renderQtySelector(product);
    syncStickyMeta(product);
    syncAtcLabel(product);
    syncPurchaseSummary(product);
  });

  qs?.addEventListener('change', e => {
    $('#unitList')?.replaceChildren();
    const quantityState = validateQuantity(product);
    if (quantityState.valid) clearValidation();
    else showValidation(quantityState.message);
    syncPurchaseSummary(product);
  });
  qs?.addEventListener('input', e => {
    const quantityState = validateQuantity(product);
    if (quantityState.valid) {
      UI.qty = quantityState.quantity;
      clearValidation();
    } else {
      showValidation(quantityState.message);
    }
    $('#unitList')?.replaceChildren();
    syncPurchaseSummary(product);
  });

  ab?.addEventListener('click', () => doAddToCart(product, false));
}

// ─── RENDER ALL (entry point setelah data siap) ───────────────────────────────
function renderAll(product) {
  initializeLocalStock(product);
  renderTopBar();
  renderNav();
  renderBreadcrumb(product);
  renderGallery(product);
  renderTitle(product);
  renderTabs();
  renderPrice(product);
  renderSizeSelector(product);
  renderColorSelector(product);
  renderQtySelector(product);
  syncAtcLabel(product);
  renderNeedHelp();
  renderFeatures();
  renderDetail();
  renderFaq();
  renderSocialProof();
  renderFooter();
  renderStickyBar(product);
  initHandlers(product);
  initCounter();
}

// ─── INIT (async entry point) ─────────────────────────────────────────────────
let abortController = null;

async function init() {
  // Batalkan request sebelumnya jika ada (misal: retry)
  abortController?.abort();
  abortController = new AbortController();

  showLoading();

  try {
    const product = await fetchProductById(PRODUCT_ID, abortController.signal);
    renderAll(product);
    showContent();
  } catch (err) {
    // Jangan tampilkan error jika request sengaja dibatalkan
    if (err.name === 'AbortError' || err.type === 'timeout') {
      showError('Permintaan habis waktu. Silakan coba lagi.');
    } else if (err.type === 'not_found') {
      showError('Produk tidak ditemukan.');
    } else {
      showError('Gagal memuat produk. Pastikan backend berjalan atau coba lagi nanti.');
    }
    console.error('[app.js] Error loading product:', err);
  }
}

// ─── RETRY BUTTON ────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  $('#btn-retry')?.addEventListener('click', init);
  init();
});
