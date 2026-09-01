const CART_KEY = "pomi-fructiferi-cart";

function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function updateCartBadge() {
  const cart = getCart();

  const count = cart.reduce((total, item) => {
    return total + Number(item.quantity || 0);
  }, 0);

  document.querySelectorAll("[data-cart-count]").forEach((badge) => {
    badge.textContent = count;
  });
}

function addToCart(
  slug,
  quantity = 1,
  variant = "",
  unitPrice = null
) {
  const cart = getCart();

  let amount = Number(quantity);

  if (!Number.isFinite(amount)) {
    amount = 1;
  }

  amount = Math.max(1, Math.floor(amount));

  const existingItem = cart.find((item) => {
  return (
    item.slug === slug &&
    (item.variant || "") === (variant || "")
  );
});

 if (existingItem) {
  existingItem.quantity += amount;

  if (unitPrice !== null) {
    existingItem.unit_price = Number(unitPrice);
  }
} else {
  cart.push({
    slug,
    variant: variant || "",
    quantity: amount,
    unit_price:
      unitPrice !== null
        ? Number(unitPrice)
        : null,
  });
}

  saveCart(cart);
  updateCartBadge();

  if (document.getElementById("cart-items")) {
    renderCart();
  }
}

function setQuantity(slug, variant, quantity) {
  const cart = getCart();

  const item = cart.find((item) => {
    return (
      item.slug === slug &&
      (item.variant || "") === (variant || "")
    );
  });

  if (!item) {
    return;
  }

  let newQuantity = Number(quantity);

  if (!Number.isFinite(newQuantity)) {
    newQuantity = 1;
  }

  newQuantity = Math.floor(newQuantity);

  if (newQuantity <= 0) {
    removeFromCart(slug, variant);
    return;
  }

  item.quantity = newQuantity;

  saveCart(cart);
  updateCartBadge();
  renderCart();
}


function changeQuantity(slug, variant, change) {
  const cart = getCart();

  const item = cart.find((item) => {
    return (
      item.slug === slug &&
      (item.variant || "") === (variant || "")
    );
  });

  if (!item) {
    return;
  }

  setQuantity(
    slug,
    variant,
    Number(item.quantity) + change
  );
}

function removeFromCart(slug, variant = "") {
  const cart = getCart().filter((item) => {
    return !(
      item.slug === slug &&
      (item.variant || "") === (variant || "")
    );
  });

  saveCart(cart);
  updateCartBadge();
  renderCart();
}

function getProduct(slug) {
  if (!Array.isArray(window.PRODUCTS)) {
    return null;
  }

  return window.PRODUCTS.find((product) => {
    return product.slug === slug;
  });
}

