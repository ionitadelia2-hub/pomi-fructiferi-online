const fs = require("fs");
const path = require("path");

const csvPath = path.join(__dirname, "..", "src", "data", "products.csv");
const distPath = path.join(__dirname, "..", "dist");
const cssSourcePath = path.join(__dirname, "..", "src", "css", "style.css");
const imagesSourcePath = path.join(__dirname, "..", "public", "images");

const SITE_URL = "https://pomifructiferionline.ro";

function parseCSVLine(line) {
  const values = [];
  let current = "";
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"' && insideQuotes && nextChar === '"') {
      current += '"';
      i++;
    } else if (char === '"') {
      insideQuotes = !insideQuotes;
    } else if (char === "," && !insideQuotes) {
      values.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  values.push(current);

  return values.map((value) => value.trim());
}

function readProducts() {
  const csv = fs.readFileSync(csvPath, "utf8").trim();
  const lines = csv.split(/\r?\n/);

  if (lines.length < 2) {
    return [];
  }

  const headers = parseCSVLine(lines[0]);

  return lines
    .slice(1)
    .filter((line) => line.trim() !== "")
    .map((line) => {
      const values = parseCSVLine(line);

      return headers.reduce((product, header, index) => {
        product[header] = values[index] ?? "";
        return product;
      }, {});
    })
    .filter((product) => product.status === "active");
}


