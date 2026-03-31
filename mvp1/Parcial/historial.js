const ventas = JSON.parse(localStorage.getItem("ventas")) || [];
const contenedor = document.getElementById("ventas");
const btnVolver = document.getElementById("volver");

ventas.forEach(v => {
  contenedor.innerHTML += `
    <p>
      ${v.fecha} - ${v.total.toLocaleString("es-CO", {
        style: "currency",
        currency: "COP"
      })}
      <a href="factura.html?id=${v.id}">Ver factura</a>
    </p>
  `;
});

btnVolver.onclick = () => {
  window.location.href = "PapelLuna.html";
};