let carrito = JSON.parse(localStorage.getItem("carrito")) || [];

const lista = document.getElementById("lista");
const totalEl = document.getElementById("total");
const metodo = document.getElementById("metodo");
const box = document.getElementById("efectivo-box");
const recibidoInput = document.getElementById("recibido");
const cambioEl = document.getElementById("cambio");
const btnCerrar = document.getElementById("cerrar");

function render() {
  lista.innerHTML = "";

  carrito.forEach(p => {
    lista.innerHTML += `
      <p>
        ${p.nombre} x${p.cantidad}
        <span>
          ${(p.precio * p.cantidad).toLocaleString("es-CO", {
            style: "currency",
            currency: "COP"
          })}
        </span>
      </p>
    `;
  });

  const total = carrito.reduce((acc, p) => acc + p.precio * p.cantidad, 0);

  totalEl.textContent = total.toLocaleString("es-CO", {
    style: "currency",
    currency: "COP"
  });
}

metodo.addEventListener("change", () => {
  box.style.display = metodo.value === "Efectivo" ? "block" : "none";
  recibidoInput.value = "";
  cambioEl.textContent = "$0";
});

recibidoInput.addEventListener("input", () => {
  const recibido = Number(recibidoInput.value);
  const total = carrito.reduce((acc, p) => acc + p.precio * p.cantidad, 0);

  const cambio = recibido - total;

  cambioEl.textContent =
    cambio >= 0
      ? cambio.toLocaleString("es-CO", { style: "currency", currency: "COP" })
      : "$0";
});

btnCerrar.onclick = () => {
  if (carrito.length === 0) {
    alert("No hay productos en la venta");
    return;
  }

  if (!metodo.value) {
    alert("Seleccione un método de pago");
    return;
  }

  const total = carrito.reduce((acc, p) => acc + p.precio * p.cantidad, 0);

  if (metodo.value === "Efectivo") {
    const recibido = Number(recibidoInput.value);
    if (isNaN(recibido) || recibido < total) {
      alert("El efectivo recibido es menor al total");
      return;
    }
  }

  let productos = JSON.parse(localStorage.getItem("productos")) || [];

  for (let item of carrito) {
    const producto = productos.find(p => p.id === item.id);

    if (!producto) {
      alert(`El producto ${item.nombre} no existe en inventario`);
      return;
    }

    if (producto.seguimientoInventario && producto.stock < item.cantidad) {
      alert(
        `Stock insuficiente para "${producto.nombre}".\n` +
        `Disponible: ${producto.stock} | Solicitado: ${item.cantidad}`
      );
      return;
    }
  }

  carrito.forEach(item => {
    const producto = productos.find(p => p.id === item.id);
    if (producto && producto.seguimientoInventario) {
      producto.stock -= item.cantidad;
    }
  });

  localStorage.setItem("productos", JSON.stringify(productos));

  const ventas = JSON.parse(localStorage.getItem("ventas")) || [];

  const venta = {
    id: "V-" + Date.now(),
    fecha: new Date().toLocaleString(),
    items: carrito,
    total: total,
    metodoPago: metodo.value,
    efectivoRecibido:
      metodo.value === "Efectivo" ? Number(recibidoInput.value) : null,
    cambio:
      metodo.value === "Efectivo"
        ? Number(recibidoInput.value) - total
        : null
  };

  ventas.push(venta);
  localStorage.setItem("ventas", JSON.stringify(ventas));

  localStorage.removeItem("carrito");
  window.location.href = "factura.html?id=" + venta.id;
};

render();