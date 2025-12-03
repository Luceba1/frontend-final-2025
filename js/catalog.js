// js/catalog.js

// ----------------------- Catálogo ----------------------- //
let currentPage = 1;
const PRODUCTS_PER_PAGE = 12;

async function loadInitialData() {
  try {
    categories = await apiRequest(endpoints.categories);
    products = await apiRequest(endpoints.products);
    renderFilters();
    renderProducts();
    populateAdminCategorySelects();
  } catch (err) {
    console.error(err);
    alert("Error cargando productos/categorías: " + err.message);
  }
}

function renderFilters() {
  const select = document.getElementById("filter-category");
  select.innerHTML = '<option value="">Todas</option>';
  categories.forEach((c) => {
    const opt = document.createElement("option");
    opt.value = c.id_key;
    opt.textContent = c.name;
    select.appendChild(opt);
  });
}

function applyProductFilters() {
  const search = document.getElementById("filter-search").value.toLowerCase().trim();
  const categoryId = document.getElementById("filter-category").value;
  const maxPriceStr = document.getElementById("filter-max-price").value;
  const maxPrice = maxPriceStr ? parseFloat(maxPriceStr) : null;

  return products.filter((p) => {
    if (search && !p.name.toLowerCase().includes(search)) return false;
    if (categoryId && p.category_id !== parseInt(categoryId)) return false;
    if (maxPrice !== null && p.price > maxPrice) return false;
    return true;
  });
}

function renderProducts() {
  const grid = document.getElementById("products-grid");
  const empty = document.getElementById("products-empty");
  const pagination = document.getElementById("catalog-pagination"); // puede ser null

  // Siempre limpiar el grid
  grid.innerHTML = "";

  // Si no existe paginación (ADMIN / otras secciones), evitar errores
  if (pagination) pagination.innerHTML = "";

  const filtered = applyProductFilters();

  // -----------------------
  // 🟥 SIN PRODUCTOS
  // -----------------------
  if (!filtered.length) {
    empty.hidden = false;
    if (pagination) pagination.hidden = true;
    return;
  }

  empty.hidden = true;

  // -----------------------
  // 🔢 PAGINACIÓN (solo si existe el contenedor)
  // -----------------------
  const pageSize = 12;
  const totalPages = Math.ceil(filtered.length / pageSize);

  // Si no existe paginación (ADMIN), mostramos todo y salimos
  if (!pagination) {
    filtered.forEach(renderSingleCard);
    return;
  }

  // Asegurar que currentPage siempre sea válido
  if (currentPage < 1) currentPage = 1;
  if (currentPage > totalPages) currentPage = totalPages;

  const start = (currentPage - 1) * pageSize;
  const end = start + pageSize;
  const pageItems = filtered.slice(start, end);

  // -----------------------
  // 🟩 RENDER PRODUCTOS
  // -----------------------
  pageItems.forEach(renderSingleCard);

  // -----------------------
  // 🟦 RENDER PAGINACIÓN
  // -----------------------
  pagination.hidden = false;
  pagination.innerHTML = "";

  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement("button");
    btn.className = "page-btn";
    btn.textContent = i;
    if (i === currentPage) btn.classList.add("active");

    btn.addEventListener("click", () => {
      currentPage = i;
      renderProducts();
    });

    pagination.appendChild(btn);
  }
}

// ==============================
// 📦 FUNCIÓN RENDER CARD
// ==============================
function renderSingleCard(p) {
  const grid = document.getElementById("products-grid");
  const cat = categories.find((c) => c.id_key === p.category_id);

  const li = document.createElement("div");
  li.className = "product-card fade-in";

  const stockBadge =
    p.stock === 0
      ? '<span class="badge stock-out">Agotado</span>'
      : p.stock < 5
      ? '<span class="badge stock-low">Pocas unidades</span>'
      : '<span class="badge stock-ok">En stock</span>';

  li.innerHTML = `
    <div class="product-header">
      <div class="product-name">${p.name}</div>
      <div class="product-price">$${p.price.toFixed(2)}</div>
    </div>

    <div class="product-badges">
      <span class="badge">${cat ? cat.name : "Sin categoría"}</span>
      ${stockBadge}
      <span class="badge" data-rating-for="${p.id_key}">★ cargando...</span>
    </div>

    <div class="product-actions">
      <button class="btn tiny ghost btn-details" data-id="${p.id_key}">Detalles</button>
      <button class="btn tiny primary btn-add-cart"
        data-id="${p.id_key}"
        ${p.stock === 0 ? "disabled" : ""}
      >Agregar</button>
    </div>
  `;

  grid.appendChild(li);

  // Eventos
  li.querySelector(".btn-add-cart").addEventListener("click", () => addToCart(p.id_key));
  li.querySelector(".btn-details").addEventListener("click", () => openProductModal(p.id_key));

  // Cargar rating
  loadProductRating(p.id_key);
}



