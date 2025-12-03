// js/core.js

// Cambiá esto si el back corre en otra URL
const API_BASE_URL = "https://backend-final-2025.onrender.com";

// ----------------------- Helpers de API ----------------------- //

async function apiRequest(path, { method = "GET", body = null } = {}) {
  const opts = {
    method,
    headers: {
      "Content-Type": "application/json",
    },
  };
  if (body !== null) {
    opts.body = JSON.stringify(body);
  }

  const res = await fetch(`${API_BASE_URL}${path}`, opts);

  let data = null;
  try {
    data = await res.json();
  } catch (_) {
    // Puede ser 204 sin contenido
  }

  if (!res.ok) {
    const msg = data && data.detail ? JSON.stringify(data.detail) : res.statusText;
    throw new Error(msg || "Error en la solicitud");
  }

  return data;
}

// Endpoints base (usan la convención del backend /tests)
const endpoints = {
  products: "/products/",
  categories: "/categories/",
  clients: "/clients/",
  addresses: "/addresses/",
  bills: "/bills/",
  orders: "/orders/",
  orderDetails: "/order_details/",
  reviews: "/reviews/",
  health: "/health_check/",
};

// ----------------------- Estado global ----------------------- //

let products = [];
let categories = [];
let cart = []; // { productId, name, price, quantity, categoryId }
let adminLogged = false;

// ----------------------- Navegación básica ----------------------- //

function showSection(sectionId) {
  document.querySelectorAll(".section").forEach((s) => {
    s.classList.remove("visible");
  });
  const target = document.getElementById(`section-${sectionId}`);
  if (target) target.classList.add("visible");

  // Nav activo
  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.section === sectionId);
  });
}

function setupNavigation() {
  document.querySelectorAll("[data-section]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.section;
      if (target === "admin" && !adminLogged) {
        showSection("admin");
        return;
      }
      showSection(target);
    });
  });
}
