// js/admin.js

// ----------------------- Admin: login super simple ----------------------- //

function setupAdminLogin() {
  const btn = document.getElementById("btn-admin-login");
  btn.addEventListener("click", () => {
    const pin = document.getElementById("admin-pin").value;
    // Demo: cualquier PIN no vacío deja entrar
    if (!pin) {
      alert("Ingresá un PIN (demo).");
      return;
    }
    adminLogged = true;
    document.getElementById("admin-auth").hidden = true;
    const content = document.getElementById("admin-content");
    content.hidden = false;
    loadAdminData();
  });
}

function setupAdminTabs() {
  const tabs = document.querySelectorAll(".admin-tab");
  const panels = document.querySelectorAll(".admin-panel");

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const target = tab.dataset.adminTab;
      tabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");

      panels.forEach((p) => {
        p.classList.toggle(
          "visible",
          p.dataset.adminPanel === target
        );
      });
    });
  });
}

// ----------------------- Admin: Salud (/health_check) ----------------------- //

async function loadHealthStatus() {
  const container = document.getElementById("health-summary");

  // Cargamos estructura visual
  container.innerHTML = `
    <div id="health-dashboard">
      <div class="health-grid">

        <div class="health-card" id="health-general"></div>
        <div class="health-card" id="health-database"></div>
        <div class="health-card" id="health-redis"></div>

      </div>

      <div class="health-chart-container">
        <canvas id="health-pie"></canvas>
      </div>
    </div>
  `;

  try {
    const health = await apiRequest(endpoints.health);

    const statusText = {
      healthy:  "Operativo",
      degraded: "Degradado",
      down:     "Caído"
    };

    const statusClass = {
      healthy:  "health-ok",
      degraded: "health-warn",
      down:     "health-crit"
    };

    // GENERAL
    document.getElementById("health-general").innerHTML = `
      <div class="health-title">Estado General</div>
      <div class="health-value ${statusClass[health.status]}">
        ${statusText[health.status]}
      </div>
    `;

    // BASE DE DATOS
    const db = health.checks.database;
    document.getElementById("health-database").innerHTML = `
      <div class="health-title">Base de datos</div>
      <div class="health-value ${statusClass[db.status]}">
        ${statusText[db.status]}
      </div>
      <div class="health-value">Latencia: ${db.latency_ms} ms</div>
    `;

    // REDIS
    const redis = health.checks.redis;
    document.getElementById("health-redis").innerHTML = `
      <div class="health-title">Redis</div>
      <div class="health-value ${statusClass[redis.status]}">
        ${statusText[redis.status]}
      </div>
    `;

    // Gráfico
    renderHealthPie(health);

  } catch (err) {
    container.innerHTML = `<p>Error cargando estado: ${err.message}</p>`;
  }
}

// ----------------------- Admin: Productos ----------------------- //

function populateAdminCategorySelects() {
  const sel = document.getElementById("admin-product-category");
  if (!sel) return;
  sel.innerHTML = "";
  categories.forEach((c) => {
    const opt = document.createElement("option");
    opt.value = c.id_key;
    opt.textContent = c.name;
    sel.appendChild(opt);
  });
}

async function loadAdminProducts() {
  products = await apiRequest(endpoints.products);
  const tbody = document.querySelector("#admin-products-table tbody");
  tbody.innerHTML = "";

  products.forEach((p) => {
    const cat = categories.find((c) => c.id_key === p.category_id);
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${p.id_key}</td>
      <td>${p.name}</td>
      <td>$${p.price.toFixed(2)}</td>
      <td>${p.stock}</td>
      <td>${cat ? cat.name : "-"}</td>
      <td>
        <button class="btn tiny ghost" data-edit="${p.id_key}">Editar</button>
        <button class="btn tiny" data-del="${p.id_key}">Eliminar</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  tbody.querySelectorAll("[data-edit]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = parseInt(btn.dataset.edit);
      const product = products.find((p) => p.id_key === id);
      fillProductForm(product);
    });
  });

  tbody.querySelectorAll("[data-del]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = parseInt(btn.dataset.del);
      if (!confirm("¿Eliminar producto #" + id + "?")) return;
      try {
        await apiRequest(`${endpoints.products}${id}`, { method: "DELETE" });
        await loadAdminProducts();
        renderProducts();
      } catch (err) {
        alert("Error eliminando producto: " + err.message);
      }
    });
  });
}

