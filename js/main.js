// js/main.js

// ----------------------- Init ----------------------- //

window.addEventListener("DOMContentLoaded", async () => {
  setupNavigation();
  setupModal();
  setupFiltersListeners();
  setupForms();
  setupAdminLogin();
  setupAdminTabs();
  updateCartUI();
  await loadInitialData();
});
