let productos = JSON.parse(localStorage.getItem("productos"));
let carrito = JSON.parse(localStorage.getItem("carrito")) || [];

const catalogo = document.getElementById("catalogo");
const buscador = document.getElementById("buscador");
const contador = document.getElementById("contador-carrito");

function renderProductos(lista) {
  catalogo.innerHTML = "";

  lista.forEach(p => {
    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <img src="${p.imagen}" alt="${p.nombre}">
      <h3>${p.nombre}</h3>
      <p class="categoria">${p.categoria}</p>
      <p class="precio">${p.precio.toLocaleString("es-CO",{style:"currency",currency:"COP"})}</p>
      <p class="stock">Stock: ${p.stock}</p>
      <button onclick="agregar(${p.id})">Agregar</button>
    `;

    catalogo.appendChild(card);
  });
}

function agregar(id) {
  const prod = productos.find(p => p.id === id);
  const item = carrito.find(i => i.id === id);

  if (item) item.cantidad++;
  else carrito.push({ ...prod, cantidad: 1 });

  localStorage.setItem("carrito", JSON.stringify(carrito));
  actualizarContador();
}

function actualizarContador() {
  contador.textContent = carrito.reduce((a,p)=>a+p.cantidad,0);
}

buscador.addEventListener("input", () => {
  const t = buscador.value.toLowerCase();
  renderProductos(productos.filter(p => p.nombre.toLowerCase().includes(t)));
});

renderProductos(productos);
actualizarContador();