function fillProductForm(product) {
  const form = document.getElementById("admin-product-form");
  form.id_key.value = product.id_key;
  form.name.value = product.name;
  form.price.value = product.price;
  form.stock.value = product.stock;
  form.category_id.value = product.category_id;
}

function resetProductForm() {
  const form = document.getElementById("admin-product-form");
  form.reset();
  form.id_key.value = "";
}

function setupAdminProductForm() {
  const form = document.getElementById("admin-product-form");
  const resetBtn = document.getElementById("admin-product-reset");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const payload = {
      name: data.get("name"),
      price: parseFloat(data.get("price")),
      stock: parseInt(data.get("stock")),
      category_id: parseInt(data.get("category_id")),
    };

    try {
      if (data.get("id_key")) {
        payload.id_key = parseInt(data.get("id_key"));
        await apiRequest(`${endpoints.products}${payload.id_key}`, {
          method: "PUT",
          body: payload,
        });
      } else {
        await apiRequest(endpoints.products, {
          method: "POST",
          body: payload,
        });
      }
      resetProductForm();
      await loadAdminProducts();
      products = await apiRequest(endpoints.products); // actualizo para catálogo
      renderProducts();
    } catch (err) {
      alert("Error guardando producto: " + err.message);
    }
  });

  resetBtn.addEventListener("click", () => {
    resetProductForm();
  });
}

// ----------------------- Admin: Categorías ----------------------- //

async function loadAdminCategories() {
  categories = await apiRequest(endpoints.categories);
  populateAdminCategorySelects();
  const tbody = document.querySelector("#admin-categories-table tbody");
  tbody.innerHTML = "";

  categories.forEach((c) => {
    const count = (c.products || []).length;
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${c.id_key}</td>
      <td>${c.name}</td>
      <td>${count}</td>
      <td>
        <button class="btn tiny ghost" data-edit="${c.id_key}">Editar</button>
        <button class="btn tiny" data-del="${c.id_key}">Eliminar</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  tbody.querySelectorAll("[data-edit]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = parseInt(btn.dataset.edit);
      const cat = categories.find((c) => c.id_key === id);
      const form = document.getElementById("admin-category-form");
      form.id_key.value = cat.id_key;
      form.name.value = cat.name;
    });
  });

  tbody.querySelectorAll("[data-del]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = parseInt(btn.dataset.del);
      if (!confirm("¿Eliminar categoría #" + id + "?")) return;
      try {
        await apiRequest(`${endpoints.categories}${id}`, {
          method: "DELETE",
        });
        await loadAdminCategories();
        categories = await apiRequest(endpoints.categories);
        renderFilters();
        renderProducts();
      } catch (err) {
        alert("Error eliminando categoría: " + err.message);
      }
    });
  });
}

function setupAdminCategoryForm() {
  const form = document.getElementById("admin-category-form");
  const resetBtn = document.getElementById("admin-category-reset");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const payload = {
      name: data.get("name"),
    };

    try {
      if (data.get("id_key")) {
        payload.id_key = parseInt(data.get("id_key"));
        await apiRequest(`${endpoints.categories}${payload.id_key}`, {
          method: "PUT",
          body: payload,
        });
      } else {
        await apiRequest(endpoints.categories, {
          method: "POST",
          body: payload,
        });
      }
      form.reset();
      form.id_key.value = "";
      await loadAdminCategories();
    } catch (err) {
      alert("Error guardando categoría: " + err.message);
    }
  });

  resetBtn.addEventListener("click", () => {
    form.reset();
    form.id_key.value = "";
  });
}

// ----------------------- Admin: Clientes (GET /clients/) ----------------------- //

