(() => {
  const input = document.getElementById("product-search");
  if (!input) return;

  const params = new URLSearchParams(window.location.search);
  input.value = params.get("q") || "";

  if (!/^\/produse\/?$/.test(window.location.pathname)) return;

  const grid = document.querySelector(".catalog-products .products-grid");
  if (!grid) return;

  function normalize(value) {
    return String(value)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  }

  const products = Array.from(
    grid.querySelectorAll(".product-card")
  ).map((card) => {
    const categoryLabel =
      card.querySelector(".product-card-category")?.textContent.trim() || "";

    const text = [
      card.querySelector(".product-card-title")?.textContent || "",
      categoryLabel,
      card.querySelector(".product-card-description")?.textContent || ""
    ].join(" ");

    let options = [];

    try {
      options = JSON.parse(card.dataset.filterOptions || "[]");
    } catch (error) {
      options = [];
    }

    return {
      card,
      text: normalize(text),
      category: card.dataset.filterCategory || "",
      categoryLabel,
      options: options.filter((option) =>
        Number.isFinite(option.price) && option.price > 0
      )
    };
  });

  const filters = document.createElement("form");
  filters.className = "catalog-filters";
  filters.setAttribute("aria-label", "Filtre produse");

  filters.innerHTML = `
    <label for="filter-category">
      Categorie
      <select id="filter-category">
        <option value="">Toate categoriile</option>
      </select>
    </label>

    <label for="filter-age">
      Vârstă
      <select id="filter-age">
        <option value="">Toate vârstele</option>
      </select>
    </label>

    <label for="filter-min">
      Preț minim — lei
      <input
        id="filter-min"
        type="number"
        min="0"
        step="0.01"
        placeholder="Oricare"
      >
    </label>

    <label for="filter-max">
      Preț maxim — lei
      <input
        id="filter-max"
        type="number"
        min="0"
        step="0.01"
        placeholder="Oricare"
      >
    </label>

    <button type="button" class="filter-reset">
      Resetează filtrele
    </button>
  `;

  grid.before(filters);

  const category = filters.querySelector("#filter-category");
  const age = filters.querySelector("#filter-age");
  const min = filters.querySelector("#filter-min");
  const max = filters.querySelector("#filter-max");
  const reset = filters.querySelector(".filter-reset");

  const categories = new Map();

  products.forEach((product) => {
    if (product.category) {
      categories.set(product.category, product.categoryLabel);
    }
  });

  Array.from(categories.entries())
    .sort((a, b) => a[1].localeCompare(b[1], "ro"))
    .forEach(([value, label]) => {
      category.add(new Option(label, value));
    });

  const ages = new Set();

  products.forEach((product) => {
    product.options.forEach((option) => {
      if (Number(option.age) > 0) {
        ages.add(String(option.age));
      }
    });
  });

  Array.from(ages)
    .sort((a, b) => Number(a) - Number(b))
    .forEach((value) => {
      age.add(new Option(
        value + (Number(value) === 1 ? " an" : " ani"),
        value
      ));
    });

  category.value = params.get("categorie") || "";
  age.value = params.get("an") || "";

  function restorePrice(field, name) {
    const value = params.get(name);

    if (value !== null && value.trim() !== "" &&
        Number.isFinite(Number(value)) && Number(value) >= 0) {
      field.value = value;
    }
  }

  restorePrice(min, "min");
  restorePrice(max, "max");

  const status = document.createElement("p");
  status.className = "search-status";
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");
  grid.before(status);

  function updateUrl() {
    const url = new URL(window.location.href);

    const values = {
      q: input.value.trim(),
      categorie: category.value,
      an: age.value,
      min: min.value,
      max: max.value
    };

    Object.entries(values).forEach(([key, value]) => {
      if (value !== "") {
        url.searchParams.set(key, value);
      } else {
        url.searchParams.delete(key);
      }
    });

    window.history.replaceState(null, "", url);
  }

  function filterProducts() {
    const words = normalize(input.value).split(/\s+/).filter(Boolean);

    const minPrice = min.value === "" ? 0 : Number(min.value);
    const maxPrice = max.value === "" ? Infinity : Number(max.value);

    const invalidRange =
      !min.validity.valid ||
      !max.validity.valid ||
      minPrice > maxPrice;

    let count = 0;

    products.forEach((product) => {
      const matchesText =
        words.every((word) => product.text.includes(word));

      const matchesCategory =
        !category.value || product.category === category.value;

      const needsVariant =
        age.value !== "" || min.value !== "" || max.value !== "";

      const matchesVariant = !needsVariant ||
        product.options.some((option) =>
          (!age.value || String(option.age) === age.value) &&
          option.price >= minPrice &&
          option.price <= maxPrice
        );

      const matches =
        !invalidRange &&
        matchesText &&
        matchesCategory &&
        matchesVariant;

      product.card.hidden = !matches;
      if (matches) count++;
    });

    if (invalidRange) {
      status.textContent =
        "Verifică prețurile: folosește valori pozitive, cu minimul mai mic sau egal cu maximul.";
    } else {
      status.textContent = count
        ? count + " produse găsite."
        : "Nu am găsit produse. Schimbă filtrele sau căutarea.";
    }

    updateUrl();
  }

  input.addEventListener("input", filterProducts);

  filters.addEventListener("input", filterProducts);
  filters.addEventListener("change", filterProducts);

  filters.addEventListener("submit", (event) => {
    event.preventDefault();
    filterProducts();
  });

  input.form?.addEventListener("submit", (event) => {
    event.preventDefault();
    filterProducts();
    filters.scrollIntoView({ behavior: "smooth", block: "center" });
  });

  reset.addEventListener("click", () => {
    filters.reset();
    filterProducts();
  });

  filterProducts();
})();