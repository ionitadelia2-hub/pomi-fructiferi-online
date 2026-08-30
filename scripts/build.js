const fs = require("fs");
const path = require("path");

const csvPath = path.join(__dirname, "..", "src", "data", "products.csv");
const distPath = path.join(__dirname, "..", "dist");
const cssSourcePath = path.join(__dirname, "..", "src", "css", "style.css");

function parseCSVLine(line) {
  const values = [];
  let current = "";
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      insideQuotes = !insideQuotes;
    } else if (char === "," && !insideQuotes) {
      values.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  values.push(current);
  return values.map((value) => value.replace(/^"|"$/g, "").trim());
}

function readProducts() {
  const csv = fs.readFileSync(csvPath, "utf8").trim();
  const lines = csv.split(/\r?\n/);

  const headers = parseCSVLine(lines[0]);

  return lines.slice(1).map((line) => {
    const values = parseCSVLine(line);

    return headers.reduce((product, header, index) => {
      product[header] = values[index] ?? "";
      return product;
    }, {});
  });
}

function createProductPage(product) {
  return `<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <title>${product.seo_title}</title>
  <meta name="description" content="${product.seo_description}">

  <link rel="canonical" href="https://pomifructiferionline.ro/produse/${product.slug}/">
  <link rel="stylesheet" href="/assets/css/style.css">
</head>
<body>

  <main>
    <article>
      <h1>${product.name}</h1>

      <p>${product.short_description}</p>

      <p><strong>Preț:</strong> ${product.price} lei</p>
      <p><strong>Stoc:</strong> ${product.stock}</p>
      <p><strong>Înălțime:</strong> ${product.height_cm} cm</p>
      <p><strong>Vârstă:</strong> ${product.age_years} ani</p>
      <p><strong>Tip rădăcină:</strong> ${product.root_type}</p>

      <h2>Descriere</h2>
      <p>${product.description}</p>

      <button type="button">Adaugă în coș</button>
    </article>
  </main>

</body>
</html>`;
}

function build() {
  const products = readProducts();

  if (fs.existsSync(distPath)) {
    fs.rmSync(distPath, { recursive: true, force: true });
  }

  fs.mkdirSync(distPath, { recursive: true });

  const cssDistFolder = path.join(distPath, "assets", "css");

fs.mkdirSync(cssDistFolder, { recursive: true });

fs.copyFileSync(
  cssSourcePath,
  path.join(cssDistFolder, "style.css")
);

  products.forEach((product) => {
    const productFolder = path.join(
      distPath,
      "produse",
      product.slug
    );

    fs.mkdirSync(productFolder, { recursive: true });

    const html = createProductPage(product);

    fs.writeFileSync(
      path.join(productFolder, "index.html"),
      html,
      "utf8"
    );

    console.log(`Generat: /produse/${product.slug}/`);
  });

  console.log(`\nBuild finalizat. Produse generate: ${products.length}`);
}

build();