async function loadAdminClients() {
  const clients = await apiRequest(endpoints.clients);
  const tbody = document.querySelector("#admin-clients-table tbody");
  tbody.innerHTML = "";
  clients.forEach((c) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${c.id_key}</td>
      <td>${(c.name || "")} ${(c.lastname || "")}</td>
      <td>${c.email || "-"}</td>
      <td>${c.telephone || "-"}</td>
      <td>${c.age || "-"}</td>
    `;
    tbody.appendChild(tr);
  });
}

// ----------------------- Admin: Pedidos (GET /orders/ + PUT estado) ----------------------- //

async function loadAdminOrders() {
  const orders = await apiRequest(endpoints.orders);
  const clients = await apiRequest(endpoints.clients);
  const tbody = document.querySelector("#admin-orders-table tbody");
  tbody.innerHTML = "";

  orders.forEach((o) => {
    const client = clients.find((c) => c.id_key === o.client_id);
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${o.id_key}</td>
      <td>${client ? (client.name || "") + " " + (client.lastname || "") : "-"}</td>
      <td>$${o.total.toFixed(2)}</td>
      <td>
        <select data-status="${o.id_key}">
          <option value="1" ${o.status === 1 ? "selected" : ""}>Pendiente</option>
          <option value="2" ${o.status === 2 ? "selected" : ""}>En progreso</option>
          <option value="3" ${o.status === 3 ? "selected" : ""}>Entregado</option>
          <option value="4" ${o.status === 4 ? "selected" : ""}>Cancelado</option>
        </select>
      </td>
      <td>${deliveryMethodText(o.delivery_method)}</td>
      <td><button class="btn tiny ghost" data-save="${o.id_key}">Guardar</button></td>
    `;
    tbody.appendChild(tr);
  });

  tbody.querySelectorAll("[data-save]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = parseInt(btn.dataset.save);
      const select = tbody.querySelector(`select[data-status="${id}"]`);
      const newStatus = parseInt(select.value);
      try {
        // Necesitamos enviar un body completo de OrderSchema
        const order = await apiRequest(`${endpoints.orders}${id}`);
        const payload = {
          date: order.date,
          total: order.total,
          delivery_method: order.delivery_method,
          status: newStatus,
          client_id: order.client_id,
          bill_id: order.bill_id,
        };
        await apiRequest(`${endpoints.orders}${id}`, {
          method: "PUT",
          body: payload,
        });
        alert("Estado de pedido actualizado.");
      } catch (err) {
        alert("Error actualizando pedido: " + err.message);
      }
    });
  });
}

// ----------------------- Admin: Reseñas (GET /reviews/ + DELETE) ----------------------- //

async function loadAdminReviews() {
  const reviews = await apiRequest(endpoints.reviews);
  const prods = await apiRequest(endpoints.products);
  const clients = await apiRequest(endpoints.clients);
  const tbody = document.querySelector("#admin-reviews-table tbody");
  tbody.innerHTML = "";

  reviews.forEach((r) => {
    const product = prods.find((p) => p.id_key === r.product_id);
    const client = clients.find((c) => c.id_key === r.client_id);
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${r.id_key}</td>
      <td>${product ? product.name : "-"}</td>
      <td>${client ? (client.name || "") + " " + (client.lastname || "") : "-"}</td>
      <td>★ ${r.rating.toFixed(1)}</td>
      <td>${r.comment || "-"}</td>
      <td><button class="btn tiny" data-del="${r.id_key}">Eliminar</button></td>
    `;
    tbody.appendChild(tr);
  });

  tbody.querySelectorAll("[data-del]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = parseInt(btn.dataset.del);
      if (!confirm("¿Eliminar reseña #" + id + "?")) return;
      try {
        await apiRequest(`${endpoints.reviews}${id}`, { method: "DELETE" });
        await loadAdminReviews();
        renderProducts();
      } catch (err) {
        alert("Error eliminando reseña: " + err.message);
      }
    });
  });
}

// ----------------------- Admin: carga inicial ----------------------- //

async function loadAdminData() {
  await Promise.all([
    loadHealthStatus(),
    loadAdminCategories(),
    loadAdminProducts(),
    loadAdminClients(),
    loadAdminOrders(),
    loadAdminReviews(),
  ]);
}

function renderHealthPie(health) {
  const ctx = document.getElementById("health-pie");

  let ok = health.status === "healthy" ? 1 : 0;
  let warn = health.status === "degraded" ? 1 : 0;
  let crit = health.status === "down" ? 1 : 0;

  new Chart(ctx, {
    type: "pie",
    data: {
      labels: ["Operativo", "Degradado", "Caído"],
      datasets: [{
        data: [ok, warn, crit],
        backgroundColor: ["#4ade80", "#facc15", "#f87171"]
      }]
    },
    options: {
      plugins: { legend: { labels: { color: "#fff" } } }
    }
  });
}


