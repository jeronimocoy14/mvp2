let productos = JSON.parse(localStorage.getItem("productos")) || [];

const lista = document.getElementById("lista");
const nombre = document.getElementById("nombre");
const precio = document.getElementById("precio");
const stockInput = document.getElementById("stock");
const btnVolver = document.getElementById("volver");
const mensajeBox = document.getElementById("mensaje");
const modalOverlay = document.getElementById("modal-overlay");
const modalText = document.getElementById("modal-text");
const modalInput = document.getElementById("modal-input");
const modalAccept = document.getElementById("modal-accept");
const modalCancel = document.getElementById("modal-cancel");
let modalConfirmCallback = null;
let modalPromptCallback = null;
let modalCancelCallback = null;

function cerrarModal() {
  modalOverlay.classList.add("oculto");
  modalInput.classList.add("oculto");
  modalInput.value = "";
  modalConfirmCallback = null;
  modalPromptCallback = null;
  modalCancelCallback = null;
}

modalAccept.addEventListener("click", () => {
  if (modalOverlay.classList.contains("oculto")) return;
  if (!modalInput.classList.contains("oculto")) {
    if (typeof modalPromptCallback === "function") modalPromptCallback(modalInput.value);
  } else {
    if (typeof modalConfirmCallback === "function") modalConfirmCallback();
  }
  cerrarModal();
});

modalCancel.addEventListener("click", () => {
  if (modalOverlay.classList.contains("oculto")) return;
  if (typeof modalCancelCallback === "function") modalCancelCallback();
  cerrarModal();
});

modalInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    modalAccept.click();
  }
});

function mostrarConfirm(texto, onConfirm, onCancel) {
  modalText.textContent = texto;
  modalInput.classList.add("oculto");
  modalInput.value = "";
  modalConfirmCallback = onConfirm;
  modalPromptCallback = null;
  modalCancelCallback = onCancel || null;
  modalOverlay.classList.remove("oculto");
}

function mostrarPrompt(texto, defaultValue, onSubmit, onCancel) {
  modalText.textContent = texto;
  modalInput.classList.remove("oculto");
  modalInput.value = defaultValue !== undefined ? defaultValue : "";
  modalPromptCallback = onSubmit;
  modalConfirmCallback = null;
  modalCancelCallback = onCancel || null;
  modalOverlay.classList.remove("oculto");
  setTimeout(() => modalInput.focus(), 0);
}

function render() {
  lista.innerHTML = "";

  productos.forEach(p => {
    lista.innerHTML += `
      <p>
        <span class="nombre-producto">${p.nombre}</span>
        <span class="info-producto">Precio: ${p.precio.toLocaleString("es-CO", {
          style: "currency",
          currency: "COP"
        })} | Stock: ${p.stock}</span>
        <button class="btn-restock" onclick="restock(${p.id})">Restock</button>
        <button class="btn-eliminar" onclick="eliminar(${p.id})">Eliminar</button>
        <button class="btn-editar" onclick="editar(${p.id})">Editar</button>
      </p>
    `;
  });
}

function mostrarMensaje(texto, tipo = "success") {
  mensajeBox.textContent = texto;
  mensajeBox.className = "";
  mensajeBox.classList.add("mostrar", tipo);

  setTimeout(() => {
    mensajeBox.classList.remove("mostrar");
  }, 2500);
}

function crear() {
  if (!nombre.value || precio.value <= 0) {
    mostrarMensaje("Datos inválidos", "error");
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
  const producto = productos.find(p => p.id === id);
  if (!producto) {
    mostrarMensaje("Producto no encontrado", "error");
    return;
  }

  mostrarPrompt("Cantidad a agregar al stock:", "", value => {
    const cantidad = Number(value);
    if (isNaN(cantidad) || cantidad <= 0) {
      mostrarMensaje("Cantidad inválida", "error");
      return;
    }

    producto.stock += cantidad;
    localStorage.setItem("productos", JSON.stringify(productos));
    render();
    mostrarMensaje("Stock actualizado", "success");
  });
}

function eliminar(id) {
  mostrarConfirm("¿Eliminar producto?", () => {
    productos = productos.filter(p => p.id !== id);
    localStorage.setItem("productos", JSON.stringify(productos));
    render();
    mostrarMensaje("Producto eliminado", "success");
  });
}

function editar(id) {
  const producto = productos.find(p => p.id === id);
  if (!producto) {
    mostrarMensaje("Producto no encontrado", "error");
    return;
  }

  mostrarPrompt("Nuevo precio del producto:", producto.precio, value => {
    const nuevoPrecio = Number(value);
    if (isNaN(nuevoPrecio) || nuevoPrecio <= 0) {
      mostrarMensaje("Precio inválido", "error");
      return;
    }

    producto.precio = nuevoPrecio;
    localStorage.setItem("productos", JSON.stringify(productos));
    render();
    mostrarMensaje("Precio actualizado", "success");
  });
}

btnVolver.onclick = () => {
  window.location.href = "PapelLuna.html";
};

render();