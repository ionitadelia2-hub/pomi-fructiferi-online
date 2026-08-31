const params =
  new URLSearchParams(window.location.search);

const orderNumber =
  params.get("order");

const total =
  params.get("total");

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