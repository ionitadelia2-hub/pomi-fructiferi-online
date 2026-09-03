const API_URL =
   "https://api.pomifructiferionline.ro/api/admin/orders";

const loginForm =
  document.getElementById("admin-login-form");

const loginCard =
  document.getElementById("admin-login-card");

const ordersPanel =
  document.getElementById("admin-orders-panel");

const tokenInput =
  document.getElementById("admin-token");

const loginError =
  document.getElementById("admin-login-error");

const ordersList =
  document.getElementById("admin-orders-list");

const ordersStatus =
  document.getElementById("admin-orders-status");

const refreshButton =
  document.getElementById("admin-refresh-orders");

const logoutButton =
  document.getElementById("admin-logout");

let adminToken = "";

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatPrice(value) {
  return `${Number(value).toFixed(2)} lei`;
}

function formatDate(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("ro-RO");
}

function renderOrders(orders) {
  if (!orders.length) {
    ordersList.innerHTML = `
      <div class="admin-empty-state">
        Nu există comenzi.
      </div>
    `;

    return;
  }

  ordersList.innerHTML = orders
    .map((order) => {
      const items = (order.items || [])
        .map((item) => {
          return `
            <div class="admin-order-item">
              <div>
                <strong>
                  ${escapeHtml(item.product_name)}
                </strong>

                <div>
                  ${item.quantity}
                  ×
                  ${formatPrice(item.unit_price)}
                </div>
              </div>

              <strong>
                ${formatPrice(item.subtotal)}
              </strong>
            </div>
          `;
        })
        .join("");

      return `
        <article class="admin-order-card">

          <div class="admin-order-top">
            <div>
              <div class="admin-order-number">
                ${escapeHtml(order.order_number)}
              </div>

              <div class="admin-order-date">
                ${escapeHtml(formatDate(order.created_at))}
              </div>
            </div>

            <div class="admin-order-total">
              ${formatPrice(order.total)}
            </div>
          </div>

          <div class="admin-order-grid">

            <div>
              <span>Client</span>
              <strong>
                ${escapeHtml(order.customer_name)}
              </strong>
            </div>

            <div>
              <span>Telefon</span>
              <strong>
                ${escapeHtml(order.phone)}
              </strong>
            </div>

            <div>
              <span>Email</span>
              <strong>
                ${escapeHtml(order.email || "-")}
              </strong>
            </div>

            <div>
              <span>Status</span>
              <strong>
                ${escapeHtml(order.status || "new")}
              </strong>
            </div>

          </div>

          <div class="admin-order-address">
            <strong>Adresă livrare</strong>

            <div>
              ${escapeHtml(order.address)},
              ${escapeHtml(order.city)},
              ${escapeHtml(order.county)}
            </div>

            <div>
              Cod poștal:
              ${escapeHtml(order.postal_code)}
            </div>
          </div>

          ${
            order.notes
              ? `
                <div class="admin-order-notes">
                  <strong>Observații</strong>
                  <div>
                    ${escapeHtml(order.notes)}
                  </div>
                </div>
              `
              : ""
          }

          <div class="admin-order-products">
            <strong>Produse</strong>

            ${items}
          </div>

        </article>
      `;
    })
    .join("");
}

async function loadOrders() {
  ordersStatus.hidden = false;
  ordersStatus.textContent =
    "Se încarcă comenzile...";

  try {
    const response = await fetch(API_URL, {
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(
        data.error || "Nu s-au putut încărca comenzile."
      );
    }

    renderOrders(data.orders || []);

    ordersStatus.textContent =
      `${data.orders?.length || 0} comenzi încărcate`;
  } catch (error) {
    ordersStatus.textContent =
      error.message || "A apărut o eroare.";
  }
}

loginForm?.addEventListener(
  "submit",
  async (event) => {
    event.preventDefault();

    loginError.hidden = true;
    loginError.textContent = "";

    adminToken =
      tokenInput.value.trim();

    if (!adminToken) {
      loginError.textContent =
        "Introdu parola de administrare.";
      loginError.hidden = false;
      return;
    }

    try {
      const response = await fetch(API_URL, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "Parolă incorectă."
        );
      }

      loginCard.hidden = true;
      ordersPanel.hidden = false;

      renderOrders(data.orders || []);

      ordersStatus.textContent =
        `${data.orders?.length || 0} comenzi încărcate`;
    } catch (error) {
      loginError.textContent =
        error.message || "Acces respins.";

      loginError.hidden = false;
    }
  }
);

refreshButton?.addEventListener(
  "click",
  loadOrders
);

logoutButton?.addEventListener(
  "click",
  () => {
    adminToken = "";

    tokenInput.value = "";

    ordersPanel.hidden = true;
    loginCard.hidden = false;

    ordersList.innerHTML = "";

    loginError.hidden = true;
    loginError.textContent = "";
  }
);