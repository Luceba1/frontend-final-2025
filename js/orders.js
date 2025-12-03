// js/orders.js

// ----------------------- Mis pedidos (GET /orders/{id}) ----------------------- //

async function handleOrderSearch(e) {
  e.preventDefault();
  const idInput = document.getElementById("order-search-id");
  const id = parseInt(idInput.value);
  if (!id) return;

  const result = document.getElementById("order-search-result");
  result.hidden = true;

  try {
    const order = await apiRequest(`${endpoints.orders}${id}`);
    const statusLabel = order.status;
    const deliveryMethod = order.delivery_method;

    result.innerHTML = `
      <p><strong>Pedido #${order.id_key}</strong></p>
      <p>Total: $${order.total.toFixed(2)}</p>
      <p>Estado: <strong>${statusText(statusLabel)}</strong></p>
      <p>Método de entrega: ${deliveryMethodText(deliveryMethod)}</p>
      <small>Fecha: ${new Date(order.date).toLocaleString()}</small>
    `;
    result.hidden = false;
  } catch (err) {
    result.innerHTML = `<strong>Error:</strong> ${err.message}`;
    result.hidden = false;
  }
}

function statusText(statusValue) {
  // Por cómo está el Enum, probablemente el backend devuelva el valor numérico.
  const v = typeof statusValue === "number" ? statusValue : parseInt(statusValue);
  switch (v) {
    case 1:
      return "Pendiente";
    case 2:
      return "En progreso";
    case 3:
      return "Entregado";
    case 4:
      return "Cancelado";
    default:
      return String(statusValue);
  }
}

function deliveryMethodText(value) {
  const v = typeof value === "number" ? value : parseInt(value);
  switch (v) {
    case 1:
      return "Drive Thru";
    case 2:
      return "Retiro en mano";
    case 3:
      return "Envío a domicilio";
    default:
      return String(value);
  }
}
