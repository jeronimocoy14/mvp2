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

function parseItems(items) {
  if (Array.isArray(items)) return items;
  if (typeof items === 'string') {
    try {
      const parsed = JSON.parse(items);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      try {
        const corrected = items.replace(/'/g, '"');
        const parsed = JSON.parse(corrected);
        return Array.isArray(parsed) ? parsed : [];
      } catch (_error) {
        return [];
      }
    }
  }
  return [];
}

function parseNumber(value) {
  if (typeof value === 'number') return value;
  if (typeof value !== 'string') return 0;
  const text = value.trim();
  if (text === '') return 0;
  if (/[A-Za-z]/.test(text)) return 0;

  let cleaned = text.replace(/[^0-9.,-]/g, '');
  if (cleaned === '') return 0;

  if (cleaned.includes(',') && cleaned.includes('.')) {
    if (cleaned.lastIndexOf(',') > cleaned.lastIndexOf('.')) {
      cleaned = cleaned.replace(/\./g, '').replace(/,/g, '.');
    } else {
      cleaned = cleaned.replace(/,/g, '');
    }
  } else if (cleaned.includes(',')) {
    cleaned = cleaned.replace(/,/g, '.');
  }

  const number = Number(cleaned);
  return Number.isNaN(number) ? 0 : number;
}

function renderVentas(ventas) {
  if (!ventasContenedor) return;

  if (!ventas || ventas.length === 0) {
    ventasContenedor.innerHTML = "<p>No se encontraron ventas registradas.</p>";
    return;
  }

  const html = ventas.map(venta => {
    const items = parseItems(venta.items || venta.Items);
    const itemsHtml = items.map(item => {
      const precio = parseNumber(item.precio || item.Precio || 0);
      const cantidad = parseNumber(item.cantidad || item.Cantidad || item.cant || item.quantity || 0);
      return `<li>${item.nombre || item.Nombre || item.producto || "Producto"} — ${cantidad} x ${precio.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}</li>`;
    }).join("");

    const total = parseNumber(venta.total || venta.Total || 0);
    const recibido = parseNumber(venta.recibido ?? venta.Recibido ?? 0);
    const cambio = parseNumber(venta.cambio ?? venta.Cambio ?? 0);
    const pagoRaw = venta.motododepago || venta.motodopago || venta.metodo || venta.metodoPago || "-";
    const pago = String(pagoRaw).trim();
    const pagoLower = pago.toLowerCase();
    const esEfectivo = pagoLower.includes('efectivo');
    const fecha = venta.fecha || venta.Fecha || "-";

    return `
      <div class="venta-card">
        <div class="venta-header">
          <strong>${venta.id || venta.ID || "Venta"}</strong>
          <span>${fecha}</span>
        </div>
        <p>Método de pago: <strong>${pago}</strong></p>
        <p>Total: <strong>${total.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}</strong></p>
        ${esEfectivo ? `<p>Recibido: <strong>${recibido.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}</strong></p>
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