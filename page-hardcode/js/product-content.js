import { $, $$, generateLinkList } from "./utils.js";

function renderTopBar(productData) {
  const promoLink = $("#top-bar-promo-link");
  const navList = $("#top-bar-nav");
  const detailsBtn = $("#top-bar-details");
  if (promoLink) promoLink.textContent = productData.promo.message;
  if (navList) navList.innerHTML = generateLinkList(productData.topBar);
  detailsBtn?.addEventListener("click", () =>
    alert("Promo details: " + productData.promo.message),
  );
}

function renderNav(productData) {
  const desktopList = $("#main-nav-list");
  const mobileList = $("#mobile-nav-list");
  const hamburger = $("#hamburger-btn");
  const mobileNav = $("#mobile-nav");
  const items = generateLinkList(productData.nav);

  if (desktopList) desktopList.innerHTML = items;
  if (mobileList) mobileList.innerHTML = items;
  if (hamburger && mobileNav) {
    hamburger.addEventListener("click", () => {
      mobileNav.toggleAttribute("hidden");
      const isOpen = !mobileNav.hasAttribute("hidden");
      hamburger.classList.toggle("is-open", isOpen);
      hamburger.setAttribute("aria-expanded", String(isOpen));
    });
  }
}

function renderBreadcrumb(productData) {
  const list = $("#breadcrumb-list");
  if (!list) return;

  list.innerHTML = productData.breadcrumb
    .map((item, index, items) => {
      const isLast = index === items.length - 1;
      const separator = isLast
        ? ""
        : `<span class="bc-sep" aria-hidden="true">/</span>`;
      const label = isLast
        ? `<span aria-current="page">${item.label}</span>`
        : `<a href="${item.href}">${item.label}</a>`;
      return `<li>${label}${separator}</li>`;
    })
    .join("");
}

function renderTabs(productData) {
  const panels = {
    benefits: "panel-benefits",
    bestFor: "panel-bestfor",
    bonuses: "panel-bonuses",
  };

  Object.entries(panels).forEach(([key, panelId]) => {
    const panel = $(`#${panelId}`);
    if (panel) {
      panel.innerHTML = productData.tabs[key]
        .map((item) => `<li>${item}</li>`)
        .join("");
    }
  });

  $$(".tab-btn").forEach((button) => {
    button.addEventListener("click", () => {
      $$(".tab-btn").forEach((item) => {
        item.classList.remove("tab-btn--active");
        item.setAttribute("aria-selected", "false");
      });
      $$(".tab-panel").forEach((panel) => {
        panel.classList.remove("tab-panel--active");
        panel.hidden = true;
      });
      button.classList.add("tab-btn--active");
      button.setAttribute("aria-selected", "true");
      const panel = $(`#${panels[button.dataset.tab]}`);
      if (panel) {
        panel.classList.add("tab-panel--active");
        panel.hidden = false;
      }
    });
  });
}

function renderNeedHelp(productData) {
  const title = $("#need-help-title");
  const description = $("#need-help-desc");
  const chat = $("#need-help-chat");
  if (title) title.textContent = productData.needHelp.title;
  if (description) description.textContent = productData.needHelp.desc;
  if (chat) {
    chat.textContent = productData.needHelp.chatLabel;
    chat.addEventListener("click", () => alert("Opening chat..."));
  }
}

function renderFeatures(productData) {
  const grid = $("#features-grid");
  if (!grid) return;

  const icons = {
    "icon-pressure":
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/></svg>',
    "icon-snap":
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>',
    "icon-mesh":
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 3C7 3 3 7 3 12s4 9 9 9 9-4 9-9-4-9-9-9zm0 0v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6 5.6 18.4"/></svg>',
  };

  grid.innerHTML = productData.features
    .map(
      (feature) => `
    <article class="feature-card">
      <div class="feature-icon-wrap">${icons[feature.svgId] || ""}</div>
      <h3 class="feature-title">${feature.title}</h3>
      <p class="feature-desc">${feature.desc}</p>
    </article>`,
    )
    .join("");
}

function renderDetail(productData) {
  const container = $("#detail-container");
  if (!container) return;

  container.innerHTML = productData.detailSections
    .map(
      (section) => `
    <div class="detail-pair${section.reverse ? " is-reverse" : ""}">
      <div class="detail-img-wrap"><img src="${section.image}" alt="${section.imageAlt}" loading="lazy"/></div>
      <div class="detail-text"><h3>${section.title}</h3><p>${section.desc}</p></div>
    </div>`,
    )
    .join("");
}

