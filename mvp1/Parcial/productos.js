let productos = JSON.parse(localStorage.getItem("productos")) || [];

const lista = document.getElementById("lista");
const nombre = document.getElementById("nombre");
const precio = document.getElementById("precio");
const stockInput = document.getElementById("stock");
const btnVolver = document.getElementById("volver");

function render() {
  lista.innerHTML = "";

  productos.forEach(p => {
    lista.innerHTML += `
      <p>
        <strong>${p.nombre}</strong> |
        Precio: ${p.precio.toLocaleString("es-CO", {
          style: "currency",
          currency: "COP"
        })} |
        Stock: ${p.stock}
        <button onclick="restock(${p.id})">Restock</button>
        <button onclick="eliminar(${p.id})">Eliminar</button>
      </p>
    `;
  });
}

function crear() {
  if (!nombre.value || precio.value <= 0) {
    alert("Datos inválidos");
    return;
  }

  const nuevoProducto = {
    id: Date.now(),
    nombre: nombre.value,
    categoria: "Sin categoría",
    precio: Number(precio.value),
    costo: 0,
    stock: Number(stockInput.value) || 0,
    seguimientoInventario: true,
    imagen: "sin-imagen.jpg",
    descripcion: "Producto agregado manualmente"
  };

  productos.push(nuevoProducto);
  localStorage.setItem("productos", JSON.stringify(productos));

  nombre.value = "";
  precio.value = "";
  stockInput.value = "";

  render();
}

function restock(id) {
  const cantidad = Number(prompt("Cantidad a agregar al stock:"));

  if (isNaN(cantidad) || cantidad <= 0) {
    alert("Cantidad inválida");
    return;
  }

  const producto = productos.find(p => p.id === id);

  if (!producto) {
    alert("Producto no encontrado");
    return;
  }

  producto.stock += cantidad;

  localStorage.setItem("productos", JSON.stringify(productos));
  render();
}

function eliminar(id) {
  if (!confirm("¿Eliminar producto?")) return;

  productos = productos.filter(p => p.id !== id);
  localStorage.setItem("productos", JSON.stringify(productos));
  render();
}

btnVolver.onclick = () => {
  window.location.href = "PapelLuna.html";
};

render();