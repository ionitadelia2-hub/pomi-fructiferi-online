const CHECKOUT_API_URL =
  "https://pomi-fructiferi-api.rodromanesc.workers.dev/api/orders";

const CART_KEY = "pomi-fructiferi-cart";

function getCheckoutCart() {
  try {
    return JSON.parse(
      localStorage.getItem(CART_KEY)
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

function getCheckoutItems() {
  const cart = getCheckoutCart();

  return cart
    .map((cartItem) => {
      const product =
        getCheckoutProduct(cartItem.slug);

      if (!product) {
        return null;
      }

      const quantity =
        Number(cartItem.quantity);

      if (
        !Number.isInteger(quantity) ||
        quantity <= 0
      ) {
        return null;
      }

      return {
        product,
        quantity,
      };
    })
    .filter(Boolean);
}

function renderCheckout() {
  const container =
    document.getElementById("checkout-items");

  const totalElement =
    document.getElementById("checkout-total");

  if (!container || !totalElement) {
    return;
  }

  const items = getCheckoutItems();

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

function getFormValue(form, selectors) {
  for (const selector of selectors) {
    const element =
      form.querySelector(selector);

    if (element) {
      return element.value.trim();
    }
  }

  return "";
}

async function submitOrder(form) {
  const error =
    document.getElementById("checkout-error");

  const submitButton =
    form.querySelector(
      'button[type="submit"], input[type="submit"]'
    );

  const items = getCheckoutItems();

  if (items.length === 0) {
    if (error) {
      error.hidden = false;
      error.textContent =
        "Coșul este gol.";
    }

    return;
  }

  const customerName =
    getFormValue(form, [
      "#customer-name",
      '[name="name"]',
      '[name="customer_name"]',
    ]);

  const phone =
    getFormValue(form, [
      "#customer-phone",
      '[name="phone"]',
    ]);

  const email =
    getFormValue(form, [
      "#customer-email",
      '[name="email"]',
    ]);

  const county =
    getFormValue(form, [
      "#customer-county",
      '[name="county"]',
    ]);

  const city =
    getFormValue(form, [
      "#customer-city",
      '[name="city"]',
    ]);

  const address =
    getFormValue(form, [
      "#customer-address",
      '[name="address"]',
    ]);

  const notes =
    getFormValue(form, [
      "#customer-notes",
      '[name="notes"]',
    ]);

  const payload = {
    customer: {
      name: customerName,
      phone,
      email,
      county,
      city,
      address,
      notes,
    },

    items: items.map(
      ({ product, quantity }) => ({
        slug: product.slug,
        name: product.name,
        quantity,
        unit_price:
          Number(product.price),
      })
    ),
  };

  try {
    if (error) {
      error.hidden = true;
      error.textContent = "";
    }

    if (submitButton) {
      submitButton.disabled = true;

      submitButton.dataset.originalText =
        submitButton.textContent;

      submitButton.textContent =
        "Se trimite comanda...";
    }

    const response = await fetch(
      CHECKOUT_API_URL,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify(payload),
      }
    );

    const result =
      await response.json();

    if (
      !response.ok ||
      !result.success
    ) {
      throw new Error(
        result.error ||
        "Comanda nu a putut fi trimisă."
      );
    }

    localStorage.removeItem(CART_KEY);

    if (
      typeof updateCartBadge ===
      "function"
    ) {
      updateCartBadge();
    }

    alert(
      `Comanda a fost înregistrată cu succes.\n\nNumăr comandă: ${result.order_number}\nTotal: ${checkoutPrice(result.total)}`
    );

    window.location.href = "/";
  } catch (submitError) {
    console.error(submitError);

    if (error) {
      error.hidden = false;

      error.textContent =
        submitError.message ||
        "A apărut o eroare la trimiterea comenzii.";
    }
  } finally {
    if (submitButton) {
      submitButton.disabled = false;

      submitButton.textContent =
        submitButton.dataset.originalText ||
        "Trimite comanda";
    }
  }
}

document
  .getElementById("checkout-form")
  ?.addEventListener(
    "submit",
    async (event) => {
      event.preventDefault();

      const form =
        event.currentTarget;

      const error =
        document.getElementById(
          "checkout-error"
        );

      if (!form.checkValidity()) {
        if (error) {
          error.hidden = false;

          error.textContent =
            "Completează toate câmpurile obligatorii.";
        }

        form.reportValidity();
        return;
      }

      if (error) {
        error.hidden = true;
      }

      await submitOrder(form);
    }
  );

async function initRomaniaLocations() {
  const countySelect =
    document.getElementById(
      "customer-county"
    );

  const citySelect =
    document.getElementById(
      "customer-city"
    );

  if (
    !countySelect ||
    !citySelect
  ) {
    return;
  }

  try {
    const response =
      await fetch(
        "/data/romania-localitati.json"
      );

    if (!response.ok) {
      throw new Error(
        "Nu s-a putut încărca lista de localități."
      );
    }

    const data =
      await response.json();

    const counties =
      Array.isArray(data.judete)
        ? data.judete
        : [];

    counties.forEach(
      (county) => {
        const option =
          document.createElement(
            "option"
          );

        option.value =
          county.nume;

        option.textContent =
          county.nume;

        countySelect.appendChild(
          option
        );
      }
    );

    countySelect.addEventListener(
      "change",
      () => {
        const selectedCounty =
          counties.find(
            (county) =>
              county.nume ===
              countySelect.value
          );

        citySelect.innerHTML = "";

        if (
          !selectedCounty ||
          !Array.isArray(
            selectedCounty.localitati
          )
        ) {
          citySelect.disabled = true;

          citySelect.innerHTML = `
            <option value="">
              Alege mai întâi județul
            </option>
          `;

          return;
        }

        citySelect.disabled = false;

        const placeholder =
          document.createElement(
            "option"
          );

        placeholder.value = "";

        placeholder.textContent =
          "Alege localitatea";

        placeholder.selected = true;

        citySelect.appendChild(
          placeholder
        );

        selectedCounty.localitati.forEach(
          (city) => {
            const option =
              document.createElement(
                "option"
              );

            option.value =
              city.nume;

            option.textContent =
              city.nume;

            citySelect.appendChild(
              option
            );
          }
        );
      }
    );
  } catch (error) {
    console.error(error);

    countySelect.innerHTML = `
      <option value="">
        Lista județelor nu a putut fi încărcată
      </option>
    `;

    countySelect.disabled = true;

    citySelect.innerHTML = `
      <option value="">
        Lista localităților nu a putut fi încărcată
      </option>
    `;

    citySelect.disabled = true;
  }
}

initRomaniaLocations();
renderCheckout();