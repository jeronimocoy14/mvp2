const mensajeBox = document.getElementById("mensaje");
const CART_SESSION_KEY = "papel_luna_sesion";
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

function cargarStorageJSON(key) {
    try {
        return JSON.parse(localStorage.getItem(key) || '[]');
    } catch {
        return [];
    }
}

function guardarStorageJSON(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch {
        // Ignorar fallos de almacenamiento.
    }
}

function cargarVentasAbiertas() {
    return cargarStorageJSON('papel_luna_ventas_abiertas');
}

function guardarVentaAbiertaMeta(sesion, meta) {
    const ventas = cargarVentasAbiertas();
    const index = ventas.findIndex(v => String(v.id) === String(sesion));
    const registro = {
        id: sesion,
        fecha: meta.fecha || new Date().toLocaleString('es-CO'),
        total: Number(meta.total) || 0,
        actualizado: new Date().toISOString(),
        items: meta.items || [],
        estado: meta.estado || 'abierta'
    };

    if (index >= 0) {
        ventas[index] = registro;
    } else {
        ventas.push(registro);
    }
    guardarStorageJSON('papel_luna_ventas_abiertas', ventas);
}

function borrarVentaAbiertaMeta(sesion) {
    const ventas = cargarVentasAbiertas().filter(v => String(v.id) !== String(sesion));
    guardarStorageJSON('papel_luna_ventas_abiertas', ventas);
}

function renderVentasAbiertas() {
    const banner = document.getElementById('venta-abierta-banner');
    if (!banner) return;
    const ventas = cargarVentasAbiertas();
    if (!ventas.length) {
        banner.classList.add('oculto');
        banner.innerHTML = '';
        return;
    }

    banner.classList.remove('oculto');
    banner.innerHTML = `<div class="panel-card">
        <h3>Ventas abiertas</h3>
        <p>Puedes retomar cualquier venta pendiente desde aquí.</p>
        <div class="open-sale-list">
            ${ventas.map(v => `
                <div class="open-sale-item">
                    <strong>${v.id}</strong>
                    <span>${v.fecha}</span>
                    <span>Total ${Number(v.total).toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}</span>
                    <button class="btn btn-secondary" onclick="continuarVenta('${v.id}')">Continuar</button>
                </div>
            `).join('')}
        </div>
    </div>`;
}

function continuarVenta(sesion) {
    if (!sesion) return;
    window.location.href = `Carrito.html?sesion=${sesion}`;
}

const carritoGuardado = cargarCarritoLocal(ID_SESION);
if (carritoGuardado.length) {
    carrito = carritoGuardado;
    contadorCarritoActualizar();
}

renderVentasAbiertas();

async function obtenerProductos() {
    const catalogo = document.getElementById("catalogo");
    if (catalogo) {
        catalogo.innerHTML = "<p>Cargando catálogo...</p>";
    }

    try {
        const respuesta = await fetch(`${API_URL}?resource=productos`, {
            method: 'GET',
            mode: 'cors'
        });

        if (!respuesta.ok) {
            const texto = await respuesta.text();
            console.error('Error HTTP al cargar productos:', respuesta.status, texto);
            throw new Error(`HTTP ${respuesta.status}`);
        }

        const resultado = await respuesta.json();
        if (resultado.success && Array.isArray(resultado.data)) {
            productos = resultado.data.map(producto => ({
                id: producto.id ?? producto.ID ?? producto.id_producto ?? producto.productoId,
                nombre: producto.nombre ?? producto.Nombre ?? producto.producto ?? 'Sin nombre',
                precio: Number(producto.precio ?? producto.Precio ?? producto.valor ?? 0),
                stock: Number(producto.stock ?? producto.Stock ?? 0),
                categoria: producto.categoria ?? producto.Categoria ?? 'General',
                imagen: producto.imagen || producto.imagenURL || 'https://via.placeholder.com/250',
                costo: Number(producto.costo ?? producto.Costo ?? 0)
            }));
            renderProductos(productos);
            return;
        }

        console.warn('Respuesta de productos sin éxito:', resultado);
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
        const productoId = String(p.id ?? p.ID ?? p.id_producto ?? 'sin-id');
        const cantidad = cantidadesProducto[productoId] || 1;
        const stock = Number(p.stock) || 0;
        const minusDisabled = cantidad <= 1 ? "disabled" : "";
        const plusDisabled = stock > 0 && cantidad >= stock ? "disabled" : "";
        const nombre = p.nombre || p.Nombre || 'Producto';
        const precio = Number(p.precio) || 0;
        const imagen = p.imagen || p.imagenURL || 'https://via.placeholder.com/250';

        const card = document.createElement("div");
        card.className = "card";
        card.innerHTML = `
    <img src="${imagen}" alt="${nombre}">
    <h3>${nombre}</h3>
    <p>${precio.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}</p>
    <p>Stock: <strong>${stock}</strong></p>
    <div class="cantidad-control">
      <button class="btn btn-secondary btn-cantidad" type="button" onclick="ajustarCantidadProducto('${productoId}', -1)" ${minusDisabled}>-</button>
      <span id="cantidad-${productoId}" class="cantidad-valor">${cantidad}</span>
      <button class="btn btn-primary btn-cantidad" type="button" onclick="ajustarCantidadProducto('${productoId}', 1)" ${plusDisabled}>+</button>
    </div>
    <button class="btn btn-primary" onclick="agregar('${productoId}')">Agregar</button>
`;
        catalogo.appendChild(card);
    });
}
const buscador = document.getElementById("buscador");

if (buscador) {
    buscador.addEventListener("input", () => {
        const texto = buscador.value.toLowerCase();
        const filtrados = productos.filter(p => {
            const nombre = String(p.nombre || p.Nombre || '').toLowerCase();
            const categoria = String(p.categoria || p.Categoria || '').toLowerCase();
            return nombre.includes(texto) || categoria.includes(texto);
        });
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
            mode: "no-cors",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(datos)
        });
        if (!respuesta.ok) {
            console.warn('La petición al carrito devolvió un error', respuesta.status);
        }

        if (typeof actualizarContadorInterfaz === "function") {
            actualizarContadorInterfaz();
        }
        guardarVentaAbiertaMeta(ID_SESION, {
            total: carrito.reduce((acc, item) => acc + Number(item.precio || 0) * Number(item.cantidad || 0), 0),
            items: carrito,
            actualizado: new Date().toISOString(),
            estado: 'abierta'
        });
        renderVentasAbiertas();
        mostrarMensaje("Producto agregado al carrito");

    } catch (error) {
        console.error("Error al conectar con la nube:", error);
        mostrarMensaje("No se pudo sincronizar el carrito con el servicio externo.", "warning");
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

document.addEventListener('DOMContentLoaded', () => {
    obtenerProductos();
});
