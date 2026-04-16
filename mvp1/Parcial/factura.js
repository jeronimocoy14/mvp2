const id = new URLSearchParams(location.search).get("id");
const ventas = JSON.parse(localStorage.getItem("ventas") || '[]');
const venta = ventas.find(v => v.id === id);

if (!venta) {
  document.body.innerHTML = '<p>No se encontró la venta. Vuelve al historial e intenta otra venta.</p>';
  throw new Error("Venta no encontrada");
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

const metodo = venta.metodoPago || venta.motododepago || venta.metodo || venta.motodopago || "";
const recibido = parseNumber(venta.recibido ?? venta.Recibido ?? 0);
const cambio = parseNumber(venta.cambio ?? venta.Cambio ?? 0);
const items = parseItems(venta.items || venta.Items);

let html = `
<p><strong>Venta:</strong> ${venta.id}</p>
<p><strong>Fecha:</strong> ${venta.fecha}</p>
<p><strong>Método:</strong> ${metodo}</p>
<ul>
`;

items.forEach(i => {
  html += `<li>${i.nombre || i.Nombre || i.producto || 'Producto'} x${i.cantidad || i.Cantidad || i.cant || 0}</li>`;
});

html += `
</ul>
<h2>Total: ${parseNumber(venta.total).toLocaleString("es-CO",{style:"currency",currency:"COP"})}</h2>
`;

if (String(metodo).toLowerCase().includes('efectivo')) {
  html += `<p><strong>Recibido:</strong> ${recibido.toLocaleString("es-CO",{style:"currency",currency:"COP"})}</p>`;
  html += `<p><strong>Cambio:</strong> ${cambio.toLocaleString("es-CO",{style:"currency",currency:"COP"})}</p>`;
}

document.getElementById("factura").innerHTML = html;