// ADAUGĂ FUNCȚIA AICI
function groupProducts(products, field) {
  return products.reduce((groups, product) => {
    const key = product[field];

    if (!key) {
      return groups;
    }

    if (!groups[key]) {
      groups[key] = [];
    }

    groups[key].push(product);

    return groups;
  }, {});
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getCategoryName(slug) {
  const categoryNames = {
    // Pomi fructiferi clasici
    mar: "Meri",
    par: "Peri",
    prun: "Pruni",
    cires: "Cireși",
    visin: "Vișini",
    cais: "Caiși",
    piersic: "Piersici",
    nectarin: "Nectarini",
    gutui: "Gutui",
    nuc: "Nuci",

    // Pomi columnari
    "mar-columnar": "Meri columnari",
    "par-columnar": "Peri columnari",
    "prun-columnar": "Pruni columnari",
    "cires-columnar": "Cireși columnari",
    "visin-columnar": "Vișini columnari",
    "cais-columnar": "Caiși columnari",
    "piersic-columnar": "Piersici columnari",

    // Viță de vie
    "soiuri-de-masa": "Soiuri de masă",
    "soiuri-de-vin": "Soiuri de vin",
    "soiuri-rezistente": "Soiuri rezistente",

    // Arbuști fructiferi
    zmeura: "Zmeură",
    mur: "Mur",
    afin: "Afin",
    coacaz: "Coacăz",
    agris: "Agriș",
    aronia: "Aronia",
    "catina": "Cătină"
  };

  return categoryNames[slug] || slug.replaceAll("-", " ");
}


function formatValue(value = "") {
  const map = {
    "radacina-nuda": "Rădăcină nudă",
    "toamna-primavara": "Toamnă – primăvară",
    "bine-drenat": "Bine drenat",
    "dulce-aromat": "Dulce și aromat",
    "mediu-mare": "Mediu – mare",
    "ridicata": "Ridicată",
    "august-octombrie": "August – octombrie",
    "septembrie-octombrie": "Septembrie – octombrie",
    "august-septembrie": "August – septembrie",
    "septembrie": "Septembrie",
    "galben": "Galben",
    "galben-verzui": "Galben-verzui",
    "albastru-violet": "Albastru-violet",
    "soare": "Soare",
    "mare": "Mare"
  };

  return map[value] || value.replaceAll("-", " ");
}

function createProductCard(product) {
  const categoryName = getCategoryName(product.subcategory);
  const inStock = Number(product.stock) > 0;

  return `
    <article class="product-card">

      <a
        href="/produse/${escapeHtml(product.slug)}/"
        class="product-card-image-link"
        aria-label="Vezi ${escapeHtml(product.name)}"
      >
        ${
          product.image_1
            ? `
              <img
                src="${escapeHtml(product.image_1)}"
                alt="${escapeHtml(product.name)}"
                class="product-card-image"
                loading="lazy"
                width="600"
                height="600"
              >
            `
            : `
              <div class="product-card-image-placeholder">
                Imagine indisponibilă
              </div>
            `
        }

        ${
          product.featured === "true"
            ? `<span class="product-badge">Recomandat</span>`
            : ""
        }
      </a>

      <div class="product-card-content">

        <p class="product-card-category">
          ${escapeHtml(categoryName)}
        </p>

        <h2 class="product-card-title">
          <a href="/produse/${escapeHtml(product.slug)}/">
            ${escapeHtml(product.name)}
          </a>
        </h2>

        <p class="product-card-description">
          ${escapeHtml(product.short_description)}
        </p>

        <div class="product-card-price-row">

          <div class="product-card-price">
            ${
              product.old_price
                ? `<span class="product-card-old-price">${escapeHtml(product.old_price)} lei</span>`
                : ""
            }

            <strong>${escapeHtml(product.price)} lei</strong>
          </div>

          <span class="product-card-stock ${inStock ? "in-stock" : "out-of-stock"}">
            ${inStock ? "În stoc" : "Stoc epuizat"}
          </span>

        </div>

        <div class="product-card-actions">

          <a
            class="product-link"
            href="/produse/${escapeHtml(product.slug)}/"
          >
            Vezi detalii
          </a>

          ${
  product.variants
    ? `
      <a
        href="/produse/${escapeHtml(product.slug)}/"
        class="product-card-cart product-card-variant-link"
      >
        Alege varianta
      </a>
    `
    : `
      <button
        type="button"
        class="add-to-cart product-card-cart"
        data-product-slug="${escapeHtml(product.slug)}"
        ${!inStock ? "disabled" : ""}
      >
        Adaugă în coș
      </button>
    `
}

        </div>

      </div>

    </article>
  `;
}

function createProductPage(product) {
  const categoryName = getCategoryName(product.subcategory);

  const images = [
    product.image_1,
    product.image_2,
    product.image_3
  ].filter(Boolean);

  const thumbnails = images
    .map(
      (image, index) => `
        <button
          type="button"
          class="product-thumbnail ${index === 0 ? "active" : ""}"
          data-image="${escapeHtml(image)}"
          aria-label="Vezi imaginea ${index + 1} pentru ${escapeHtml(product.name)}"
        >
          <img
            src="${escapeHtml(image)}"
            alt="${escapeHtml(product.name)} - imagine ${index + 1}"
            loading="${index === 0 ? "eager" : "lazy"}"
            width="160"
            height="160"
          >
        </button>
      `
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="icon" type="image/png" href="/images/branding/logo-pomifructiferi.png">

  <title>${escapeHtml(product.seo_title)}</title>

  <meta
    name="description"
    content="${escapeHtml(product.seo_description)}"
  >

  <meta property="og:type" content="product">
  <meta property="og:title" content="${escapeHtml(product.seo_title)}">
  <meta property="og:description" content="${escapeHtml(product.seo_description)}">
  <meta property="og:image" content="${SITE_URL}${escapeHtml(product.image_1)}">
  <meta property="og:url" content="${SITE_URL}/produse/${escapeHtml(product.slug)}/">

  <link
    rel="canonical"
    href="${SITE_URL}/produse/${escapeHtml(product.slug)}/"
  >

  <link rel="stylesheet" href="/assets/css/style.css">
</head>

<body>

${createHeader()}

  <main class="product-main">

    <nav class="breadcrumbs" aria-label="Breadcrumb">
      <a href="/">Acasă</a>
      <span>›</span>

      <a href="/produse/">Produse</a>
      <span>›</span>

      <a href="/categorii/${escapeHtml(product.subcategory)}/">
        ${escapeHtml(categoryName)}
      </a>
      <span>›</span>

      <span>${escapeHtml(product.name)}</span>
    </nav>


    <article class="product-page">

      <div class="product-top">

        <!-- GALERIE -->
        <section class="product-gallery">

          ${
            product.image_1
              ? `
                <div class="product-main-image-wrapper">
                  <img
                    id="product-main-image"
                    src="${escapeHtml(product.image_1)}"
                    alt="${escapeHtml(product.name)}"
                    class="product-main-image"
                    loading="eager"
                    width="900"
                    height="900"
                  >
                </div>
              `
              : ""
          }

          ${
            thumbnails
              ? `
                <div class="product-thumbnails">
                  ${thumbnails}
                </div>
              `
              : ""
          }

        </section>


        <!-- INFORMATII PRODUS -->
        <section class="product-info">

          <p class="product-category">
            ${escapeHtml(categoryName)}
          </p>

          <h1>${escapeHtml(product.name)}</h1>

          <p class="product-short-description">
            ${escapeHtml(product.short_description)}
          </p>

          <div class="product-price">
            ${
              product.old_price
                ? `<span class="old-price">${escapeHtml(product.old_price)} lei</span>`
                : ""
            }

            <strong
  id="product-current-price"
  data-base-price="${escapeHtml(product.price)}"
>
  ${escapeHtml(product.price)} lei
</strong>
          </div>

          <p class="product-stock ${
            Number(product.stock) > 0 ? "in-stock" : "out-of-stock"
          }">
            ${
              Number(product.stock) > 0
                ? `✓ În stoc`
                : "Stoc epuizat"
            }
          </p>


          <div class="product-quick-details">

            ${
              product.height_cm
                ? `
                  <div>
                    <span>Înălțime</span>
                    <strong>${escapeHtml(product.height_cm)} cm</strong>
                  </div>
                `
                : ""
            }

            ${
  product.variants
    ? `
      <div class="product-age-option">
        <span>Vârstă</span>

        <select
          class="product-variant-select"
          data-product-variant
          aria-label="Alege vârsta"
        >
          ${product.variants
            .split("|")
            .map((variant) => {
              const [age, price] = variant.split(":");

              return `
                <option
                  value="${escapeHtml(age)}"
                  data-price="${escapeHtml(price)}"
                >
                  ${escapeHtml(age)} ani — ${Number(price).toFixed(2)} lei
                </option>
              `;
            })
            .join("")}
        </select>
      </div>
    `
    : product.age_years
      ? `
        <div>
          <span>Vârstă</span>
          <strong>${escapeHtml(product.age_years)} ani</strong>
        </div>
      `
      : ""
}

            ${
              product.root_type
                ? `
                  <div>
                    <span>Tip rădăcină</span>
                    <strong>${escapeHtml(formatValue(product.root_type))}</strong>
                  </div>
                `
                : ""
            }

            ${
              product.variety
                ? `
                  <div>
                    <span>Soi</span>
                    <strong>${escapeHtml(product.variety)}</strong>
                  </div>
                `
                : ""
            }

          </div>


          <div class="product-buy-row">

  <div class="product-quantity-selector">

    <button
      type="button"
      class="product-quantity-button"
      data-product-minus
      aria-label="Scade cantitatea"
    >
      −
    </button>

    <input
      type="number"
      class="product-quantity-input"
      data-product-quantity
      value="1"
      min="1"
      step="1"
      inputmode="numeric"
      aria-label="Cantitate"
    >

    <button
      type="button"
      class="product-quantity-button"
      data-product-plus
      aria-label="Crește cantitatea"
    >
      +
    </button>

  </div>

  <button
    type="button"
    class="add-to-cart product-add-to-cart"
    data-product-slug="${escapeHtml(product.slug)}"
    ${Number(product.stock) <= 0 ? "disabled" : ""}
  >
    Adaugă în coș
  </button>

</div>

          <p class="product-delivery-note">
            Pom pregătit pentru plantare și livrare în condiții corespunzătoare.
          </p>

        </section>

      </div>


      <!-- DESCRIERE -->
      <section class="product-description product-section">

        <h2>Descriere</h2>

        <p>
          ${escapeHtml(product.description)}
        </p>

      </section>

            ${
        product.why_choose
          ? `
            <section class="product-section product-why-choose">
              <h2>
                De ce să alegi ${escapeHtml(product.name)}
              </h2>

              <p>
                ${escapeHtml(product.why_choose)}
              </p>
            </section>
          `
          : ""
      }


      ${
        product.key_benefits
          ? `
            <section class="product-section product-benefits-section">
              <h2>Beneficii cheie</h2>

              <ul class="product-benefits-list">
                ${product.key_benefits
                  .split("|")
                  .map((benefit) => benefit.trim())
                  .filter(Boolean)
                  .map(
                    (benefit) =>
                      `<li>${escapeHtml(benefit)}</li>`
                  )
                  .join("")}
              </ul>
            </section>
          `
          : ""
      }


            <!-- CARACTERISTICI -->
      <section class="product-section">

        <h2>Caracteristici</h2>

        <div class="product-specifications">

          ${
            product.planting_period
              ? `
                <div>
                  <span>Perioadă plantare</span>
                  <strong>${escapeHtml(formatValue(product.planting_period))}</strong>
                </div>
              `
              : ""
          }

          ${
            product.harvest_period
              ? `
                <div>
                  <span>Perioadă recoltare</span>
                  <strong>${escapeHtml(formatValue(product.harvest_period))}</strong>
                </div>
              `
              : ""
          }

          ${
            product.fruiting_period
              ? `
                <div>
                  <span>Perioadă fructificare</span>
                  <strong>${escapeHtml(formatValue(product.fruiting_period))}</strong>
                </div>
              `
              : ""
          }

          ${
            product.sun_exposure
              ? `
                <div>
                  <span>Expunere</span>
                  <strong>${escapeHtml(formatValue(product.sun_exposure))}</strong>
                </div>
              `
              : ""
          }

          ${
            product.soil_type
              ? `
                <div>
                  <span>Tip sol</span>
                  <strong>${escapeHtml(formatValue(product.soil_type))}</strong>
                </div>
              `
              : ""
          }

          ${
            product.frost_resistance
              ? `
                <div>
                  <span>Rezistență la ger</span>
                  <strong>${escapeHtml(product.frost_resistance)}°C</strong>
                </div>
              `
              : ""
          }

          ${
            product.fruit_color
              ? `
                <div>
                  <span>Culoare fruct</span>
                  <strong>${escapeHtml(formatValue(product.fruit_color))}</strong>
                </div>
              `
              : ""
          }

          ${
            product.fruit_taste
              ? `
                <div>
                  <span>Gust</span>
                  <strong>${escapeHtml(formatValue(product.fruit_taste))}</strong>
                </div>
              `
              : ""
          }

          ${
            product.fruit_size
              ? `
                <div>
                  <span>Mărime fruct</span>
                  <strong>${escapeHtml(formatValue(product.fruit_size))}</strong>
                </div>
              `
              : ""
          }

          ${
            product.productivity
              ? `
                <div>
                  <span>Productivitate</span>
                  <strong>${escapeHtml(formatValue(product.productivity))}</strong>
                </div>
              `
              : ""
          }

          ${
            product.self_fertile
              ? `
                <div>
                  <span>Autofertil</span>
                  <strong>
                    ${product.self_fertile === "true" ? "Da" : "Nu"}
                  </strong>
                </div>
              `
              : ""
          }

        </div>

      </section>

      ${
        product.care_notes
          ? `
            <section class="product-section product-care">
              <h2>Plantare și îngrijire</h2>

              <p>
                ${escapeHtml(product.care_notes)}
              </p>
            </section>
          `
          : ""
      }

            ${
        product.fruiting_period || product.harvest_period
          ? `
            <section class="product-section product-harvest-info">
              <h2>Fructificare și recoltare</h2>

              <p>
                ${
                  product.fruiting_period
                    ? `Perioada de fructificare este ${escapeHtml(
                        formatValue(product.fruiting_period)
                      )}. `
                    : ""
                }

                ${
                  product.harvest_period
                    ? `Recoltarea are loc în principal în perioada ${escapeHtml(
                        formatValue(product.harvest_period)
                      )}.`
                    : ""
                }
              </p>
            </section>
          `
          : ""
      }


      ${
        product.conclusion
          ? `
            <section class="product-section product-conclusion">
              <h2>Concluzie</h2>

              <p>
                ${escapeHtml(product.conclusion)}
              </p>
            </section>
          `
          : ""
      }

    </article>

  </main>


    <script>
    document.querySelectorAll(".product-thumbnail").forEach(function(button) {

      button.addEventListener("click", function() {

        const mainImage = document.getElementById("product-main-image");

        if (!mainImage) {
          return;
        }

        mainImage.src = this.dataset.image;

        document.querySelectorAll(".product-thumbnail").forEach(function(item) {
          item.classList.remove("active");
        });

        this.classList.add("active");

      });

    });


    const variantSelect =
      document.querySelector("[data-product-variant]");

    const currentPrice =
      document.getElementById("product-current-price");

    if (variantSelect && currentPrice) {
      variantSelect.addEventListener("change", function() {

        const selectedOption =
          variantSelect.options[variantSelect.selectedIndex];

        const price =
          selectedOption.dataset.price;

        if (!price) {
          return;
        }

        currentPrice.textContent =
          Number(price).toFixed(2) + " lei";

      });
    }

  </script>
<script src="/assets/js/cart.js"></script>
</body>
</html>`;
}

function createProductsPage(products) {
  const productCards = products
    .map((product) => createProductCard(product))
    .join("");

  const categories = [
    ...new Set(
      products
        .map((product) => product.subcategory)
        .filter(Boolean)
    )
  ];

  const categoryLinks = categories
    .map(
      (categorySlug) => `
        <a
          href="/categorii/${escapeHtml(categorySlug)}/"
          class="catalog-category-link"
        >
          ${escapeHtml(getCategoryName(categorySlug))}
        </a>
      `
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="icon" type="image/png" href="/images/branding/logo-pomifructiferi.png">

  <title>Pomi fructiferi de vânzare | Pomi Fructiferi Online</title>

  <meta
    name="description"
    content="Descoperă pomi fructiferi de vânzare pentru grădină și livadă. Alege dintre meri, peri, pruni și alte soiuri atent selecționate."
  >

  <link rel="canonical" href="${SITE_URL}/produse/">
  <link rel="stylesheet" href="/assets/css/style.css">
</head>

<body>

${createHeader()}

  <main class="catalog-main">

    <nav class="breadcrumbs" aria-label="Breadcrumb">
      <a href="/">Acasă</a>
      <span>›</span>
      <span>Produse</span>
    </nav>

    <section class="catalog-hero">

      <p class="catalog-eyebrow">
        Pepinieră online
      </p>

      <h1>Pomi fructiferi de vânzare</h1>

      <p class="catalog-intro">
        Descoperă pomii fructiferi disponibili pentru grădină și livadă.
        Compară soiurile, perioada de recoltare și caracteristicile fiecărui pom
        și alege varianta potrivită pentru spațiul tău.
      </p>

    </section>

    <nav class="catalog-categories" aria-label="Categorii produse">
      ${categoryLinks}
    </nav>

    <section class="catalog-products">

      <div class="catalog-heading">
        <div>
          <h2>Produse disponibile</h2>
          <p>${products.length} produse în catalog</p>
        </div>
      </div>

      <div class="products-grid">
        ${productCards}
      </div>

    </section>

    <section class="catalog-seo-content">

      <h2>Cum alegi pomii fructiferi potriviți?</h2>

      <p>
        Atunci când alegi un pom fructifer, ține cont de soi, perioada de
        plantare, perioada de recoltare, rezistența la ger, tipul de sol și
        spațiul disponibil. Pe pagina fiecărui produs găsești informațiile
        necesare pentru plantare și îngrijire.
      </p>

    </section>

  </main>
<script src="/assets/js/cart.js"></script>
</body>
</html>`;
}

function createCategoryPage(categorySlug, products) {
  const categoryName = getCategoryName(categorySlug);

  const productCards = products
    .map((product) => createProductCard(product))
    .join("");

  const categoryContent = {
    mar: {
      title: "Meri de vânzare",
      intro:
        "Descoperă soiurile de meri disponibile pentru grădină și livadă. Compară caracteristicile, perioada de recoltare și alege mărul potrivit pentru spațiul tău.",
      seoTitle: "Meri de vânzare | Pomi Fructiferi Online",
      seoDescription:
        "Descoperă meri de vânzare pentru grădină și livadă. Alege soiuri de măr atent selecționate și găsește pomul potrivit pentru plantare.",
      seoHeading: "Cum alegi soiul de măr potrivit?",
      seoText:
        "Atunci când alegi un măr, ține cont de perioada de recoltare, rezistența la ger, tipul de sol, productivitate și caracteristicile fructelor. Pe pagina fiecărui soi găsești informații detaliate despre plantare și îngrijire."
    },

    par: {
      title: "Peri de vânzare",
      intro:
        "Descoperă soiurile de peri disponibile pentru grădină și livadă. Compară perioada de recoltare, caracteristicile fructelor și condițiile de plantare.",
      seoTitle: "Peri de vânzare | Pomi Fructiferi Online",
      seoDescription:
        "Descoperă peri de vânzare pentru grădină și livadă. Compară soiurile disponibile și alege părul potrivit pentru plantare.",
      seoHeading: "Cum alegi soiul de păr potrivit?",
      seoText:
        "Alegerea unui păr depinde de soi, perioada de recoltare, rezistența la temperaturi scăzute și condițiile din grădină sau livadă. Consultă caracteristicile fiecărui produs înainte de plantare."
    },

    prun: {
      title: "Pruni de vânzare",
      intro:
        "Descoperă soiurile de pruni disponibile pentru grădină și livadă. Compară productivitatea, perioada de recoltare și caracteristicile fructelor.",
      seoTitle: "Pruni de vânzare | Pomi Fructiferi Online",
      seoDescription:
        "Descoperă pruni de vânzare pentru grădină și livadă. Alege dintre soiurile disponibile și găsește prunul potrivit pentru plantare.",
      seoHeading: "Cum alegi soiul de prun potrivit?",
      seoText:
        "Pentru alegerea unui prun potrivit, verifică perioada de fructificare și recoltare, rezistența la ger, productivitatea și cerințele față de sol și expunere."
    }
  };

  const content = categoryContent[categorySlug] || {
    title: `${categoryName} de vânzare`,
    intro: `Descoperă soiurile de ${categoryName.toLowerCase()} disponibile pentru grădină și livadă. Compară caracteristicile și alege pomii potriviți pentru spațiul tău.`,
    seoTitle: `${categoryName} de vânzare | Pomi Fructiferi Online`,
    seoDescription: `Descoperă ${categoryName.toLowerCase()} de vânzare pentru grădină și livadă. Compară soiurile disponibile și alege pomii potriviți pentru plantare.`,
    seoHeading: `Cum alegi ${categoryName.toLowerCase()} pentru plantare?`,
    seoText:
      "Atunci când alegi un pom fructifer, ține cont de soi, perioada de recoltare, rezistența la ger, tipul de sol și spațiul disponibil. Pe pagina fiecărui produs găsești informații detaliate despre plantare și îngrijire."
  };

  return `<!DOCTYPE html>
<html lang="ro">

<head>
  <meta charset="UTF-8">

  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  >

  <link rel="icon" type="image/png" href="/images/branding/logo-pomifructiferi.png">

  <title>${escapeHtml(content.seoTitle)}</title>

  <meta
    name="description"
    content="${escapeHtml(content.seoDescription)}"
  >

  <link
    rel="canonical"
    href="${SITE_URL}/categorii/${escapeHtml(categorySlug)}/"
  >

  <link
    rel="stylesheet"
    href="/assets/css/style.css"
  >
</head>

<body>

${createHeader()}

  <main class="catalog-main">

    <nav
      class="breadcrumbs"
      aria-label="Breadcrumb"
    >
      <a href="/">Acasă</a>

      <span>›</span>

      <a href="/produse/">Produse</a>

      <span>›</span>

      <span>${escapeHtml(categoryName)}</span>
    </nav>


    <section class="catalog-hero">

      <p class="catalog-eyebrow">
        Pomi fructiferi
      </p>

      <h1>
        ${escapeHtml(content.title)}
      </h1>

      <p class="catalog-intro">
        ${escapeHtml(content.intro)}
      </p>

      <a
        href="/produse/"
        class="category-back-link"
      >
        ← Vezi toți pomii fructiferi
      </a>

    </section>


    <section class="catalog-products">

      <div class="catalog-heading">

        <div>

          <h2>
            ${escapeHtml(categoryName)} disponibili
          </h2>

          <p>
            ${products.length}
            ${products.length === 1 ? "produs disponibil" : "produse disponibile"}
          </p>

        </div>

      </div>


      <div class="products-grid">
        ${productCards}
      </div>

    </section>


    <section class="catalog-seo-content">

      <h2>
        ${escapeHtml(content.seoHeading)}
      </h2>

      <p>
        ${escapeHtml(content.seoText)}
      </p>

    </section>

  </main>
<script src="/assets/js/cart.js"></script>
</body>

</html>`;
}

function createHeader() {
  return `
    <header class="site-header">
      <div class="site-header-inner">

        <a
  href="/"
  class="site-logo"
  aria-label="Pomi Fructiferi Online"
>
  <img
    src="/images/branding/logo-pomifructiferi.png"
    alt=""
    class="site-logo-image"
  >

  <span class="site-logo-text">
    <span class="site-logo-main">Pomi Fructiferi</span>
    <span class="site-logo-sub">online.ro</span>
  </span>
</a>

        <nav class="site-nav" aria-label="Navigație principală">
          <a href="/">Acasă</a>
          <div class="nav-dropdown">
  <a href="/produse/" class="nav-dropdown-trigger">Produse</a>

  <div class="nav-dropdown-menu">
    <a href="/pomi-fructiferi/">Pomi fructiferi</a>
    <a href="/pomi-columnari/">Pomi columnari</a>
    <a href="/vita-de-vie/">Viță de vie</a>
    <a href="/arbusti-fructiferi/">Arbuști fructiferi</a>
  </div>
</div>
          <a href="/servicii/">Servicii</a>
        </nav>

        <a href="/cos/" class="site-cart">
  Coș
  <span class="cart-count" data-cart-count>0</span>
</a>

      </div>
    </header>
  `;
}

function createFamilyPage(familySlug, products) {
  const familyContent = {
    "pomi-fructiferi": {
      title: "Pomi fructiferi",
      eyebrow: "Catalog",
      intro:
        "Descoperă pomii fructiferi disponibili pentru grădină, livadă și plantații. Alege specia și soiul potrivit pentru spațiul tău.",
      seoTitle: "Pomi fructiferi de vânzare | Pomi Fructiferi Online",
      seoDescription:
        "Descoperă pomi fructiferi de vânzare: meri, peri, pruni, cireși, vișini, caiși, piersici, nectarini, gutui și alte specii."
    },

    "pomi-columnari": {
      title: "Pomi columnari",
      eyebrow: "Catalog",
      intro:
        "Descoperă soiurile de pomi columnari, potrivite pentru grădini mici, curți și spații unde dorești pomi productivi cu dezvoltare compactă.",
      seoTitle: "Pomi columnari de vânzare | Pomi Fructiferi Online",
      seoDescription:
        "Descoperă pomi columnari de vânzare pentru grădini și spații mici. Alege dintre meri, peri, pruni, cireși și alte specii columnare."
    },

    "vita-de-vie": {
      title: "Viță de vie",
      eyebrow: "Catalog",
      intro:
        "Descoperă soiurile de viță de vie disponibile: soiuri de masă, soiuri pentru vin și soiuri hibride sau rezistente.",
      seoTitle: "Viță de vie de vânzare | Pomi Fructiferi Online",
      seoDescription:
        "Descoperă soiuri de viță de vie de vânzare, altoite și atent selecționate pentru grădină și plantații."
    },

    "arbusti-fructiferi": {
      title: "Arbuști fructiferi",
      eyebrow: "Catalog",
      intro:
        "Descoperă arbuști fructiferi pentru grădină și plantații, soiuri productive și ușor de integrat în spații de diferite dimensiuni.",
      seoTitle: "Arbuști fructiferi de vânzare | Pomi Fructiferi Online",
      seoDescription:
        "Descoperă arbuști fructiferi de vânzare pentru grădină și plantații."
    }
  };

 const content = familyContent[familySlug] || {
  title: familySlug.replaceAll("-", " "),
  eyebrow: "Catalog",
  intro: "Descoperă produsele disponibile în această categorie.",
  seoTitle: `${familySlug.replaceAll("-", " ")} | Pomi Fructiferi Online`,
  seoDescription: "Descoperă produsele disponibile în catalogul nostru."
};

const categorySectionTitle =
  familySlug === "vita-de-vie"
    ? "Alege după tip"
    : "Alege după specie";

const subcategories = groupProducts(products, "subcategory");

  const categoryCards = Object.entries(subcategories)
    .map(([subcategorySlug, categoryProducts]) => {
      const categoryName = getCategoryName(subcategorySlug);

      return `
        <a
          href="/categorii/${escapeHtml(subcategorySlug)}/"
          class="home-category-card"
        >
          <span class="home-category-name">
            ${escapeHtml(categoryName)}
          </span>

          <span class="home-category-link">
            ${categoryProducts.length}
            ${categoryProducts.length === 1 ? "produs" : "produse"}
            →
          </span>
        </a>
      `;
    })
    .join("");

  const productCards = products
    .map((product) => createProductCard(product))
    .join("");

  return `<!DOCTYPE html>
<html lang="ro">

<head>
  <meta charset="UTF-8">
  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  >

<link rel="icon" type="image/png" href="/images/branding/logo-pomifructiferi.png">

  <title>${escapeHtml(content.seoTitle)}</title>

  <meta
    name="description"
    content="${escapeHtml(content.seoDescription)}"
  >

  <link
    rel="canonical"
    href="${SITE_URL}/${escapeHtml(familySlug)}/"
  >

  <link
    rel="stylesheet"
    href="/assets/css/style.css"
  >
</head>

<body>

${createHeader()}

<main class="catalog-main">

  <nav class="breadcrumbs" aria-label="Breadcrumb">
    <a href="/">Acasă</a>
    <span>›</span>
    <span>${escapeHtml(content.title)}</span>
  </nav>


  <section class="catalog-hero">

    <p class="catalog-eyebrow">
      ${escapeHtml(content.eyebrow)}
    </p>

    <h1>
      ${escapeHtml(content.title)}
    </h1>

    <p class="catalog-intro">
      ${escapeHtml(content.intro)}
    </p>

  </section>


  <section class="home-section">

    <div class="home-section-heading">

      <p class="home-eyebrow">
        Categorii
      </p>

      <h2>
  ${escapeHtml(categorySectionTitle)}
</h2>

      <p>
        Găsește rapid produsele potrivite pentru grădina
        sau livada ta.
      </p>

    </div>

    <div class="home-category-grid">
      ${categoryCards}
    </div>

  </section>


  <section class="catalog-products">

    <div class="catalog-heading">

      <div>
        <h2>Produse disponibile</h2>

        <p>
          ${products.length}
          ${products.length === 1 ? "produs disponibil" : "produse disponibile"}
        </p>
      </div>

    </div>

    <div class="products-grid">
      ${productCards}
    </div>

  </section>

</main>
<script src="/assets/js/cart.js"></script>
</body>
</html>`;
}

function createHomePage(products) {
  const featuredProducts = products
    .filter((product) => product.featured === "true")
    .slice(0, 6);

  const featuredCards = featuredProducts
    .map((product) => createProductCard(product))
    .join("");

    const familyCards = [
  {
    slug: "pomi-fructiferi",
    name: "Pomi fructiferi",
    description: "Meri, peri, pruni și alte specii pentru grădină și livadă."
  },
  {
    slug: "pomi-columnari",
    name: "Pomi columnari",
    description: "Pomi compacți și productivi, potriviți pentru spații mai mici."
  },
  {
    slug: "vita-de-vie",
    name: "Viță de vie",
    description: "Soiuri de masă și soiuri pentru vin."
  },
  {
    slug: "arbusti-fructiferi",
    name: "Arbuști fructiferi",
    description: "Zmeur, afin, mur și alte specii pentru grădină."
  }
];

const familyCardsHtml = familyCards
  .map((family) => {
    const familyProducts = products.filter(
      (product) => product.family === family.slug
    );

    return `
      <a href="/${family.slug}/" class="home-category-card">

        <span class="home-category-name">
          ${family.name}
        </span>

        <span class="home-category-description">
          ${family.description}
        </span>

        <span class="home-category-link">
          ${familyProducts.length}
          ${familyProducts.length === 1 ? "produs" : "produse"}
          →
        </span>

      </a>
    `;
  })
  .join("");

  return `<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="icon" type="image/png" href="/images/branding/logo-pomifructiferi.png">

  <title>Pomi fructiferi de vânzare | Pomi Fructiferi Online</title>

  <meta
    name="description"
    content="Pomi fructiferi, soiuri pentru grădină și livadă, material săditor atent selecționat și informații complete pentru plantare și îngrijire."
  >

  <link rel="canonical" href="${SITE_URL}/">
  <link rel="stylesheet" href="/assets/css/style.css">
</head>

<body>

${createHeader()}

  <main>

    <section class="home-hero">
      <div class="home-hero-content">

        <p class="home-eyebrow">
          Pomi sănătoși • recolte bogate
        </p>

        <h1>
          Pomi fructiferi pentru grădini și livezi productive
        </h1>

        <p class="home-hero-text">
          Descoperă soiuri de pomi fructiferi atent selecționate,
          potrivite pentru grădini, livezi și plantații.
          Informații clare despre plantare, îngrijire și recoltare.
        </p>

        <div class="home-hero-actions">
          <a href="/produse/" class="home-primary-button">
            Vezi produsele
          </a>

          <a href="/servicii/" class="home-secondary-button">
            Vezi serviciile
          </a>
        </div>

      </div>
    </section>


    <section class="home-section">
      <div class="home-section-heading">

        <p class="home-eyebrow">
  Catalog
</p>

<h2>
  Alege categoria potrivită
</h2>

<p>
  Descoperă plantele disponibile pentru grădină, livadă sau plantație.
</p>

      </div>

        <div class="home-category-grid">
  ${familyCardsHtml}
</div>

    </section>


    ${
      featuredProducts.length
        ? `
        <section class="home-section home-featured">

          <div class="home-section-heading home-heading-row">

            <div>
              <p class="home-eyebrow">
                Recomandările noastre
              </p>

              <h2>
                Produse recomandate
              </h2>
            </div>

            <a href="/produse/" class="home-view-all">
              Vezi toate produsele →
            </a>

          </div>

          <div class="products-grid">
            ${featuredCards}
          </div>

        </section>
        `
        : ""
    }


    <section class="home-section">

      <div class="home-section-heading">

        <p class="home-eyebrow">
          De ce noi
        </p>

        <h2>
          Tot ce ai nevoie pentru o plantare reușită
        </h2>

      </div>

      <div class="home-benefits">

        <article class="home-benefit">
          <h3>Material săditor de calitate</h3>
          <p>
            Pomi atent selecționați, pregătiți pentru plantare
            și dezvoltare sănătoasă.
          </p>
        </article>

        <article class="home-benefit">
          <h3>Informații clare</h3>
          <p>
            Pentru fiecare soi găsești date despre plantare,
            recoltare, sol, expunere și îngrijire.
          </p>
        </article>

        <article class="home-benefit">
          <h3>Livrare în țară</h3>
          <p>
            Pregătim plantele corespunzător pentru transport
            și livrare în condiții bune.
          </p>
        </article>

      </div>

    </section>


    <section class="home-services">

      <div class="home-services-content">

        <p class="home-eyebrow">
          Servicii
        </p>

        <h2>
          Servicii pentru livezi și plantații
        </h2>

        <p>
          Oferim servicii pentru înființarea și întreținerea
          livezilor și plantațiilor: plantare, tăieri,
          tratamente și consultanță.
        </p>

        <a href="/servicii/" class="home-primary-button">
          Descoperă serviciile
        </a>

      </div>

    </section>


    <section class="home-section home-seo">

      <h2>
        Pomi fructiferi pentru grădină și livadă
      </h2>

      <p>
        Alegerea pomilor fructiferi potriviți începe cu soiul,
        condițiile de plantare și spațiul disponibil.
        În catalogul nostru poți compara caracteristicile
        diferitelor soiuri și poți găsi informații utile despre
        perioada de recoltare, rezistența la ger,
        tipul de sol și îngrijirea recomandată.
      </p>

    </section>

  </main>
<script src="/assets/js/cart.js"></script>
</body>
</html>`;
}

function createCartPage(products) {
  const productsJson = JSON.stringify(
    products.map((product) => ({
      slug: product.slug,
      name: product.name,
      price: Number(product.price),
      image_1: product.image_1,
      stock: Number(product.stock),
    }))
  ).replace(/</g, "\\u003c");

  return `<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="icon" type="image/png" href="/images/branding/logo-pomifructiferi.png">

  <title>Coș de cumpărături | Pomi Fructiferi Online</title>
  <meta
    name="description"
    content="Vezi produsele adăugate în coș și modifică cantitățile."
  >

  <link rel="stylesheet" href="/assets/css/style.css">
</head>

<body>

  ${createHeader()}

  <main class="cart-page">
    <div class="container">

      <nav class="breadcrumb">
        <a href="/">Acasă</a>
        <span>›</span>
        <span>Coș</span>
      </nav>

      <section class="cart-header">
        <span class="eyebrow">COMANDA TA</span>

        <h1>Coș de cumpărături</h1>

        <p>
          Verifică produsele și modifică numărul de bucăți înainte de comandă.
        </p>
      </section>

      <section class="cart-layout">

        <div>
          <div id="cart-items"></div>
        </div>

        <aside class="cart-summary">
          <h2>Sumar comandă</h2>

          <div class="cart-summary-row">
            <span>Produse</span>
            <strong id="cart-summary-count">0 buc.</strong>
          </div>

          <div class="cart-summary-row">
  <span>Transport</span>
  <strong id="cart-shipping">0.00 lei</strong>
</div>

          <div class="cart-summary-row cart-summary-total">
            <span>Total</span>
            <strong id="cart-total">0.00 lei</strong>
          </div>

          <a
  href="/checkout/"
  class="cart-checkout-button"
  id="cart-checkout-button"
>
  Continuă comanda
</a>
        </aside>

      </section>

    </div>
  </main>

  <script>
    window.PRODUCTS = ${productsJson};
  </script>

  <script src="/assets/js/cart.js"></script>

</body>
</html>`;
}

function createCheckoutPage(products) {
  const productsJson = JSON.stringify(
    products.map((product) => ({
      slug: product.slug,
      name: product.name,
      price: Number(product.price),
      image_1: product.image_1,
      stock: Number(product.stock),
    }))
  ).replace(/</g, "\\u003c");

  return `<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="icon" type="image/png" href="/images/branding/logo-pomifructiferi.png">

  <title>Finalizare comandă | Pomi Fructiferi Online</title>

  <meta
    name="description"
    content="Completează datele pentru finalizarea comenzii."
  >

  <link rel="stylesheet" href="/assets/css/style.css">
</head>

<body>

  ${createHeader()}

  <main class="checkout-page">
    <div class="container">

      <nav class="breadcrumb">
        <a href="/">Acasă</a>
        <span>›</span>
        <a href="/cos/">Coș</a>
        <span>›</span>
        <span>Finalizare comandă</span>
      </nav>

      <section class="checkout-header">
        <span class="eyebrow">FINALIZARE COMANDĂ</span>

        <h1>Date pentru livrare</h1>

        <p>
          Completează informațiile de mai jos pentru pregătirea și livrarea comenzii.
        </p>
      </section>

      <div class="checkout-layout">

        <form
          id="checkout-form"
          class="checkout-form"
          novalidate
        >

          <h2>Date client</h2>

          <div class="checkout-fields">

            <div class="checkout-field">
              <label for="customer-name">
                Nume și prenume *
              </label>

              <input
                type="text"
                id="customer-name"
                name="name"
                autocomplete="name"
                required
              >
            </div>

            <div class="checkout-field">
              <label for="customer-phone">
                Telefon *
              </label>

              <input
                type="tel"
                id="customer-phone"
                name="phone"
                autocomplete="tel"
                required
              >
            </div>

            <div class="checkout-field">
              <label for="customer-email">
                Email
              </label>

              <input
                type="email"
                id="customer-email"
                name="email"
                autocomplete="email"
              >
            </div>

            <div class="checkout-field">
  <label for="customer-county">
    Județ *
  </label>

  <select
    id="customer-county"
    name="county"
    required
  >
    <option value="">
      Alege județul
    </option>
  </select>
</div>

           <div class="checkout-field">
  <label for="customer-city">
    Localitate *
  </label>

  <select
    id="customer-city"
    name="city"
    required
    disabled
  >
    <option value="">
      Alege mai întâi județul
    </option>
  </select>
</div>

            <div class="checkout-field checkout-field-full">
              <label for="customer-address">
                Adresă *
              </label>

              <input
                type="text"
                id="customer-address"
                name="address"
                autocomplete="street-address"
                required
              >
            </div>

            <div class="checkout-field checkout-field-full">
              <label for="customer-notes">
                Observații
              </label>

              <textarea
                id="customer-notes"
                name="notes"
                rows="5"
                placeholder="Ex: sunați înainte de livrare"
              ></textarea>
            </div>

          </div>

          <label class="checkout-consent">
            <input
              type="checkbox"
              name="terms"
              required
            >

            <span>
              Confirm că datele introduse sunt corecte și doresc trimiterea comenzii.
            </span>
          </label>

          <div
            id="checkout-error"
            class="checkout-error"
            hidden
          ></div>

          <button
            type="submit"
            class="checkout-submit-button"
          >
            Trimite comanda
          </button>

        </form>

       <aside class="checkout-summary">
  <h2>Comanda ta</h2>

  <div id="checkout-items"></div>

  <div class="checkout-summary-row">
    <span>Transport</span>
    <strong id="checkout-shipping">
      30.00 lei
    </strong>
  </div>

  <div class="checkout-total-row">
    <span>Total</span>
    <strong id="checkout-total">
      0.00 lei
    </strong>
  </div>
</aside>

      </div>

    </div>
  </main>

  <script>
    window.PRODUCTS = ${productsJson};
  </script>

  <script src="/assets/js/cart.js"></script>
  <script src="/assets/js/checkout.js"></script>

</body>
</html>`;
}

function generateOrderSuccessPage() {
  const pageHtml = `
<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="icon" type="image/png" href="/images/branding/logo-pomifructiferi.png">

  <title>Comandă trimisă | Pomi Fructiferi Online</title>

  <link rel="stylesheet" href="/assets/css/style.css">
</head>

<body>

  ${createHeader()}

  <main class="order-success-page">
    <div class="container">

      <section class="order-success-card">

        <div class="order-success-icon">
          ✓
        </div>

        <p class="eyebrow">
          COMANDĂ ÎNREGISTRATĂ
        </p>

        <h1>
          Mulțumim pentru comandă!
        </h1>

        <p class="order-success-text">
          Comanda ta a fost înregistrată cu succes.
          Te vom contacta pentru confirmarea și
          pregătirea livrării.
        </p>

        <div class="order-success-details">

          <div>
            <span>Număr comandă</span>
            <strong id="success-order-number">
              —
            </strong>
          </div>

          <div>
            <span>Total comandă</span>
            <strong id="success-order-total">
              —
            </strong>
          </div>

        </div>

        <a href="/produse/" class="button button-primary">
          Continuă cumpărăturile
        </a>

      </section>

    </div>
  </main>

  <script src="/assets/js/order-success.js"></script>

</body>
</html>
  `;

  const outputDir = path.join(
    distPath,
    "comanda-trimisa"
  );

  fs.mkdirSync(outputDir, {
    recursive: true,
  });

  fs.writeFileSync(
    path.join(outputDir, "index.html"),
    pageHtml
  );

  console.log(
    "Generat: /comanda-trimisa/"
  );
}

function createServicesPage() {
  return `<!DOCTYPE html>
<html lang="ro">

<head>
  <meta charset="UTF-8">
  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  >

  <link
    rel="icon"
    type="image/png"
    href="/images/branding/logo-pomifructiferi.png"
  >

  <title>Servicii pentru livezi și plantații | Pomi Fructiferi Online</title>

  <meta
    name="description"
    content="Servicii profesionale pentru livezi și plantații: plantare pomi fructiferi, tăieri, tratamente fitosanitare și înființare plantații viticole."
  >

  <link
    rel="canonical"
    href="${SITE_URL}/servicii/"
  >

  <link
    rel="stylesheet"
    href="/assets/css/style.css"
  >
</head>

<body>

  ${createHeader()}

  <main class="services-page">

    <section class="services-hero">

      <p class="home-eyebrow">
        Servicii profesionale
      </p>

      <h1>
        Servicii pentru livezi și plantații
      </h1>

      <p class="services-hero-text">
        Oferim servicii pentru înființarea și întreținerea
        livezilor și plantațiilor, de la plantare până la
        lucrările de întreținere.
      </p>

    </section>


    <section class="services-section">

      <div class="services-grid">

        <article class="service-card">
          <div class="service-icon">🌱</div>

          <h2>Plantare livezi</h2>

          <p>
            Plantăm livezi de pomi fructiferi profesional,
            cu material săditor de calitate și atenție la
            condițiile specifice terenului.
          </p>
        </article>


        <article class="service-card">
          <div class="service-icon">✂️</div>

          <h2>Tăieri livezi</h2>

          <p>
            Efectuăm tăieri de formare și întreținere pentru
            dezvoltarea unei coroane sănătoase și obținerea
            unor producții bune.
          </p>
        </article>


        <article class="service-card">
          <div class="service-icon">💧</div>

          <h2>Tratamente livezi</h2>

          <p>
            Realizăm lucrări și tratamente fitosanitare
            pentru protecția pomilor și menținerea unei
            livezi sănătoase.
          </p>
        </article>


        <article class="service-card">
          <div class="service-icon">🍇</div>

          <h2>Plantații viticole</h2>

          <p>
            Oferim servicii pentru înființarea plantațiilor
            viticole și alegerea materialului săditor
            potrivit proiectului.
          </p>
        </article>

      </div>

    </section>


    <section class="services-contact">

      <p class="home-eyebrow">
        Ai nevoie de ajutor?
      </p>

      <h2>
        Cere o ofertă pentru lucrarea ta
      </h2>

      <p>
        Spune-ne ce tip de lucrare dorești, suprafața
        aproximativă și localitatea, iar noi putem discuta
        detaliile proiectului.
      </p>

      <div class="services-phone-buttons">
  <a href="tel:0774705738" class="home-primary-button">
    Sună: 0774 705 738
  </a>

  <a href="tel:0769929982" class="home-primary-button">
    Sună: 0769 929 982
  </a>
</div>

    </section>

  </main>

  <script src="/assets/js/cart.js"></script>

</body>
</html>`;
}

function build() {
   const products = readProducts();

  const families = groupProducts(products, "family");
  const productTypes = groupProducts(products, "product_type");
  const categories = groupProducts(products, "category");
  const subcategories = groupProducts(products, "subcategory");

  if (fs.existsSync(distPath)) {
    fs.rmSync(distPath, {
      recursive: true,
      force: true
    });
  }

  fs.mkdirSync(distPath, {
    recursive: true
  });

  // CSS
  const cssDistFolder = path.join(
    distPath,
    "assets",
    "css"
  );

  fs.mkdirSync(cssDistFolder, {
    recursive: true
  });

  fs.copyFileSync(
    cssSourcePath,
    path.join(cssDistFolder, "style.css")
  );

  const jsDistFolder = path.join(
  distPath,
  "assets",
  "js"
);

fs.mkdirSync(jsDistFolder, {
  recursive: true
});

fs.copyFileSync(
  path.join(__dirname, "..", "src", "js", "cart.js"),
  path.join(jsDistFolder, "cart.js")
);

fs.copyFileSync(
  path.join(__dirname, "..", "src", "js", "checkout.js"),
  path.join(jsDistFolder, "checkout.js")
);

fs.copyFileSync(
  path.join(__dirname, "..", "src", "js", "order-success.js"),
  path.join(jsDistFolder, "order-success.js")
);

  const imagesDistPath = path.join(distPath, "images");

if (fs.existsSync(imagesSourcePath)) {
  fs.cpSync(imagesSourcePath, imagesDistPath, {
    recursive: true
  });

  console.log("Copiat: /images/");
}

const dataSourceFolder = path.join(
  __dirname,
  "..",
  "public",
  "data"
);

const dataDistFolder = path.join(
  distPath,
  "data"
);

if (fs.existsSync(dataSourceFolder)) {
  fs.cpSync(
    dataSourceFolder,
    dataDistFolder,
    {
      recursive: true
    }
  );

  console.log("Copiat: /data/");
}

  // Pagini produse individuale
  products.forEach((product) => {
    const productFolder = path.join(
      distPath,
      "produse",
      product.slug
    );

    fs.mkdirSync(productFolder, {
      recursive: true
    });

    fs.writeFileSync(
      path.join(productFolder, "index.html"),
      createProductPage(product),
      "utf8"
    );

    console.log(
      `Generat: /produse/${product.slug}/`
    );
  });

  // Pagina toate produsele
  const productsFolder = path.join(
    distPath,
    "produse"
  );

  fs.mkdirSync(productsFolder, {
    recursive: true
  });

  fs.writeFileSync(
    path.join(productsFolder, "index.html"),
    createProductsPage(products),
    "utf8"
  );

  console.log("Generat: /produse/");

  // Categorii generate automat
Object.entries(subcategories).forEach(
  ([categorySlug, categoryProducts]) => {

    const categoryFolder = path.join(
      distPath,
      "categorii",
      categorySlug
    );

    fs.mkdirSync(categoryFolder, {
      recursive: true
    });

    fs.writeFileSync(
      path.join(categoryFolder, "index.html"),
      createCategoryPage(
        categorySlug,
        categoryProducts
      ),
      "utf8"
    );

    console.log(
      `Generat: /categorii/${categorySlug}/ (${categoryProducts.length} produse)`
    );
  }
);

  // Familii de produse generate automat
  Object.entries(families).forEach(
    ([familySlug, familyProducts]) => {

      const familyFolder = path.join(
        distPath,
        familySlug
      );

      fs.mkdirSync(familyFolder, {
        recursive: true
      });

      fs.writeFileSync(
        path.join(familyFolder, "index.html"),
        createFamilyPage(
          familySlug,
          familyProducts
        ),
        "utf8"
      );

      console.log(
        `Generat: /${familySlug}/ (${familyProducts.length} produse)`
      );
    }
  );

// Pagina Servicii
const servicesFolder = path.join(
  distPath,
  "servicii"
);

fs.mkdirSync(servicesFolder, {
  recursive: true
});

fs.writeFileSync(
  path.join(servicesFolder, "index.html"),
  createServicesPage(),
  "utf8"
);

console.log("Generat: /servicii/");

  // Cart
const cartFolder = path.join(
  distPath,
  "cos"
);

fs.mkdirSync(cartFolder, {
  recursive: true
});

fs.writeFileSync(
  path.join(cartFolder, "index.html"),
  createCartPage(products),
  "utf8"
);

console.log("Generat: /cos/");

// Checkout
const checkoutFolder = path.join(
  distPath,
  "checkout"
);

fs.mkdirSync(checkoutFolder, {
  recursive: true
});

fs.writeFileSync(
  path.join(checkoutFolder, "index.html"),
  createCheckoutPage(products),
  "utf8"
);

console.log("Generat: /checkout/");

generateOrderSuccessPage();

  // Homepage
  fs.writeFileSync(
    path.join(distPath, "index.html"),
    createHomePage(products),
    "utf8"
  );

  console.log("Generat: /");


  console.log("");
  console.log("Build finalizat.");
  console.log(`Produse generate: ${products.length}`);
  console.log(
  `Categorii principale: ${Object.keys(categories).length}`
);

console.log(
  `Subcategorii generate: ${Object.keys(subcategories).length}`
);

console.log(
  `Familii produse: ${Object.keys(families).length}`
);

console.log(
  `Tipuri produse: ${Object.keys(productTypes).length}`
);
}

build();