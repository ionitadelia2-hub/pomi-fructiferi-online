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

const PAGE_SIZE = 25;
let currentPage = 1;
let currentQuery = "";
let currentOrders = [];
let totalPages = 1;
let requestVersion = 0;
let requestController;
let searchTimer;

// Controls live inside the authenticated panel, never on the public store search.
const searchForm = document.createElement("form");
searchForm.className = "admin-order-search";
searchForm.setAttribute("role", "search");
searchForm.innerHTML = `
  <label for="admin-order-query">Caută o comandă</label>
  <div class="admin-order-search-row">
    <input id="admin-order-query" type="search" maxlength="120"
      placeholder="Numele clientului sau numărul comenzii" autocomplete="off">
    <button class="button" type="submit">Caută</button>
    <button class="button" type="button" id="admin-order-clear">Șterge căutarea</button>
  </div>
  <small>Caută în toate comenzile, inclusiv în cele mai vechi.</small>`;
const searchInput = searchForm.querySelector("input");
const topPagination = document.createElement("nav");
const bottomPagination = document.createElement("nav");
for (const [index, nav] of [topPagination, bottomPagination].entries()) {
  nav.className = "admin-order-pagination";
  nav.setAttribute("aria-label", index ? "Paginile comenzilor, jos" : "Paginile comenzilor, sus");
}
if (ordersList && ordersStatus) {
  ordersStatus.before(searchForm);
  ordersList.before(topPagination);
  ordersList.after(bottomPagination);
  ordersStatus.setAttribute("role", "status");
  ordersStatus.setAttribute("aria-live", "polite");
  const style = document.createElement("style");
  style.textContent = `
    .admin-order-search{margin:20px 0;display:grid;gap:8px}
    .admin-order-search label{font-weight:700}
    .admin-order-search-row{display:flex;gap:10px;flex-wrap:wrap}
    .admin-order-search input{flex:1 1 280px;min-width:0;padding:13px;border:1px solid #bacdbb;border-radius:10px;font:inherit;background:#fff}
    .admin-order-search small{color:#526552}
    .admin-order-pagination{display:flex;align-items:center;justify-content:center;gap:8px;flex-wrap:wrap;margin:18px 0}
    .admin-order-pagination button{min-width:44px;min-height:44px;padding:9px 13px;border:1px solid #2d6838;border-radius:8px;background:#fff;color:#254f2b;font:inherit;cursor:pointer}
    .admin-order-pagination button[aria-current="page"]{background:#2d6838;color:white;font-weight:700}
    .admin-order-pagination button:disabled{opacity:.5;cursor:default}
    .admin-order-pagination .admin-page-label{flex-basis:100%;text-align:center}
    .admin-order-search button{min-height:44px}
    @media(max-width:600px){.admin-order-search input{flex-basis:100%}.admin-order-search button{flex:1}.admin-order-pagination{gap:6px}}
  `;
  document.head.append(style);
}

function renderPagination() {
  const pages = new Set([1, totalPages]);
  for (let page = currentPage - 2; page <= currentPage + 2; page++) {
    if (page >= 1 && page <= totalPages) pages.add(page);
  }
  let previous = 0;
  const numbers = [...pages].sort((a, b) => a - b).map((page) => {
    const gap = previous && page - previous > 1 ? '<span aria-hidden="true">…</span>' : "";
    previous = page;
    return `${gap}<button type="button" data-page="${page}" aria-label="Pagina ${page}"
      ${page === currentPage ? 'aria-current="page"' : ""}>${page}</button>`;
  }).join("");
  for (const nav of [topPagination, bottomPagination]) {
    nav.innerHTML = `<span class="admin-page-label">Pagina ${currentPage} din ${totalPages}</span>
      <button type="button" data-page="${currentPage - 1}" ${currentPage <= 1 ? "disabled" : ""}>Înapoi</button>
      ${numbers}
      <button type="button" data-page="${currentPage + 1}" ${currentPage >= totalPages ? "disabled" : ""}>Înainte</button>`;
  }
}

