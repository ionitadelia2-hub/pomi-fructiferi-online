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

  const response =
    await fetch(API_URL, {
      headers: {
        Authorization:
          `Bearer ${adminToken}`,
      },
    });

  const data =
    await response.json();

  const order =
    (data.orders || []).find(
      (item) =>
        Number(item.id) === orderId
    );

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