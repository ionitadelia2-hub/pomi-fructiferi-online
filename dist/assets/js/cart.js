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
    return total + item.quantity;
  }, 0);

  document.querySelectorAll("[data-cart-count]").forEach((badge) => {
    badge.textContent = count;
  });
}

function addToCart(slug) {
  const cart = getCart();

  const existingItem = cart.find((item) => item.slug === slug);

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({
      slug,
      quantity: 1,
    });
  }

  saveCart(cart);
  updateCartBadge();
}

function changeQuantity(slug, change) {
  const cart = getCart();

  const item = cart.find((item) => item.slug === slug);

  if (!item) {
    return;
  }

  item.quantity += change;

  const updatedCart = cart.filter((item) => item.quantity > 0);

  saveCart(updatedCart);
  updateCartBadge();

  // Îl activăm când construim pagina /cos/
  // renderCart();
}

document.addEventListener("click", (event) => {
  const button = event.target.closest(".add-to-cart");

  if (!button) {
    return;
  }

  const slug = button.dataset.productSlug;

  if (!slug) {
    return;
  }

  addToCart(slug);

  const originalText = button.textContent;

  button.textContent = "Adăugat ✓";

  setTimeout(() => {
    button.textContent = originalText;
  }, 900);
});

updateCartBadge();