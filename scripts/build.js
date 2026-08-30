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
    zmeura: "Zmeură"
  };

  return categoryNames[slug] || slug;
}

function createProductCard(product) {
  return `
    <article class="product-card">

    <a href="/produse/${escapeHtml(product.slug)}/" class="product-card-image-link">
  <img
    src="${escapeHtml(product.image_1)}"
    alt="${escapeHtml(product.name)} - pom fructifer"
    class="product-card-image"
    loading="lazy"
    width="600"
    height="600"
  >
</a>
      <h2 class="product-card-title">
        <a href="/produse/${escapeHtml(product.slug)}/">
          ${escapeHtml(product.name)}
        </a>
      </h2>

      <p class="product-card-description">
        ${escapeHtml(product.short_description)}
      </p>

      <p class="product-card-price">
        <strong>${escapeHtml(product.price)} lei</strong>
      </p>

      <p class="product-card-stock">
        ${
          Number(product.stock) > 0
            ? `În stoc: ${escapeHtml(product.stock)}`
            : "Stoc epuizat"
        }
      </p>

      <div class="product-card-actions">
        <a
          class="product-link"
          href="/produse/${escapeHtml(product.slug)}/"
        >
          Vezi produsul
        </a>

        <button
          type="button"
          class="add-to-cart"
          data-product-id="${escapeHtml(product.id)}"
        >
          Adaugă în coș
        </button>
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

            <strong>${escapeHtml(product.price)} lei</strong>
          </div>

          <p class="product-stock ${
            Number(product.stock) > 0 ? "in-stock" : "out-of-stock"
          }">
            ${
              Number(product.stock) > 0
                ? `✓ În stoc (${escapeHtml(product.stock)} buc.)`
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
              product.age_years
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
                    <strong>${escapeHtml(product.root_type)}</strong>
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


          <button
            type="button"
            class="add-to-cart product-add-to-cart"
            data-product-id="${escapeHtml(product.id)}"
            ${Number(product.stock) <= 0 ? "disabled" : ""}
          >
            Adaugă în coș
          </button>

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


      <!-- CARACTERISTICI -->
      <section class="product-section">

        <h2>Caracteristici</h2>

        <div class="product-specifications">

          ${
            product.planting_period
              ? `
                <div>
                  <span>Perioadă plantare</span>
                  <strong>${escapeHtml(product.planting_period)}</strong>
                </div>
              `
              : ""
          }

          ${
            product.harvest_period
              ? `
                <div>
                  <span>Perioadă recoltare</span>
                  <strong>${escapeHtml(product.harvest_period)}</strong>
                </div>
              `
              : ""
          }

          ${
            product.fruiting_period
              ? `
                <div>
                  <span>Perioadă fructificare</span>
                  <strong>${escapeHtml(product.fruiting_period)}</strong>
                </div>
              `
              : ""
          }

          ${
            product.sun_exposure
              ? `
                <div>
                  <span>Expunere</span>
                  <strong>${escapeHtml(product.sun_exposure)}</strong>
                </div>
              `
              : ""
          }

          ${
            product.soil_type
              ? `
                <div>
                  <span>Tip sol</span>
                  <strong>${escapeHtml(product.soil_type)}</strong>
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
                  <strong>${escapeHtml(product.fruit_color)}</strong>
                </div>
              `
              : ""
          }

          ${
            product.fruit_taste
              ? `
                <div>
                  <span>Gust</span>
                  <strong>${escapeHtml(product.fruit_taste)}</strong>
                </div>
              `
              : ""
          }

          ${
            product.fruit_size
              ? `
                <div>
                  <span>Mărime fruct</span>
                  <strong>${escapeHtml(product.fruit_size)}</strong>
                </div>
              `
              : ""
          }

          ${
            product.productivity
              ? `
                <div>
                  <span>Productivitate</span>
                  <strong>${escapeHtml(product.productivity)}</strong>
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
  </script>

</body>
</html>`;
}

function createProductsPage(products) {
  const productCards = products
    .map((product) => createProductCard(product))
    .join("");

  return `<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <title>Pomi fructiferi de vânzare | Pomi Fructiferi Online</title>

  <meta
    name="description"
    content="Descoperă pomi fructiferi de vânzare pentru grădină și livadă. Alege dintre meri, peri, pruni, cireși, caiși și numeroase alte soiuri."
  >

  <link rel="canonical" href="${SITE_URL}/produse/">
  <link rel="stylesheet" href="/assets/css/style.css">
</head>

<body>

  <main>
    <section class="products-page">
      <h1>Pomi fructiferi de vânzare</h1>

      <p class="category-intro">
        Descoperă soiurile disponibile de pomi fructiferi pentru
        grădină și livadă. Alege soiul potrivit în funcție de
        perioada de recoltare, caracteristicile fructelor și
        condițiile de plantare.
      </p>

      <div class="products-grid">
        ${productCards}
      </div>
    </section>
  </main>

</body>
</html>`;
}

function createCategoryPage(categorySlug, products) {
  const categoryName = getCategoryName(categorySlug);

  const productCards = products
    .map((product) => createProductCard(product))
    .join("");

  return `<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <title>${escapeHtml(categoryName)} de vânzare | Pomi Fructiferi Online</title>

  <meta
    name="description"
    content="Descoperă soiurile de ${escapeHtml(
      categoryName.toLowerCase()
    )} disponibile pentru grădină și livadă. Comandă online pomi fructiferi sănătoși și atent selecționați."
  >

  <link
    rel="canonical"
    href="${SITE_URL}/categorii/${escapeHtml(categorySlug)}/"
  >

  <link rel="stylesheet" href="/assets/css/style.css">
</head>

<body>

  <main>
    <nav class="breadcrumbs" aria-label="Breadcrumb">
      <a href="/">Acasă</a>
      <span>›</span>

      <a href="/produse/">Produse</a>
      <span>›</span>

      <span>${escapeHtml(categoryName)}</span>
    </nav>

    <section class="category-page">
      <h1>${escapeHtml(categoryName)} de vânzare</h1>

      <p class="category-intro">
        Descoperă soiurile de ${escapeHtml(
          categoryName.toLowerCase()
        )} disponibile în pepiniera noastră.
        Compară soiurile și alege pomii potriviți pentru grădina
        sau livada ta.
      </p>

      <div class="products-grid">
        ${productCards}
      </div>

      <section class="category-seo-content">
        <h2>Cum alegi ${escapeHtml(categoryName.toLowerCase())} pentru plantare?</h2>

        <p>
          Alegerea unui pom fructifer trebuie făcută în funcție de
          soi, perioada de coacere, condițiile de climă și spațiul
          disponibil. Pe pagina fiecărui produs vei găsi informații
          despre plantare, recoltare, dimensiuni și particularitățile
          soiului.
        </p>
      </section>
    </section>
  </main>

</body>
</html>`;
}

function build() {
  const products = readProducts();

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

  const imagesDistPath = path.join(distPath, "images");

if (fs.existsSync(imagesSourcePath)) {
  fs.cpSync(imagesSourcePath, imagesDistPath, {
    recursive: true
  });

  console.log("Copiat: /images/");
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
  const categories = [
    ...new Set(
      products
        .map((product) => product.subcategory)
        .filter(Boolean)
    )
  ];

  categories.forEach((categorySlug) => {
    const categoryProducts = products.filter(
      (product) =>
        product.subcategory === categorySlug
    );

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
  });

  console.log("");
  console.log("Build finalizat.");
  console.log(`Produse generate: ${products.length}`);
  console.log(`Categorii generate: ${categories.length}`);
}

build();