function getCheckoutCart() {
  try {
    return JSON.parse(
      localStorage.getItem("pomi-fructiferi-cart")
    ) || [];
  } catch {
    return [];
  }
}

function getCheckoutProduct(slug) {
  if (!Array.isArray(window.PRODUCTS)) {
    return null;
  }

  return window.PRODUCTS.find(
    (product) => product.slug === slug
  );
}

function checkoutPrice(value) {
  return `${Number(value).toFixed(2)} lei`;
}

function renderCheckout() {
  const container =
    document.getElementById("checkout-items");

  const totalElement =
    document.getElementById("checkout-total");

  if (!container || !totalElement) {
    return;
  }

  const cart = getCheckoutCart();

  const items = cart
    .map((cartItem) => {
      const product =
        getCheckoutProduct(cartItem.slug);

      if (!product) {
        return null;
      }

      return {
        product,
        quantity: Number(cartItem.quantity),
      };
    })
    .filter(Boolean);

  if (items.length === 0) {
    window.location.href = "/cos/";
    return;
  }

  let total = 0;

  container.innerHTML = items
    .map(({ product, quantity }) => {
      const subtotal =
        Number(product.price) * quantity;

      total += subtotal;

      return `
        <div class="checkout-summary-item">

          <img
            src="${product.image_1}"
            alt="${product.name}"
          >

          <div>
            <strong>
              ${product.name}
            </strong>

            <span>
              ${quantity} × ${checkoutPrice(product.price)}
            </span>
          </div>

          <strong>
            ${checkoutPrice(subtotal)}
          </strong>

        </div>
      `;
    })
    .join("");

  totalElement.textContent =
    checkoutPrice(total);
}

document
  .getElementById("checkout-form")
  ?.addEventListener("submit", (event) => {
    event.preventDefault();

    const form = event.currentTarget;

    const error =
      document.getElementById("checkout-error");

    if (!form.checkValidity()) {
      error.hidden = false;
      error.textContent =
        "Completează toate câmpurile obligatorii.";

      form.reportValidity();
      return;
    }

    error.hidden = true;

    console.log(
      "Formular valid. Urmează trimiterea comenzii."
    );
  });

renderCheckout();