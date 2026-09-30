(() => {
  const input = document.getElementById("product-search");
  if (!input) return;

  const query = new URLSearchParams(window.location.search).get("q") || "";
  input.value = query;

  // Pe celelalte pagini, formularul deschide catalogul complet.
  if (!/^\/produse\/?$/.test(window.location.pathname)) return;

  const grid = document.querySelector(".catalog-products .products-grid");
  if (!grid) return;

  function normalize(value) {
    return value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  }

  const products = Array.from(grid.querySelectorAll(".product-card")).map(
    (card) => {
      const text = [
        card.querySelector(".product-card-title")?.textContent || "",
        card.querySelector(".product-card-category")?.textContent || "",
        card.querySelector(".product-card-description")?.textContent || ""
      ].join(" ");

      return { card, text: normalize(text) };
    }
  );

  const status = document.createElement("p");
  status.className = "search-status";
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");
  grid.before(status);

  function filterProducts() {
    const words = normalize(input.value).split(/\s+/).filter(Boolean);
    let count = 0;

    products.forEach(({ card, text }) => {
      const matches = words.every((word) => text.includes(word));
      card.hidden = !matches;
      if (matches) count++;
    });

    status.textContent = words.length
      ? count === 0
        ? "Nu am găsit produse. Încearcă alt soi sau altă categorie."
        : count + " produse găsite."
      : "";

    const url = new URL(window.location.href);
    const term = input.value.trim();

    if (term) {
      url.searchParams.set("q", term);
    } else {
      url.searchParams.delete("q");
    }

    window.history.replaceState(null, "", url);
  }

  input.addEventListener("input", filterProducts);

  input.form.addEventListener("submit", (event) => {
    event.preventDefault();
    filterProducts();
    status.scrollIntoView({ behavior: "smooth", block: "center" });
  });

  filterProducts();
})();