function acceptOrders(data) {
  if (!data.pagination || data.pagination.page_size !== PAGE_SIZE) {
    throw new Error("Actualizează și Worker-ul pentru paginare și căutare în toate comenzile.");
  }
  currentPage = data.pagination.page;
  totalPages = data.pagination.total_pages;
  currentOrders = data.orders || [];
  renderOrders(currentOrders);
  if (!currentOrders.length && currentQuery) {
    ordersList.innerHTML = '<div class="admin-empty-state">Nu am găsit comenzi pentru această căutare.</div>';
  }
  const total = data.pagination.total;
  const first = total ? (currentPage - 1) * PAGE_SIZE + 1 : 0;
  const last = total ? first + currentOrders.length - 1 : 0;
  ordersStatus.hidden = false;
  ordersStatus.textContent = currentQuery
    ? `${total} ${total === 1 ? "comandă găsită" : "comenzi găsite"} · Se afișează ${first}–${last}`
    : `${total} comenzi în total · Se afișează ${first}–${last}`;
  renderPagination();
}

async function requestOrders(page, query, token, signal) {
  const url = new URL(API_URL);
  url.searchParams.set("page", String(page));
  url.searchParams.set("page_size", String(PAGE_SIZE));
  if (query) url.searchParams.set("q", query);
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
    signal,
  });
  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.error || "Nu s-au putut încărca comenzile.");
  }
  return data;
}

async function loadOrders(page = currentPage, query = currentQuery) {
  // An event passed by an existing refresh handler is not a page number.
  if (!Number.isInteger(page)) page = currentPage;
  const version = ++requestVersion;
  requestController?.abort();
  requestController = new AbortController();
  ordersStatus.hidden = false;
  ordersStatus.textContent = "Se încarcă comenzile...";
  ordersList.setAttribute("aria-busy", "true");
  for (const nav of [topPagination, bottomPagination]) {
    nav.querySelectorAll("button").forEach((button) => { button.disabled = true; });
  }
  try {
    const data = await requestOrders(page, query, adminToken, requestController.signal);
    if (version !== requestVersion || !adminToken) return;
    const previousQuery = currentQuery;
    currentQuery = query;
    try { acceptOrders(data); } catch (error) { currentQuery = previousQuery; throw error; }
  } catch (error) {
    if (version === requestVersion && error.name !== "AbortError") {
      ordersStatus.textContent = error.message || "A apărut o eroare.";
      renderPagination();
    }
  } finally {
    if (version === requestVersion) ordersList.setAttribute("aria-busy", "false");
  }
}

searchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  clearTimeout(searchTimer);
  loadOrders(1, searchInput.value.trim());
});
searchInput.addEventListener("input", () => {
  clearTimeout(searchTimer);
  // Invalidate any previous response immediately while the user is typing.
  ++requestVersion;
  requestController?.abort();
  searchTimer = setTimeout(() => loadOrders(1, searchInput.value.trim()), 350);
});
searchForm.querySelector("#admin-order-clear").addEventListener("click", () => {
  clearTimeout(searchTimer);
  searchInput.value = "";
  loadOrders(1, "");
  searchInput.focus();
});
for (const nav of [topPagination, bottomPagination]) {
  nav.addEventListener("click", async (event) => {
    const button = event.target.closest("button[data-page]");
    if (!button || button.disabled) return;
    const page = Number(button.dataset.page);
    if (page < 1 || page > totalPages || page === currentPage) return;
    clearTimeout(searchTimer);
    await loadOrders(page);
    searchForm.scrollIntoView({ block: "start" });
  });
}


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

