/**
 * utils.js — Kumpulan fungsi helper / reusable
 */
'use strict';

// 1. DOM Selector Helpers
export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => r.querySelectorAll(s);

// 2. Format Currency / Price Helper
export const px = (n) => `$${n}`;

// 3. Reusable HTML Generator untuk List/Menu (TopBar, Nav, Footer Links)
export function generateLinkList(items) {
  return items.map(i => {
    const highlightClass = i.highlight ? "nav-sale" : "";
    return `<li><a href="${i.href}" class="${highlightClass}">${i.label}</a></li>`;
  }).join("");
}

// 4. Reusable Toast Notification Helper
export function showToast(message) {
  const container = $("#toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = "toast";
  const icon = document.createElement("span");
  icon.textContent = "✓";
  const text = document.createElement("span");
  text.textContent = message;
  toast.append(icon, text);

  container.appendChild(toast);

  setTimeout(() => toast.classList.add("show"), 10);

  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}