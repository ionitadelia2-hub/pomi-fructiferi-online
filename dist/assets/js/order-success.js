const params =
  new URLSearchParams(window.location.search);

const orderNumber =
  params.get("order");

const total =
  params.get("total");

  try {
  const savedOrder = sessionStorage.getItem(
    "pomi-ads-confirmed-order"
  );

  if (savedOrder) {
    const confirmedOrder = JSON.parse(savedOrder);

    if (
      String(confirmedOrder.order_number) === orderNumber &&
      Number.isFinite(Number(confirmedOrder.total))
    ) {
      sessionStorage.removeItem("pomi-ads-confirmed-order");

      if (typeof gtag === "function") {
        gtag("event", "conversion", {
          send_to: "AW-18482322523/4ILXCIjOwoodENu4h-1E",
          value: Number(confirmedOrder.total),
          currency: "RON",
          transaction_id: String(confirmedOrder.order_number)
        });
      }
    }
  }
} catch (conversionError) {
  console.warn("Conversia nu a putut fi trimisă:", conversionError);
}

const orderNumberElement =
  document.getElementById(
    "success-order-number"
  );

const totalElement =
  document.getElementById(
    "success-order-total"
  );

if (orderNumberElement && orderNumber) {
  orderNumberElement.textContent =
    orderNumber;
}

if (totalElement && total) {
  totalElement.textContent =
    `${Number(total).toFixed(2)} lei`;
}