async function loadProductRating(productId) {
  // Pido el detalle para obtener la lista de reviews
  try {
    const productDetail = await apiRequest(`${endpoints.products}${productId}`);
    const reviews = productDetail.reviews || [];
    const badge = document.querySelector(`[data-rating-for="${productId}"]`);
    if (!badge) return;

    if (!reviews.length) {
      badge.textContent = "Sin reseñas";
      return;
    }
    const avg =
      reviews.reduce((acc, r) => acc + (r.rating || 0), 0) / reviews.length;
    badge.textContent = `★ ${avg.toFixed(1)} (${reviews.length})`;
  } catch (err) {
    console.warn("Error cargando rating:", err.message);
  }
}

// ----------------------- Modal de producto + reseñas ----------------------- //

// ----------------------- Modal de producto + reseñas ----------------------- //

function openModal(html) {
  const modal = document.getElementById("modal");
  const body = document.getElementById("modal-body");

  body.innerHTML = html;
  modal.hidden = false;
}

function closeModal() {
  document.getElementById("modal").hidden = true;
}

function setupModal() {
  document.getElementById("modal-close").addEventListener("click", closeModal);
  document.getElementById("modal").addEventListener("click", (e) => {
    if (e.target.id === "modal") closeModal();
  });
}

async function openProductModal(productId) {
  try {
    const product = await apiRequest(`${endpoints.products}${productId}`);
    const reviews = await apiRequest(endpoints.reviews);
    const productReviews = reviews.filter(r => r.product_id === product.id_key);

    const avg =
      productReviews.length > 0
        ? productReviews.reduce((a, r) => a + r.rating, 0) / productReviews.length
        : null;

    const cat = categories.find(c => c.id_key === product.category_id);

    const image =
      product.image_url ||
      "https://via.placeholder.com/900x600/1e293b/ffffff?text=Producto+sin+imagen";

    const html = `
      <div class="pm-container">

        <div class="pm-img-box">
          <img src="${image}" alt="${product.name}" class="pm-img"/>
        </div>

        <div class="pm-header-box">
          <h2 class="pm-title">${product.name}</h2>
          <p class="pm-category">${cat ? cat.name : "Sin categoría"}</p>
        </div>

        <div class="pm-price-box">
          <span class="pm-price">$${product.price.toFixed(2)}</span>
          <span class="pm-stock 
            ${product.stock === 0 ? "pm-stock-out" : product.stock < 5 ? "pm-stock-low" : ""}">
            ${
              product.stock === 0
                ? "Sin stock"
                : product.stock < 5
                ? "Pocas unidades"
                : `Stock: ${product.stock}`
            }
          </span>
        </div>

        <div class="pm-section">
          <h3>Reseñas</h3>
          ${
            avg !== null
              ? `<p class="pm-rating">★ ${avg.toFixed(1)} (${productReviews.length} reseñas)</p>`
              : `<p class="pm-no-reviews">Aún no hay reseñas para este producto.</p>`
          }

          <div class="pm-reviews">
            ${
              productReviews
                .map(
                  (r) => `
                <div class="pm-review-item">
                  <div class="pm-review-rating">★ ${r.rating.toFixed(1)}</div>
                  <div class="pm-review-comment">${r.comment || "(Sin comentario)"}</div>
                </div>
              `
                )
                .join("")
            }
          </div>
        </div>

        <div class="pm-section">
          <h3>Dejar una reseña</h3>
          <form id="review-form" class="pm-form">

            <label>Puntaje (1 a 5)
              <input type="number" name="rating" min="1" max="5" step="0.5" required />
            </label>

            <label>ID de cliente
              <input type="number" name="client_id" required />
            </label>

            <label>Comentario
              <textarea name="comment" minlength="10" placeholder="Escribe tu opinión..."></textarea>
            </label>

            <button class="btn primary full" type="submit">Enviar reseña</button>
          </form>
        </div>
      </div>
    `;

    openModal(html);

    const form = document.getElementById("review-form");
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const data = new FormData(form);

      const payload = {
        rating: parseFloat(data.get("rating")),
        client_id: parseInt(data.get("client_id")),
        product_id: product.id_key,
        comment: data.get("comment")
      };

      try {
        await apiRequest(endpoints.reviews, { method: "POST", body: payload });
        alert("¡Gracias por tu reseña!");
        openProductModal(productId);
      } catch (err) {
        alert("Error al enviar reseña: " + err.message);
      }
    });

  } catch (err) {
    alert("Error obteniendo detalle del producto: " + err.message);
  }
}