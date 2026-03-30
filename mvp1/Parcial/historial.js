const ventas = JSON.parse(localStorage.getItem("ventas")) || [];
const contenedor = document.getElementById("ventas");

ventas.forEach(v => {
  contenedor.innerHTML += `
    <p>
      ${v.fecha} - ${v.total.toLocaleString("es-CO",{style:"currency",currency:"COP"})}
      <a href="factura.html?id=${v.id}">Ver factura</a>
    </p>
  `;
  document.getElementById("volver").onclick = () => {
  window.location.href = "PapelLuna.html";
};

});