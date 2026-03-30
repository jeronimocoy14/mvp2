const id = new URLSearchParams(location.search).get("id");
const ventas = JSON.parse(localStorage.getItem("ventas"));
const venta = ventas.find(v => v.id === id);

let html = `
<p><strong>Venta:</strong> ${venta.id}</p>
<p><strong>Fecha:</strong> ${venta.fecha}</p>
<p><strong>Método:</strong> ${venta.metodoPago}</p>
<ul>
`;

venta.items.forEach(i => {
  html += `<li>${i.nombre} x${i.cantidad}</li>`;
});

html += `
</ul>
<h2>Total: ${venta.total.toLocaleString("es-CO",{style:"currency",currency:"COP"})}</h2>
`;

document.getElementById("factura").innerHTML = html;