// js/checkout.js

// ----------------------- Checkout (usa TODOS los modelos principales) ----------------------- //

async function handleCheckout(e) {
  e.preventDefault();
  if (!cart.length) {
    alert("Tu carrito está vacío.");
    return;
  }

  const form = e.target;
  const data = new FormData(form);

  const clientPayload = {
    name: data.get("name") || null,
    lastname: data.get("lastname") || null,
    email: data.get("email"),
    telephone: data.get("telephone"),
    age: parseInt(data.get("age")),
  };

  const deliveryMethod = parseInt(data.get("delivery_method"), 10);
  const paymentType = parseInt(data.get("payment_type"), 10);

  const subtotal = cart.reduce(
    (acc, item) => acc + item.quantity * item.price,
    0
  );
  const discount = 0;
  const total = subtotal - discount;

  const checkoutResult = document.getElementById("checkout-result");
  checkoutResult.hidden = true;

  try {
    // 1) CREAR CLIENTE
    // Intentar crear el cliente (puede fallar si el email ya existe)

    // 1) CREAR CLIENTE (o recuperar el existente si ya está registrado)
    let client;
    try {
      client = await apiRequest(endpoints.clients, {
        method: "POST",
        body: clientPayload,
      });
    } catch (err) {
      const msg = String(err.message).toLowerCase();

      const email = clientPayload.email;

      if (
        msg.includes("exists") ||
        msg.includes("duplicate") ||
        msg.includes("llave duplicada") ||
        msg.includes("duplicate key") ||
        msg.includes("unique")
      ) {
        // Recuperar cliente ya existente
        const allClients = await apiRequest(endpoints.clients);

        const existing = allClients.find(c => c.email === email);

        if (!existing) {
          throw new Error("El email existe pero no se encontró en la base.");
        }

        client = existing; // USAR ESTE CLIENTE PARA EL CHECKOUT
      } else {
        throw err;
      }
    }

    // 2) CREAR DIRECCIÓN (SI CORRESPONDE)
    const street = data.get("street")?.trim();
    const number = data.get("number")?.trim();
    const city = data.get("city")?.trim();
    if (street || number || city) {
      const addressPayload = {
        street: street || null,
        number: number || null,
        city: city || null,
        client_id: client.id_key,
      };
      await apiRequest(endpoints.addresses, {
        method: "POST",
        body: addressPayload,
      });
    }

    // 3) CREAR FACTURA
    const billPayload = {
      bill_number: `WEB-${Date.now()}`,
      discount,
      date: new Date().toISOString().slice(0, 10),
      total,
      payment_type: paymentType,
      client_id: client.id_key,
    };

    const bill = await apiRequest(endpoints.bills, {
      method: "POST",
      body: billPayload,
    });

    if (!bill || !bill.id_key) {
      checkoutResult.innerHTML = `
        <strong>Error:</strong> No se pudo crear la factura.
      `;
      checkoutResult.hidden = false;
      return;
    }

    // 4) CREAR ORDEN
    const orderPayload = {
      date: new Date().toISOString(),
      total,
      delivery_method: deliveryMethod,
      status: 1, // PENDING
      client_id: client.id_key,
      bill_id: bill.id_key,
    };

    const order = await apiRequest(endpoints.orders, {
      method: "POST",
      body: orderPayload,
    });

    if (!order || !order.id_key) {
      checkoutResult.innerHTML = `
        <strong>Error:</strong> No se pudo crear la orden.
      `;
      checkoutResult.hidden = false;
      return;
    }

    // 5) CREAR DETALLES DE ORDEN
    for (const item of cart) {
      const detailPayload = {
        quantity: item.quantity,
        subtotal: item.quantity * item.price,
        order_id: order.id_key,
        product_id: item.productId,
      };

      await apiRequest(endpoints.orderDetails, {
        method: "POST",
        body: detailPayload,
      });
    }

    // FINAL
    cart = [];
    updateCartUI();
    form.reset();

    const successHtml = `
      <p><strong>¡Compra realizada con éxito!</strong></p>
      <p>ID de pedido: <strong>${order.id_key}</strong></p>
      <p>Total: <strong>$${total.toFixed(2)}</strong></p>
      <p>Guardá el ID para consultar el estado en "Mis pedidos".</p>
    `;

    checkoutResult.innerHTML = successHtml;
    checkoutResult.style.borderColor = "rgba(34,197,94,0.6)";
    checkoutResult.hidden = false;
  } catch (err) {
    console.error(err);
    checkoutResult.innerHTML =
      "<strong>Error en el checkout:</strong> " + err.message;
    checkoutResult.style.borderColor = "rgba(248,113,113,0.7)";
    checkoutResult.hidden = false;
  }
}