function renderFaq(productData) {
  const accordion = $("#accordion");
  if (!accordion) return;
  const specifications = productData.specifications;
  const shipping = productData.shipping;

  accordion.innerHTML = productData.faq
    .map((item, index) => {
      let body = "";
      if (item.isSpecs) {
        body = `<table class="specs-table" aria-label="Spesifikasi produk"><tbody>
        <tr><th>Size Queen</th><td>${specifications.size.Queen}</td></tr>
        <tr><th>Size King</th><td>${specifications.size.King}</td></tr>
        <tr class="specs-section"><th colspan="2">Materials</th></tr>
        <tr><th>Cover</th><td>${specifications.materials.cover}</td></tr>
        <tr><th>Fill Cover</th><td>${specifications.materials.fillCover}</td></tr>
        <tr><th>Fill</th><td>${specifications.materials.fill}</td></tr>
        <tr><th>Fill Weight King</th><td>${specifications.fillWeight.King}</td></tr>
        <tr><th>Fill Weight Queen</th><td>${specifications.fillWeight.Queen}</td></tr>
        <tr class="specs-section"><th colspan="2">Care</th></tr>
        <tr><th>Outer Cover</th><td>${specifications.care.outerCover}</td></tr>
        <tr><th>Fill Cover</th><td>${specifications.care.fillCover}</td></tr>
        <tr><th>Fill</th><td><strong>${specifications.care.fill}</strong></td></tr>
        </tbody></table>
        <p style="margin-top:12px;font-size:12px;color:#666">${specifications.certification}</p>`;
      } else if (item.isShipping) {
        body = `<div class="ship-grid">
        <div class="ship-card"><div class="ship-icon">🚚</div><h4>Free Shipping</h4><p>${shipping.shippingNote}</p></div>
        <div class="ship-card"><div class="ship-icon">🛡️</div><h4>${shipping.warranty} Limited Warranty</h4><p>${shipping.warrantyNote}</p></div>
        <div class="ship-card"><div class="ship-icon">↩️</div><h4>${shipping.trial} Risk-Free Trial</h4><p>${shipping.trialNote}</p></div>
        </div>`;
      } else {
        body = `<p>${item.a}</p>`;
      }

      return `<div class="acc-item" data-idx="${index}">
      <button class="acc-btn" aria-expanded="false" aria-controls="acc-body-${index}">
        <span>${item.q}</span><span class="acc-icon" aria-hidden="true"></span>
      </button>
      <div class="acc-body" id="acc-body-${index}" role="region">
        <div class="acc-content">${body}</div>
      </div>
    </div>`;
    })
    .join("");

  accordion.addEventListener("click", (event) => {
    const button = event.target.closest(".acc-btn");
    if (!button) return;
    const item = button.closest(".acc-item");
    const body = $(".acc-body", item);
    const wasOpen = item.classList.contains("is-open");
    $$(".acc-item.is-open", accordion).forEach((openItem) => {
      openItem.classList.remove("is-open");
      $(".acc-body", openItem).classList.remove("is-open");
      $(".acc-btn", openItem).setAttribute("aria-expanded", "false");
    });
    if (!wasOpen) {
      item.classList.add("is-open");
      body.classList.add("is-open");
      button.setAttribute("aria-expanded", "true");
    }
  });
}

function renderSocialProof(productData) {
  const heading = $("#social-heading");
  const description = $("#social-desc");
  if (heading) heading.textContent = productData.socialProof.heading;
  if (description) description.textContent = productData.socialProof.description;
}

function renderFooter(productData) {
  const footer = productData.footer;
  [
    ["f-shop", footer.shop],
    ["f-about", footer.about],
    ["f-support", footer.support],
  ].forEach(([id, items]) => {
    const list = $(`#${id}`);
    if (list) list.innerHTML = generateLinkList(items);
  });

  const hours = $("#f-hours");
  const phone = $("#f-phone");
  const copyright = $("#f-copy");
  const legal = $("#f-legal");
  if (hours) hours.textContent = footer.hours;
  if (phone) {
    phone.textContent = "1.844.33.LEESA";
    phone.href = "tel:18443353372";
  }
  if (copyright) copyright.textContent = footer.copyright;
  if (legal) {
    legal.innerHTML = footer.legal
      .map((item) => `<li><a href="${item.href}">${item.label}</a></li>`)
      .join("");
  }

  const socialLinks = $("#social-links");
  if (socialLinks) {
    socialLinks.innerHTML = footer.social
      .map(
        (item) =>
          `<a href="${item.href}" class="social-link" aria-label="${item.label}" rel="noopener noreferrer">${item.svg}</a>`,
      )
      .join("");
  }

  const button = $("#nl-btn");
  const input = $("#nl-email");
  const message = $("#nl-msg");
  if (button && input && message) {
    const subscribe = () => {
      const email = input.value.trim();
      const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      message.hidden = false;
      if (valid) {
        message.textContent = `\u2713 Thanks! ${email} subscribed.`;
        message.className = "nl-msg ok";
        input.value = "";
      } else {
        message.textContent = "Please enter a valid email.";
        message.className = "nl-msg err";
      }
    };
    button.addEventListener("click", subscribe);
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") subscribe();
    });
  }
}

export function renderProductContent(productData) {
  renderTopBar(productData);
  renderNav(productData);
  renderBreadcrumb(productData);
  renderTabs(productData);
  renderNeedHelp(productData);
  renderFeatures(productData);
  renderDetail(productData);
  renderFaq(productData);
  renderSocialProof(productData);
  renderFooter(productData);
}
