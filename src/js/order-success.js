const params = new URLSearchParams(window.location.search);
const orderNumber = params.get("order");
const total = params.get("total");

let conversionQueued = false;

function sendConfirmedPurchase() {
  if (
    conversionQueued ||
    typeof window.pomiAdsConsentGranted !== "function" ||
    !window.pomiAdsConsentGranted() ||
    typeof window.gtag !== "function"
  ) {
    return;
  }

  try {
    const raw = sessionStorage.getItem(
      "pomi-ads-confirmed-order"
    );

    if (!raw) return;

    const order = JSON.parse(raw);
    const id = String(order.order_number || "");
    const value = Number(order.total);

    if (
      !orderNumber ||
      id !== orderNumber ||
      order.total == null ||
      order.total === "" ||
      !Number.isFinite(value) ||
      value <= 0
    ) {
      return;
    }

    window.gtag("event", "conversion", {
      send_to: "AW-18488960721/X-ZLCPr5jZMdENHNnPBE",
      value: value,
      currency: "RON",
      transaction_id: id
    });

    conversionQueued = true;
    sessionStorage.removeItem("pomi-ads-confirmed-order");
  } catch (error) {
    console.warn(
      "Conversia nu a putut fi pusă în coadă:",
      error
    );
  }
}

window.addEventListener(
  "pomi-ads-consent-changed",
  sendConfirmedPurchase
);

sendConfirmedPurchase();

const orderNumberElement = document.getElementById(
  "success-order-number"
);

const totalElement = document.getElementById(
  "success-order-total"
);

if (orderNumberElement && orderNumber) {
  orderNumberElement.textContent = orderNumber;
}

if (
  totalElement &&
  total !== null &&
  Number.isFinite(Number(total))
) {
  totalElement.textContent =
    `${Number(total).toFixed(2)} lei`;
}
