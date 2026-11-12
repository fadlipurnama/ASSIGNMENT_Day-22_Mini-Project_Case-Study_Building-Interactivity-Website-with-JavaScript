import { $, px, showToast } from "./utils.js";

const UNIT_LOOP_MODE = "for";

export function initPurchase(productData) {
  const state = { sizeIdx: 0, qty: 1, cartCount: 0 };

  function resolveVariant() {
    const variant = productData.sizes[state.sizeIdx];
    let stock;

    switch (variant?.name) {
      case "Queen":
      case "King":
        stock = variant.exerciseStock;
        break;
      default:
        return { valid: false, message: "Pilihan varian tidak valid." };
    }

    if (!Number.isInteger(stock) || stock < 0) {
      return { valid: false, message: "Informasi stok varian tidak valid." };
    }
    return { valid: true, variant, stock };
  }

  function getQuantityState(input) {
    const selection = resolveVariant();
    if (!selection.valid) {
      return {
        valid: false,
        quantity: null,
        message: selection.message,
      };
    }

    if (selection.stock === 0) {
      return {
        valid: false,
        quantity: null,
        message: `Varian ${selection.variant.name} sedang habis.`,
      };
    }

    if (!input) {
      return {
        valid: false,
        quantity: null,
        message: "Jumlah harus berupa bilangan bulat positif.",
      };
    }

    const quantity = Number(input.value);
    if (!Number.isFinite(quantity) || !Number.isInteger(quantity) || quantity <= 0) {
      return {
        valid: false,
        quantity: null,
        message: "Jumlah harus berupa bilangan bulat positif.",
      };
    }

    if (quantity > selection.stock) {
      return {
        valid: false,
        quantity: null,
        message: `Jumlah melebihi stok ${selection.variant.name}. Stok tersedia: ${selection.stock}.`,
      };
    }

    if (input.max !== "" && quantity > Number(input.max)) {
      return {
        valid: false,
        quantity: null,
        message: `Maksimal quantity per pesanan adalah ${input.max}.`,
      };
    }

    if (!input.checkValidity()) {
      return {
        valid: false,
        quantity: null,
        message: "Quantity tidak memenuhi batas input.",
      };
    }

    return { valid: true, quantity, message: "" };
  }

  function renderPrice() {
    const selection = resolveVariant();
    const badge = $("#price-badge");
    const sale = $("#price-sale");
    const original = $("#price-orig");
    const savings = $("#price-save");
    if (badge) badge.textContent = productData.promo.badge;
    if (sale) sale.textContent = selection.valid ? px(selection.variant.price) : "—";
    if (original) {
      original.textContent = selection.valid
        ? px(selection.variant.originalPrice)
        : "";
    }
    if (savings) savings.textContent = `Save ${px(productData.promo.save)}`;
    syncPurchaseSummary();
  }

  function renderSelectors() {
    const sizeSelect = $("#size-select");
    const quantityInput = $("#qty-select");
    if (sizeSelect) {
      sizeSelect.innerHTML = productData.sizes
        .map(
          (size, index) =>
            `<option value="${index}"${index === state.sizeIdx ? " selected" : ""}>${size.name}</option>`,
        )
        .join("");
    }
    if (quantityInput) quantityInput.value = String(state.qty);
    syncPurchaseSummary();
  }

  function renderProductInfo() {
    const title = $("#product-title");
    if (title) title.textContent = productData.name;
    renderPrice();
    renderSelectors();
  }

  function renderOrderUnits(unitList, variantName, quantity) {
    const addUnit = (unit) => {
      const item = document.createElement("li");
      item.textContent = `${variantName} — Unit ${unit}`;
      unitList.append(item);
    };

    switch (UNIT_LOOP_MODE) {
      case "for":
        for (let unit = 1; unit <= quantity; unit += 1) addUnit(unit);
        break;
      case "while": {
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

  function syncAtcLabel() {
    const button = $("#atc-btn");
    if (!button || button.classList.contains("is-added")) return;

    const selection = resolveVariant();
    if (!selection.valid) {
      button.textContent = "Choose a valid variant";
      button.disabled = false;
      return;
    }
    if (selection.stock === 0) {
      button.textContent = `${selection.variant.name} out of stock`;
      button.disabled = true;
      return;
    }

    const quantityState = getQuantityState($("#qty-select"));
    if (!quantityState.valid) {
      button.textContent = "Enter a valid quantity";
      button.disabled = false;
      return;
    }

    button.disabled = false;
    const subtotal = Number(selection.variant.price) * quantityState.quantity;
    button.textContent = `Add ${quantityState.quantity}x ${selection.variant.name} Adjustable Chill Pillow to cart for ${px(subtotal)}`;
  }

  function syncPurchaseSummary() {
    const selection = resolveVariant();
    const quantityInput = $("#qty-select");
    if (quantityInput && selection.valid) {
      quantityInput.min = "1";
      quantityInput.max = selection.stock;
      quantityInput.disabled = selection.stock === 0;
    }

    const quantityState = getQuantityState(quantityInput);
    const valid =
      selection.valid && selection.stock > 0 && quantityState.valid;
    const variant = $("#summary-variant");
    const quantity = $("#summary-qty");
    const subtotal = $("#summary-subtotal");
    if (variant) variant.textContent = selection.valid ? selection.variant.name : "—";
    if (quantity) {
      quantity.textContent = valid ? String(quantityState.quantity) : "—";
    }
    if (subtotal) {
      subtotal.textContent = valid
        ? px(Number(selection.variant.price) * quantityState.quantity)
        : "—";
    }

    const stockInfo = $(".stock-info");
    if (stockInfo) {
      stockInfo.textContent = selection.valid
        ? `Stock: ${selection.stock}`
        : "Out of stock";
    }
    syncAtcLabel();
  }

  function syncQuantityValidation(input) {
    const quantityState = getQuantityState(input);
    if (quantityState.valid) {
      state.qty = quantityState.quantity;
      clearValidation();
    } else {
      showValidation(quantityState.message);
    }
  }

  function showValidation(message) {
    const validation = $("#atc-validation");
    if (validation) {
      validation.textContent = message;
      validation.hidden = false;
    }
  }

  function clearValidation() {
    const validation = $("#atc-validation");
    if (validation) {
      validation.hidden = true;
      validation.textContent = "";
    }
  }

  function processOrder() {
    const unitList = $("#unitList");
    unitList?.replaceChildren();
    clearValidation();

    const selection = resolveVariant();
    if (!selection.valid) {
      showValidation(selection.message);
      syncAtcLabel();
      return false;
    }

    const quantityState = getQuantityState($("#qty-select"));
    if (!quantityState.valid) {
      showValidation(quantityState.message);
      return false;
    }

    const price = Number(selection.variant.price);
    if (!Number.isFinite(price) || price <= 0) {
      showValidation("Harga produk tidak valid.");
      return false;
    }
    if (selection.stock === 0) {
      showValidation(`Varian ${selection.variant.name} sedang habis.`);
      return false;
    }
    if (quantityState.quantity > selection.stock) {
      showValidation(
        `Jumlah melebihi stok ${selection.variant.name}. Stok tersedia: ${selection.stock}.`,
      );
      return false;
    }

    const orderSubtotal = price * quantityState.quantity;
    const subtotal = $("#summary-subtotal");
    if (subtotal) subtotal.textContent = px(orderSubtotal);
    if (unitList) {
      renderOrderUnits(unitList, selection.variant.name, quantityState.quantity);
    }
    return true;
  }

  function updateCartBadge(quantity) {
    const badge = $("#cart-badge");
    if (!badge) return;
    state.cartCount += quantity;
    badge.textContent = state.cartCount > 99 ? "99+" : String(state.cartCount);
    badge.classList.add("active");
  }

  function addToCart() {
    if (!processOrder()) return;
    const selection = resolveVariant();
    const quantity = Number($("#qty-select").value);
    const button = $("#atc-btn");

    selection.variant.exerciseStock -= quantity;
    state.qty = selection.stock - quantity > 0 ? 1 : 0;
    const quantityInput = $("#qty-select");
    if (quantityInput) {
      quantityInput.value = String(state.qty);
      quantityInput.max = selection.variant.exerciseStock;
    }
    $("#unitList")?.replaceChildren();
    updateCartBadge(quantity);
    syncPurchaseSummary();
    showToast(`${quantity}x ${selection.variant.name} dimasukkan ke keranjang!`);

    if (button) {
      const originalLabel = button.textContent;
      button.textContent = `\u2713 Added ${quantity}x ${selection.variant.name} to cart!`;
      button.classList.add("is-added");
      button.disabled = true;
      setTimeout(() => {
        button.textContent = originalLabel;
        button.classList.remove("is-added");
        button.disabled = false;
        syncAtcLabel();
      }, 2500);
    }

    console.info(
      `[Cart] ${quantity}x ${selection.variant.name} Adjustable Chill Pillow @ ${px(selection.variant.price)}`,
    );
  }

  function initHandlers() {
    const sizeSelect = $("#size-select");
    const quantityInput = $("#qty-select");
    const addButton = $("#atc-btn");

    sizeSelect?.addEventListener("change", (event) => {
      state.sizeIdx =
        event.target.value === "" ? Number.NaN : Number(event.target.value);
      const selection = resolveVariant();

      if (quantityInput) {
        quantityInput.value = String(state.qty);
        quantityInput.max = selection.valid ? selection.stock : "";
        quantityInput.disabled = selection.valid && selection.stock === 0;
      }
      $("#unitList")?.replaceChildren();
      syncQuantityValidation(quantityInput);
      renderPrice();
    });

    quantityInput?.addEventListener("input", (event) => {
      const input = event.target;
      syncQuantityValidation(input);
      $("#unitList")?.replaceChildren();
      syncPurchaseSummary();
    });

    addButton?.addEventListener("click", addToCart);
  }

  renderProductInfo();
  initHandlers();
}
