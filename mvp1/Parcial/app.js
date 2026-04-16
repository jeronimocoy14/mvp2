const mensajeBox = document.getElementById("mensaje");
const CART_SESSION_KEY = "papel_luna_sesion";
const CART_STORAGE_PREFIX = "papel_luna_cart_";
let ID_SESION = localStorage.getItem(CART_SESSION_KEY);
if (!ID_SESION) {
    ID_SESION = "SES-" + Date.now();
    localStorage.setItem(CART_SESSION_KEY, ID_SESION);
}
const contadorCarrito = document.getElementById("contador-carrito");
const cantidadesProducto = {};

function getCartStorageKey(sesion) {
    return `${CART_STORAGE_PREFIX}${sesion}`;
}

function cargarCarritoLocal(sesion) {
    try {
        const guardado = localStorage.getItem(getCartStorageKey(sesion));
        return guardado ? JSON.parse(guardado) : [];
    } catch {
        return [];
    }
}

function guardarCarritoLocal(sesion, items) {
    try {
        localStorage.setItem(getCartStorageKey(sesion), JSON.stringify(items));
    } catch {
        // Ignorar errores de almacenamiento.
    }
}

function limpiarCarritoLocal(sesion) {
    localStorage.removeItem(getCartStorageKey(sesion));
}

const carritoGuardado = cargarCarritoLocal(ID_SESION);
if (carritoGuardado.length) {
    carrito = carritoGuardado;
    contadorCarritoActualizar();
}

async function obtenerProductos() {
    const catalogo = document.getElementById("catalogo");
    if (catalogo) {
        catalogo.innerHTML = "<p>Cargando catálogo...</p>";
    }

    try {
        const respuesta = await fetch(`${API_URL}?resource=productos`);
        const resultado = await respuesta.json();

        if (resultado.success && Array.isArray(resultado.data)) {
            productos = resultado.data;
            renderProductos(productos);
            return;
        }
    } catch (error) {
        console.error("Error cargando productos desde Sheets:", error);
    }

    if (catalogo) {
        catalogo.innerHTML = "<p>No se pudieron cargar los productos. Intenta recargar la página.</p>";
    }
}
function renderProductos(lista) {
    const catalogo = document.getElementById("catalogo");
    if (!catalogo) return;
    catalogo.innerHTML = "";

    if (!Array.isArray(lista) || lista.length === 0) {
        catalogo.innerHTML = "<p>No hay productos disponibles.</p>";
        return;
    }

    lista.forEach(p => {
        console.log("Dibujando producto:", p);
        const cantidad = cantidadesProducto[p.id] || 1;
        const stock = Number(p.stock) || 0;
        const minusDisabled = cantidad <= 1 ? "disabled" : "";
        const plusDisabled = stock > 0 && cantidad >= stock ? "disabled" : "";

        const card = document.createElement("div");
        card.className = "card";
        card.innerHTML = `
    <img src="${p.imagen}" alt="${p.nombre}">
    <h3>${p.nombre}</h3>
    <p>${Number(p.precio).toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}</p>
    <p>Stock: <strong>${stock}</strong></p>
    <div class="cantidad-control">
      <button class="btn btn-secondary btn-cantidad" type="button" onclick="ajustarCantidadProducto('${p.id}', -1)" ${minusDisabled}>-</button>
      <span id="cantidad-${p.id}" class="cantidad-valor">${cantidad}</span>
      <button class="btn btn-primary btn-cantidad" type="button" onclick="ajustarCantidadProducto('${p.id}', 1)" ${plusDisabled}>+</button>
    </div>
    <button class="btn btn-primary" onclick="agregar('${p.id}')">Agregar</button>
`;
        catalogo.appendChild(card);
    });
}
const buscador = document.getElementById("buscador");

if (buscador) {
    buscador.addEventListener("input", () => {
        const texto = buscador.value.toLowerCase();
        const filtrados = productos.filter(p =>
            p.nombre.toLowerCase().includes(texto) ||
            p.categoria.toLowerCase().includes(texto)
        );
        renderProductos(filtrados);
    });
}
function contadorCarritoActualizar() {
    if (contadorCarrito) {
        const total = carrito.reduce((acc, p) => acc + (Number(p.cantidad) || 0), 0);
        contadorCarrito.textContent = total;
        
    }
}
async function agregar(id) {
    const producto = productos.find(p => String(p.id) === String(id));
    if (!producto) return;

    const stock = Number(producto.stock) || 0;
    let cantidad = Math.max(1, Number(cantidadesProducto[id] || 1));
    if (stock > 0 && cantidad > stock) {
        cantidad = stock;
        mostrarMensaje(`Solo hay ${stock} unidades disponibles.`, "error");
    }

    const itemExistente = carrito.find(item => String(item.id) === String(id));
    if (itemExistente) {
        const totalDeseado = Number(itemExistente.cantidad || 0) + cantidad;
        const finalCantidad = stock > 0 ? Math.min(totalDeseado, stock) : totalDeseado;
        if (finalCantidad === Number(itemExistente.cantidad)) {
            mostrarMensaje("No puedes agregar más, superas el stock disponible.", "error");
            return;
        }
        itemExistente.cantidad = finalCantidad;
    } else {
        carrito.push({ ...producto, cantidad, stock: producto.stock });
    }
    guardarCarritoLocal(ID_SESION, carrito);
    cantidadesProducto[id] = 1;
    const cantidadLabel = document.getElementById(`cantidad-${id}`);
    if (cantidadLabel) cantidadLabel.textContent = "1";

    contadorCarritoActualizar();
    const datos = {
        id_sesion: ID_SESION,
        id_producto: producto.id,
        nombre: producto.nombre,
        precio: producto.precio,
        cantidad: cantidad,
        stock: producto.stock
    };
   
    try {
        const respuesta = await fetch(`${API_URL}?resource=Carrito`, {
            method: "POST",
            mode: "cors",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(datos)
        });
    
        if (typeof actualizarContadorInterfaz === "function") {
            actualizarContadorInterfaz();
        }
        mostrarMensaje("Producto agregado al carrito");

    } catch (error) {
        console.error("Error al conectar con la nube:", error);
    }
}

function limpiarSesionCarrito() {
    localStorage.removeItem(CART_SESSION_KEY);
    limpiarCarritoLocal(ID_SESION);
}

function mostrarMensaje(texto, tipo = "success") {
    if (!mensajeBox) return;
    mensajeBox.textContent = texto;
    mensajeBox.className = `mensaje ${tipo} mostrar`;
    setTimeout(() => mensajeBox.classList.remove("mostrar"), 3000);
}

function ajustarCantidadProducto(id, delta) {
    const producto = productos.find(p => String(p.id) === String(id));
    if (!producto) return;

    const stock = Number(producto.stock) || 0;
    const actual = Number(cantidadesProducto[id] || 1);
    let nueva = actual + delta;

    if (nueva < 1) {
        nueva = 1;
    }
    if (stock > 0 && nueva > stock) {
        nueva = stock;
        mostrarMensaje(`No hay más de ${stock} disponibles.`, "error");
    }

    cantidadesProducto[id] = nueva;
    renderProductos(productos);
}

function verCarrito() {
   
    if (!ID_SESION) {
        console.error("Error: No se ha generado un ID de sesión");
        return;
    }
    window.location.href = `Carrito.html?sesion=${ID_SESION}`;
}

obtenerProductos();
