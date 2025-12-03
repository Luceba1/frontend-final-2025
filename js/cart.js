// js/cart.js

// ----------------------- Carrito ----------------------- //

function addToCart(productId) {
  const product = products.find((p) => p.id_key === productId);
  if (!product) return;

  const existing = cart.find((c) => c.productId === productId);
  if (existing) {
    existing.quantity = Math.min(existing.quantity + 1, product.stock);
  } else {
    cart.push({
      productId,
      name: product.name,
      price: product.price,
      categoryId: product.category_id,
      quantity: 1,
    });
  }

  updateCartUI();
}

function updateCartUI() {
  // Mini carrito
  const miniCount = document.getElementById("mini-cart-count");
  const miniTotal = document.getElementById("mini-cart-total");

  const count = cart.reduce((acc, item) => acc + item.quantity, 0);
  const total = cart.reduce((acc, item) => acc + item.quantity * item.price, 0);

  miniCount.textContent = count;
  miniTotal.textContent = total.toFixed(2);

  // Carrito completo
  const container = document.getElementById("cart-items");
  container.innerHTML = "";
  const cartTotal = document.getElementById("cart-total");
  cartTotal.textContent = total.toFixed(2);

  if (!cart.length) {
    container.innerHTML =
      '<p class="empty-state">Tu carrito está vacío. Agregá productos desde el catálogo.</p>';
    return;
  }

  cart.forEach((item) => {
    const row = document.createElement("div");
    row.className = "cart-item";
    row.innerHTML = `
      <div class="cart-item-info">
        <strong>${item.name}</strong>
        <small>Precio: $${item.price.toFixed(2)}</small>
      </div>
      <div class="cart-item-actions">
        <input type="number" min="1" value="${item.quantity}" data-id="${item.productId}" />
        <span>$${(item.price * item.quantity).toFixed(2)}</span>
        <button class="btn tiny ghost" data-remove="${item.productId}">✕</button>
      </div>
    `;
    container.appendChild(row);
  });

  // Eventos
  container.querySelectorAll("input[type=number]").forEach((input) => {
    input.addEventListener("change", () => {
      const id = parseInt(input.dataset.id);
      const value = Math.max(1, parseInt(input.value) || 1);
      const item = cart.find((c) => c.productId === id);
      const product = products.find((p) => p.id_key === id);
      if (!item || !product) return;
      item.quantity = Math.min(value, product.stock);
      updateCartUI();
    });
  });

  container.querySelectorAll("[data-remove]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = parseInt(btn.dataset.remove);
      cart = cart.filter((c) => c.productId !== id);
      updateCartUI();
    });
  });
}