function getProductImage(item) {
  if (
    !item.product_slug ||
    item.product_slug === "transport"
  ) {
    return "";
  }

  const product =
    (window.ADMIN_PRODUCTS || []).find(
      (entry) =>
        entry.slug === item.product_slug
    );

  return product?.image_1 || "";
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
    const image =
      getProductImage(item);

    return `
      <div class="admin-order-item">

        ${
          image
            ? `
              <img
                class="admin-order-product-image"
                src="${escapeHtml(image)}"
                alt="${escapeHtml(item.product_name)}"
                loading="lazy"
              >
            `
            : ""
        }

        <div class="admin-order-item-info">
          <strong>
            ${escapeHtml(item.product_name)}
          </strong>

          <div>
            ${item.quantity}
            ×
            ${formatPrice(item.unit_price)}
          </div>
        </div>

        <strong class="admin-order-item-subtotal">
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

          <div class="admin-order-print-actions">
  <button
    type="button"
    class="button admin-print-order"
    data-order-id="${order.id}"
  >
    Imprimă comanda
  </button>
</div>

          <div class="admin-order-awb">

  <strong>AWB</strong>

  <div class="admin-awb-number">

    <input
      type="text"
      class="admin-awb-input"
      data-order-id="${order.id}"
      value="${escapeHtml(order.awb_number || "")}"
      placeholder="Introdu numărul AWB"
    >

    <button
      type="button"
      class="button admin-save-awb"
      data-order-id="${order.id}"
    >
      Salvează AWB
    </button>

  </div>

  <div class="admin-awb-pdf">

    <input
      type="file"
      class="admin-awb-file"
      data-order-id="${order.id}"
      accept="application/pdf"
    >

    <button
      type="button"
      class="button admin-upload-awb"
      data-order-id="${order.id}"
    >
      Încarcă PDF AWB
    </button>

    ${
      order.awb_pdf_key
        ? `
          <button
            type="button"
            class="button admin-open-awb"
            data-order-id="${order.id}"
          >
            Deschide / Imprimă AWB
          </button>
        `
        : ""
    }

  </div>

  <div
    class="admin-awb-message"
    data-order-id="${order.id}"
  ></div>

</div>

        </article>
      `;
    })
    .join("");
}


