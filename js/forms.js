// js/forms.js

// ----------------------- Listeners globales ----------------------- //

function setupFiltersListeners() {
  const inputs = [
    document.getElementById("filter-search"),
    document.getElementById("filter-category"),
    document.getElementById("filter-max-price"),
  ];
  inputs.forEach((el) =>
    el.addEventListener("input", () => {
      renderProducts();
    })
  );
  document
    .getElementById("btn-clear-filters")
    .addEventListener("click", () => {
      document.getElementById("filter-search").value = "";
      document.getElementById("filter-category").value = "";
      document.getElementById("filter-max-price").value = "";
      renderProducts();
    });
}

function setupForms() {
  const checkoutForm = document.getElementById("checkout-form");
  checkoutForm.addEventListener("submit", handleCheckout);

  const orderSearchForm = document.getElementById("order-search-form");
  orderSearchForm.addEventListener("submit", handleOrderSearch);

  document
    .getElementById("btn-refresh-health")
    .addEventListener("click", loadHealthStatus);

  setupAdminProductForm();
  setupAdminCategoryForm();
}

function showLoading() {
  document.getElementById("loading-overlay").hidden = false;
}

function hideLoading() {
  document.getElementById("loading-overlay").hidden = true;
}

