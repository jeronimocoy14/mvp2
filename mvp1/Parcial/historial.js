const mensajeBox = document.getElementById("mensaje");
const btnVolver = document.getElementById("volver");
const ventasContenedor = document.getElementById("ventas");

btnVolver.onclick = () => {
  window.location.href = "PapelLuna.html";
};

function mostrarMensaje(texto, tipo = "error") {
  if (!mensajeBox) {
    console.warn(texto);
    return;
  }
  mensajeBox.textContent = texto;
  mensajeBox.className = `mensaje ${tipo} mostrar`;
  setTimeout(() => mensajeBox.classList.remove("mostrar"), 3000);
}

function renderVentas(ventas) {
  if (!ventasContenedor) return;

  if (!ventas || ventas.length === 0) {
    ventasContenedor.innerHTML = "<p>No se encontraron ventas registradas.</p>";
    return;
  }

  const html = ventas.map(venta => {
    const itemsHtml = (venta.items || []).map(item => {
      const precio = Number(item.precio || item.Precio || 0);
      const cantidad = Number(item.cantidad || item.Cantidad || item.cant || item.quantity || 0);
      return `<li>${item.nombre || item.Nombre || item.producto || "Producto"} — ${cantidad} x ${precio.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}</li>`;
    }).join("");

    const total = Number(venta.total || venta.Total || 0);
    const recibido = Number(venta.recibido || venta.Recibido || 0);
    const cambio = Number(venta.cambio || venta.Cambio || 0);
    const pago = venta.motododepago || venta.motodopago || venta.metodo || "-";
    const fecha = venta.fecha || venta.Fecha || "-";

    return `
      <div class="venta-card">
        <div class="venta-header">
          <strong>${venta.id || venta.ID || "Venta"}</strong>
          <span>${fecha}</span>
        </div>
        <p>Método de pago: <strong>${pago}</strong></p>
        <p>Total: <strong>${total.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}</strong></p>
        ${pago === 'Efectivo' ? `<p>Recibido: <strong>${recibido.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}</strong></p>
        <p>Cambio: <strong>${cambio.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}</strong></p>` : ''}
        <details>
          <summary>Ver productos</summary>
          <ul>${itemsHtml}</ul>
        </details>
      </div>`;
  }).join("\n");

  ventasContenedor.innerHTML = html;
}

async function cargarHistorial() {
  if (!ventasContenedor) return;

  try {
    const respuesta = await fetch(`${API_URL}?resource=ventas`);
    const resultado = await respuesta.json();

    if (!resultado.success) {
      mostrarMensaje("No se pudo cargar el historial de ventas.");
      return;
    }

    renderVentas(resultado.data);
  } catch (error) {
    console.error("Error cargando historial de ventas:", error);
    mostrarMensaje("Error al cargar el historial de ventas.");
  }
}

cargarHistorial();