function formatPrice(value) {
  return `${Number(value).toFixed(2)} lei`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderCart() {
  const container = document.getElementById("cart-items");

  if (!container) {
    return;
  }

  const cart = getCart();

  const validItems = cart
    .map((cartItem) => {
      const product = getProduct(cartItem.slug);

      if (!product) {
        return null;
      }

      return {
        cartItem,
        product,
      };
    })
    .filter(Boolean);

  if (validItems.length === 0) {
    container.innerHTML = `
      <div class="cart-empty">
        <h2>Coșul tău este gol</h2>
        <p>
          Adaugă produse din catalog pentru a începe o comandă.
        </p>

        <a href="/produse/" class="cart-empty-button">
          Vezi produsele
        </a>
      </div>
    `;

    updateCartSummary([]);
    return;
  }

  container.innerHTML = validItems
    .map(({ cartItem, product }) => {
      const quantity = Number(cartItem.quantity);

const unitPrice =
  cartItem.unit_price !== null &&
  cartItem.unit_price !== undefined
    ? Number(cartItem.unit_price)
    : Number(product.price);

const subtotal =
  unitPrice * quantity;

      return `
        <article
          class="cart-item"
          data-cart-item="${escapeHtml(product.slug)}"
        >

          <a
            href="/produse/${escapeHtml(product.slug)}/"
            class="cart-item-image-link"
          >
            <img
              src="${escapeHtml(product.image_1)}"
              alt="${escapeHtml(product.name)}"
              class="cart-item-image"
            >
          </a>

          <div class="cart-item-info">
            <a
              href="/produse/${escapeHtml(product.slug)}/"
              class="cart-item-title"
            >
              ${escapeHtml(product.name)}
            </a>

            ${
  cartItem.variant
    ? `
      <span class="cart-item-variant">
        Vârstă: ${escapeHtml(cartItem.variant)} ani
      </span>
    `
    : ""
}

<span class="cart-item-unit-price">
  ${formatPrice(unitPrice)} / buc.
</span>

            <button
              type="button"
              class="cart-remove-button"
              data-cart-remove="${escapeHtml(product.slug)}"
data-cart-variant="${escapeHtml(cartItem.variant || "")}"
            >
              Elimină
            </button>
          </div>

          <div class="cart-quantity">
            <button
              type="button"
              class="cart-quantity-button"
              data-cart-minus="${escapeHtml(product.slug)}"
data-cart-variant="${escapeHtml(cartItem.variant || "")}"
              aria-label="Scade cantitatea"
            >
              −
            </button>

            <input
  type="number"
  class="cart-quantity-input"
  value="${quantity}"
  min="1"
  data-cart-quantity="${escapeHtml(product.slug)}"
data-cart-variant="${escapeHtml(cartItem.variant || "")}"
  aria-label="Cantitate ${escapeHtml(product.name)}"
>

            <button
              type="button"
              class="cart-quantity-button"
              data-cart-plus="${escapeHtml(product.slug)}"
data-cart-variant="${escapeHtml(cartItem.variant || "")}"
              aria-label="Crește cantitatea"
            >
              +
            </button>
          </div>

          <div class="cart-item-subtotal">
            <span>Subtotal</span>

            <strong>
              ${formatPrice(subtotal)}
            </strong>
          </div>

        </article>
      `;
    })
    .join("");

  updateCartSummary(validItems);
}

function updateCartSummary(items) {
  const countElement =
    document.getElementById("cart-summary-count");

  const totalElement =
    document.getElementById("cart-total");

    const shippingElement =
  document.getElementById("cart-shipping");

  const checkoutButton =
    document.getElementById("cart-checkout-button");

  const totalQuantity = items.reduce(
    (total, { cartItem }) => {
      return total + Number(cartItem.quantity);
    },
    0
  );

 const totalPrice = items.reduce(
  (total, { cartItem, product }) => {
    const unitPrice =
      cartItem.unit_price !== null &&
      cartItem.unit_price !== undefined
        ? Number(cartItem.unit_price)
        : Number(product.price);

    return (
      total +
      unitPrice * Number(cartItem.quantity)
    );
  },
  0
);

const shippingCost =
  totalQuantity > 0 ? 30 : 0;

const grandTotal =
  totalPrice + shippingCost;

  if (countElement) {
    countElement.textContent =
      `${totalQuantity} buc.`;
  }

  if (totalElement) {
    totalElement.textContent =
      formatPrice(grandTotal);
  }

  if (shippingElement) {
  shippingElement.textContent =
    formatPrice(shippingCost);
}

  if (checkoutButton) {
    checkoutButton.disabled =
      totalQuantity === 0;
  }
}

document.addEventListener("click", (event) => {
    const productPlus =
    event.target.closest("[data-product-plus]");

  if (productPlus) {
    const input =
      document.querySelector("[data-product-quantity]");

    if (input) {
      const current =
        Number(input.value) || 1;

      input.value = current + 1;
    }

    return;
  }

  const productMinus =
    event.target.closest("[data-product-minus]");

  if (productMinus) {
    const input =
      document.querySelector("[data-product-quantity]");

    if (input) {
      const current =
        Number(input.value) || 1;

      input.value =
        Math.max(1, current - 1);
    }

    return;
  }
  const addButton =
    event.target.closest(".add-to-cart");

  if (addButton) {
    const slug =
      addButton.dataset.productSlug;

    if (!slug) {
      return;
    }

    const quantityInput =
  document.querySelector("[data-product-quantity]");

const quantity =
  quantityInput
    ? Math.max(
        1,
        Math.floor(Number(quantityInput.value) || 1)
      )
    : 1;

const variantSelect =
  document.querySelector("[data-product-variant]");

let selectedVariant = "";
let selectedPrice = null;

if (variantSelect) {
  const selectedOption =
    variantSelect.options[
      variantSelect.selectedIndex
    ];

  selectedVariant =
    selectedOption.value || "";

  selectedPrice =
    selectedOption.dataset.price || null;
}

addToCart(
  slug,
  quantity,
  selectedVariant,
  selectedPrice
);

if (quantityInput) {
  quantityInput.value = 1;
}

    const originalText =
      addButton.textContent;

    addButton.textContent =
      "Adăugat ✓";

    setTimeout(() => {
      addButton.textContent =
        originalText;
    }, 900);

    return;
  }

  const plusButton =
    event.target.closest("[data-cart-plus]");

 if (plusButton) {
  changeQuantity(
    plusButton.dataset.cartPlus,
    plusButton.dataset.cartVariant || "",
    1
  );

  return;
}

  const minusButton =
    event.target.closest("[data-cart-minus]");

  if (minusButton) {
  changeQuantity(
    minusButton.dataset.cartMinus,
    minusButton.dataset.cartVariant || "",
    -1
  );

  return;
}

  const removeButton =
    event.target.closest("[data-cart-remove]");

  if (removeButton) {
    removeFromCart(
      removeButton.dataset.cartRemove,
      removeButton.dataset.cartVariant || ""
    );
  }
});

document.addEventListener("change", (event) => {
  const input =
    event.target.closest("[data-cart-quantity]");

  if (!input) {
    return;
  }

  setQuantity(
  input.dataset.cartQuantity,
  input.dataset.cartVariant || "",
  input.value
);
});

updateCartBadge();
renderCart();