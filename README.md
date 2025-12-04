# 🛒 Frontend E-Commerce 2025
Interfaz web moderna desarrollada para consumir el backend completo del sistema de comercio electrónico.
El objetivo es ofrecer una experiencia simple, rápida y adaptable a cualquier usuario.

---

## 📌 Características principales

### ✔ Catálogo de productos
- Obtiene la lista de productos desde el backend.
- Filtros por categoría, búsqueda por texto y precio máximo.
- Paginación visual para mejorar la navegación.
- Tarjetas de producto con precios y estilos modernos.

### ✔ Vista individual del producto
- Al hacer clic en un producto, se abre su página individual.
- Muestra nombre, precio y descripción.
- Botón para agregar al carrito.

### ✔ Carrito de compras
- Persistencia del carrito en el navegador.
- Agregar, remover y modificar cantidades.
- Cálculo automático del subtotal y total.
- Envío directo al proceso de checkout.

### ✔ Checkout
- Formulario simple para completar datos del pedido.
- Envío de la orden al backend.
- Validaciones básicas.

### ✔ Mis pedidos
- Consulta al backend utilizando el ID del cliente.
- Muestra:
  - ID del pedido
  - Fecha
  - Total
  - Estado

### ✔ Panel de administración
- Gestión de productos y categorías.
- Alta, baja y modificación.
- Carga de imágenes.
- Conexión total con el backend.

---

## 📂 Estructura del proyecto

```
frontend/
│── index.html
│── vercel.json
│── README.md
│
├── css/
│   ├── styles.css
│   └── components.css
│
└── js/
    ├── main.js
    ├── catalog.js
    ├── cart.js
    ├── checkout.js
    ├── orders.js
    ├── admin.js
    ├── core.js
    └── forms.js
```

---

## 🚀 Cómo ejecutar el proyecto

### 1. Descargar el repositorio
Cloná el proyecto o descargá el ZIP.

### 2. Abrir el proyecto
Podés abrirlo directamente en tu navegador usando Live Server (VS Code).

### 3. Verificar rutas del backend
El frontend usa las rutas configuradas en `core.js`.

### 4. Iniciar la aplicación
Abrí:

```
index.html
```

---

## 🔌 Requisitos
- Navegador moderno.
- Backend operativo (FastAPI + PostgreSQL + Redis).

---

## 👤 Autor
**Lucas Pujada**  
Proyecto Frontend E-Commerce 2025