function printOrder(order) {
  const printableItems = (order.items || [])
    .filter(
      (item) =>
        item.product_slug !== "transport"
    )
    .map((item) => {
      const image =
        getProductImage(item);

      return `
        <div class="print-order-item">

          ${
            image
              ? `
                <img
                  src="${escapeHtml(image)}"
                  alt="${escapeHtml(item.product_name)}"
                >
              `
              : ""
          }

          <div class="print-order-item-info">
            <strong>
              ${escapeHtml(item.product_name)}
            </strong>

            <div>
              Cantitate:
              <strong>${item.quantity} buc.</strong>
            </div>

            <div>
              Preț:
              ${formatPrice(item.unit_price)}
            </div>
          </div>

        </div>
      `;
    })
    .join("");

  const printWindow =
    window.open("", "_blank");

  if (!printWindow) {
    alert(
      "Browserul a blocat fereastra de imprimare."
    );
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="ro">
    <head>
      <meta charset="UTF-8">

      <title>
        Comanda ${escapeHtml(order.order_number)}
      </title>

      <style>
        body {
          font-family: Arial, sans-serif;
          color: #111;
          margin: 30px;
        }

        h1 {
          margin: 0 0 5px;
          font-size: 26px;
        }

        .print-order-number {
          margin-bottom: 20px;
          font-size: 18px;
          font-weight: 700;
        }

        .print-section {
          margin-bottom: 22px;
        }

        .print-section h2 {
          margin: 0 0 8px;
          font-size: 17px;
          border-bottom: 1px solid #ccc;
          padding-bottom: 5px;
        }

        .print-order-item {
          display: flex;
          align-items: center;
          gap: 15px;
          padding: 10px 0;
          border-bottom: 1px solid #ddd;
          page-break-inside: avoid;
        }

        .print-order-item img {
          width: 80px;
          height: 80px;
          object-fit: cover;
          border-radius: 6px;
        }

        .print-order-item-info {
          line-height: 1.6;
        }

        .print-checklist {
          margin-top: 25px;
          line-height: 2;
        }

        .print-signatures {
          margin-top: 35px;
          display: flex;
          gap: 50px;
        }

        .print-signatures div {
          flex: 1;
          border-top: 1px solid #333;
          padding-top: 7px;
        }

        @media print {
          body {
            margin: 15mm;
          }
        }
      </style>
    </head>

    <body>

      <h1>
        Pomi Fructiferi Online
      </h1>

      <div class="print-order-number">
        Comandă:
        ${escapeHtml(order.order_number)}
      </div>

      <div class="print-section">
        <h2>Date comandă</h2>

        <div>
          Data:
          ${escapeHtml(formatDate(order.created_at))}
        </div>

        <div>
          Client:
          <strong>
            ${escapeHtml(order.customer_name)}
          </strong>
        </div>

        <div>
          Telefon:
          ${escapeHtml(order.phone)}
        </div>

        <div>
          Adresă:
          ${escapeHtml(order.address)},
          ${escapeHtml(order.city)},
          ${escapeHtml(order.county)}
        </div>

        <div>
          Cod poștal:
          ${escapeHtml(order.postal_code)}
        </div>

        ${
          order.awb_number
            ? `
              <div>
                AWB:
                <strong>
                  ${escapeHtml(order.awb_number)}
                </strong>
              </div>
            `
            : ""
        }
      </div>

      ${
        order.notes
          ? `
            <div class="print-section">
              <h2>Observații</h2>
              <div>
                ${escapeHtml(order.notes)}
              </div>
            </div>
          `
          : ""
      }

      <div class="print-section">
        <h2>Produse de pregătit</h2>

        ${printableItems}
      </div>

      <div class="print-checklist">
        □ Produsele au fost pregătite<br>
        □ Soiurile au fost verificate<br>
        □ Cantitățile au fost verificate<br>
        □ Comanda a fost ambalată<br>
        □ Eticheta / AWB-ul a fost aplicat
      </div>

      <div class="print-signatures">
        <div>
          Pregătit de
        </div>

        <div>
          Verificat de
        </div>
      </div>

    </body>
    </html>
  `);

  printWindow.document.close();

  printWindow.onload = () => {
    printWindow.focus();
    printWindow.print();
  };
}

ordersList?.addEventListener(
  "click",
  async (event) => {
    const printButton =
  event.target.closest(".admin-print-order");

if (printButton) {
  const orderId =
    Number(printButton.dataset.orderId);

  const order = currentOrders.find((item) => Number(item.id) === orderId);

  if (!order) {
    alert(
      "Comanda nu a putut fi găsită."
    );
    return;
  }

  printOrder(order);
  return;
}
    const saveButton =
      event.target.closest(".admin-save-awb");

    if (saveButton) {
      const orderId =
        saveButton.dataset.orderId;

      const input =
        document.querySelector(
          `.admin-awb-input[data-order-id="${orderId}"]`
        );

      const message =
        document.querySelector(
          `.admin-awb-message[data-order-id="${orderId}"]`
        );

      const awbNumber =
        input?.value.trim() || "";

      saveButton.disabled = true;
      saveButton.textContent = "Se salvează...";

      if (message) {
        message.textContent = "";
      }

      try {
        const response =
          await fetch(
            `${API_URL}/${orderId}/awb`,
            {
              method: "POST",

              headers: {
                Authorization:
                  `Bearer ${adminToken}`,

                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                awb_number: awbNumber,
              }),
            }
          );

        const data =
          await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.error ||
            "AWB-ul nu a putut fi salvat."
          );
        }

        const cachedOrder = currentOrders.find((order) => String(order.id) === String(orderId));
        if (cachedOrder) cachedOrder.awb_number = awbNumber;
        if (message) {
          message.textContent =
            "AWB salvat cu succes.";
        }
      } catch (error) {
        if (message) {
          message.textContent =
            error.message ||
            "A apărut o eroare.";
        }
      } finally {
        saveButton.disabled = false;
        saveButton.textContent =
          "Salvează AWB";
      }

      return;
    }


    const uploadButton =
      event.target.closest(".admin-upload-awb");

    if (uploadButton) {
      const orderId =
        uploadButton.dataset.orderId;

      const fileInput =
        document.querySelector(
          `.admin-awb-file[data-order-id="${orderId}"]`
        );

      const message =
        document.querySelector(
          `.admin-awb-message[data-order-id="${orderId}"]`
        );

      const file =
        fileInput?.files?.[0];

      if (!file) {
        if (message) {
          message.textContent =
            "Selectează mai întâi PDF-ul AWB.";
        }

        return;
      }

      if (file.type !== "application/pdf") {
        if (message) {
          message.textContent =
            "Fișierul trebuie să fie PDF.";
        }

        return;
      }

      const formData =
        new FormData();

      formData.append(
        "file",
        file
      );

      uploadButton.disabled = true;
      uploadButton.textContent =
        "Se încarcă...";

      if (message) {
        message.textContent = "";
      }

      try {
        const response =
          await fetch(
            `${API_URL}/${orderId}/awb-pdf`,
            {
              method: "POST",

              headers: {
                Authorization:
                  `Bearer ${adminToken}`,
              },

              body: formData,
            }
          );

        const data =
          await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.error ||
            "PDF-ul AWB nu a putut fi încărcat."
          );
        }

        if (message) {
          message.textContent =
            "PDF AWB încărcat cu succes.";
        }

        await loadOrders();
      } catch (error) {
        if (message) {
          message.textContent =
            error.message ||
            "A apărut o eroare.";
        }
      } finally {
        uploadButton.disabled = false;
        uploadButton.textContent =
          "Încarcă PDF AWB";
      }

      return;
    }


    const openButton =
      event.target.closest(".admin-open-awb");

    if (openButton) {
      const orderId =
        openButton.dataset.orderId;

      const message =
        document.querySelector(
          `.admin-awb-message[data-order-id="${orderId}"]`
        );

      openButton.disabled = true;
      openButton.textContent =
        "Se deschide...";

      try {
        const response =
          await fetch(
            `${API_URL}/${orderId}/awb-pdf`,
            {
              headers: {
                Authorization:
                  `Bearer ${adminToken}`,
              },
            }
          );

        if (!response.ok) {
          let errorMessage =
            "AWB-ul nu a putut fi deschis.";

          try {
            const data =
              await response.json();

            errorMessage =
              data.error || errorMessage;
          } catch {}

          throw new Error(
            errorMessage
          );
        }

        const blob =
          await response.blob();

        const objectUrl =
          URL.createObjectURL(blob);

        const awbWindow =
          window.open(
            objectUrl,
            "_blank"
          );

        if (!awbWindow) {
          throw new Error(
            "Browserul a blocat deschiderea PDF-ului."
          );
        }

        setTimeout(() => {
          URL.revokeObjectURL(
            objectUrl
          );
        }, 60000);
      } catch (error) {
        if (message) {
          message.textContent =
            error.message ||
            "A apărut o eroare.";
        }
      } finally {
        openButton.disabled = false;
        openButton.textContent =
          "Deschide / Imprimă AWB";
      }

      return;
    }
  }
);

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
      const version = ++requestVersion;
      requestController?.abort();
      requestController = new AbortController();
      const data = await requestOrders(1, "", adminToken, requestController.signal);
      if (version !== requestVersion) return;
      currentQuery = "";
      searchInput.value = "";
      acceptOrders(data);
      loginCard.hidden = true;
      ordersPanel.hidden = false;
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
    ++requestVersion;
    requestController?.abort();
    clearTimeout(searchTimer);
    currentOrders = [];
    currentQuery = "";
    currentPage = 1;
    totalPages = 1;
    searchInput.value = "";
    topPagination.innerHTML = "";
    bottomPagination.innerHTML = "";
    adminToken = "";

    tokenInput.value = "";

    ordersPanel.hidden = true;
    loginCard.hidden = false;

    ordersList.innerHTML = "";

    loginError.hidden = true;
    loginError.textContent = "";
  }
);