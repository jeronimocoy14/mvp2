const params = new URLSearchParams(window.location.search);
const miSesion = params.get("sesion") || localStorage.getItem("papel_luna_sesion");
const mensajeBox = document.getElementById("mensaje");
const metodoSelect = document.getElementById("metodo");
const recibidoInput = document.getElementById("recibido");
const cambioSpan = document.getElementById("cambio");
const efectivoBox = document.getElementById("efectivo-box");

function parseNumberInput(value) {
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

function normalizarItemCarrito(item) {
    return {
        id_sesion: item.id_sesion ?? item.idSesion ?? item.sesion ?? item.SESION,
        id_producto: item.id_producto ?? item.idProducto ?? item.id ?? item.producto ?? item.product_id ?? item.productId,
        nombre: item.nombre ?? item.Nombre ?? item.producto ?? item.name,
        precio: item.precio ?? item.Precio ?? item.valor ?? item.price,
        cantidad: Number(item.cantidad ?? item.Cantidad ?? item.cant ?? item.quantity ?? 1),
        stock: Number(item.stock ?? item.Stock ?? 0)
    };
}

function agruparCarritoPorProducto(items) {
    const group = {};
    items.forEach(item => {
        const normalizado = normalizarItemCarrito(item);
        const key = String(normalizado.id_producto ?? normalizado.nombre ?? "").trim();
        if (!group[key]) {
            group[key] = { ...normalizado };
        } else {
            group[key].cantidad = Number(group[key].cantidad || 0) + Number(normalizado.cantidad || 0);
        }
    });
    return Object.values(group);
}

function mostrarMensaje(texto, tipo = "success") {
    if (!mensajeBox) {
        alert(texto);
        return;
    }
    mensajeBox.textContent = texto;
    mensajeBox.className = `mensaje ${tipo} mostrar`;
    setTimeout(() => {
        mensajeBox.classList.remove("mostrar");
    }, 3000);
}

function obtenerTotalCarrito() {
    return carrito.reduce((sum, item) => sum + (Number(item.precio) || 0) * (Number(item.cantidad) || 0), 0);
}

function actualizarMetodoPago() {
    if (!metodoSelect || !efectivoBox) return;
    if (metodoSelect.value === "Efectivo") {
        efectivoBox.style.display = "block";
        calcularCambio();
    } else {
        efectivoBox.style.display = "none";
        if (recibidoInput) recibidoInput.value = "";
        if (cambioSpan) cambioSpan.textContent = "$0";
    }
}

function calcularCambio() {
    if (!recibidoInput || !cambioSpan) return;
    const total = obtenerTotalCarrito();
    const pagado = parseNumberInput(recibidoInput.value);
    const cambio = pagado - total;
    if (cambio < 0) {
        cambioSpan.textContent = `Faltan ${Math.abs(cambio).toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}`;
    } else {
        cambioSpan.textContent = cambio.toLocaleString('es-CO', { style: 'currency', currency: 'COP' });
    }
}

function getCartStorageKey(sesion) {
    return `papel_luna_cart_${sesion}`;
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

async function cargarCarritoDesdeNube() {
    if (!miSesion) {
        console.error("No hay sesión en la URL");
        return;
    }
    const contenedor = document.getElementById("carrito-lista");
    if (contenedor) contenedor.innerHTML = "<p>Cargando tu carrito...</p>";

    const localItems = cargarCarritoLocal(miSesion);
    if (localItems.length) {
        carrito = agruparCarritoPorProducto(localItems);
        render();
        return;
    }

    try {
        const respuesta = await fetch(`${API_URL}?resource=Carrito`);
        const resultado = await respuesta.json();

        if (resultado.success) {
            const rawItems = resultado.data
                .map(normalizarItemCarrito)
                .filter(item => String(item.id_sesion).trim() === String(miSesion).trim());
            carrito = agruparCarritoPorProducto(rawItems);
            console.log("Productos filtrados para esta sesión:", carrito);
            render(); // Dibujamos los productos filtrados
        }
    } catch (error) {
        console.error("Error cargando carrito:", error);
        const contenedor = document.getElementById("carrito-lista");
        if (contenedor) {
            contenedor.innerHTML = "<p>No se pudo cargar el carrito. Intenta recargar la página.</p>";
        }
    }
}
async function eliminarDelCarrito(index) {
    if (!miSesion) {
        console.error("No hay sesión en la URL");
        return;
    }
    const item = carrito[index];
    if (!item) {
        console.error("Ítem no encontrado en el carrito");
        return;
    }

    const idProducto = item.id_producto ?? item.id ?? item.idProducto ?? item.producto;
    if (!idProducto) {
        console.warn("No se encontró id_producto en el ítem, se eliminará localmente:", item);
        carrito.splice(index, 1);
        guardarCarritoLocal(miSesion, carrito);
        render();
        if (typeof actualizarContadorInterfaz === "function") {
            actualizarContadorInterfaz();
        }
        return;
    }

    carrito.splice(index, 1);
    guardarCarritoLocal(miSesion, carrito);
    render();
    if (typeof actualizarContadorInterfaz === "function") {
        actualizarContadorInterfaz();
    }

    try {
        const datos = {
            id_sesion: miSesion,
            id_producto: idProducto,
            accion: "delete"
        };
        const respuesta = await fetch(`${API_URL}?resource=Carrito`, {
            method: "POST",
            mode: "cors",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(datos)
        });
        const resultado = await respuesta.json();
        console.log("Eliminar carrito response:", resultado);
        if (!resultado.success) {
            console.error("No se pudo eliminar el ítem del carrito en el servidor:", resultado);
        }
    } catch (error) {
        console.error("Error eliminando item del carrito:", error);
    }
}
async function vaciar_carrito() {
    if (!miSesion) {
        console.error("No hay sesión en la URL");
        return;
    }

    carrito = [];
    limpiarCarritoLocal(miSesion);
    if (typeof actualizarContadorInterfaz === "function") {
        actualizarContadorInterfaz();
    }
    render();

    try {
        const datos = {
            id_sesion: miSesion,
            accion: "vaciar"
        };

        const respuesta = await fetch(`${API_URL}?resource=Carrito`, {
            method: "POST",
            mode: "cors",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(datos)
        });
        const resultado = await respuesta.json();

        if (!resultado.success) {
            console.error("No se pudo vaciar el carrito en el servidor:", resultado);
        }
    } catch (error) {
        console.error("Error vaciando carrito:", error);
    }
}

async function ajustarCantidadCarrito(index, delta) {
    const item = carrito[index];
    if (!item) return;

    const stock = Number(item.stock) || Number.MAX_SAFE_INTEGER;
    let nuevaCantidad = Number(item.cantidad) + delta;

    if (nuevaCantidad <= 0) {
        await eliminarDelCarrito(index);
        return;
    }
    if (nuevaCantidad > stock) {
        nuevaCantidad = stock;
        mostrarMensaje(`No puedes tener más de ${stock} unidades de este producto.`, "error");
    }

    item.cantidad = nuevaCantidad;
    guardarCarritoLocal(miSesion, carrito);
    render();
    calcularCambio();
    if (typeof actualizarContadorInterfaz === "function") {
        actualizarContadorInterfaz();
    }

    try {
        const datos = {
            id_sesion: miSesion,
            id_producto: item.id_producto,
            cantidad: nuevaCantidad,
            accion: "update"
        };
        const respuesta = await fetch(`${API_URL}?resource=Carrito`, {
            method: "POST",
            mode: "cors",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(datos)
        });
        const resultado = await respuesta.json();
        console.log("Actualizar carrito response:", resultado);
    } catch (error) {
        console.error("Error actualizando carrito:", error);
    }
}

async function decrementarStockProductos(items) {
    for (const item of items) {
        const stockActual = Number(item.stock || 0);
        const cantidad = Number(item.cantidad || 0);
        if (!item.id_producto || stockActual <= 0 || cantidad <= 0) continue;

        const nuevoStock = Math.max(0, stockActual - cantidad);
        try {
            await fetch(`${API_URL}?resource=productos`, {
                method: "POST",
                mode: "cors",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    id: item.id_producto,
                    stock: nuevoStock
                })
            });
        } catch (error) {
            console.error("Error actualizando stock del producto:", item, error);
        }
    }
}

async function cerrarVenta() {
    if (!miSesion) {
        console.error("No hay sesión en la URL");
        return;
    }

    const productoSinStock = carrito.find(item => item.stock > 0 && Number(item.cantidad) > Number(item.stock));
    if (productoSinStock) {
        mostrarMensaje(`No hay suficiente stock de ${productoSinStock.nombre}.`, "error");
        return;
    }
    if (!carrito || carrito.length === 0) {
        mostrarMensaje("El carrito está vacío.", "error");
        return;
    }

    const metodo = metodoSelect ? metodoSelect.value : "";
    if (!metodo) {
        mostrarMensaje("Selecciona un método de pago.", "error");
        return;
    }

    const total = obtenerTotalCarrito();
    let recibido = null;
    let cambio = 0;

    if (metodo === "Efectivo") {
        recibido = parseNumberInput(recibidoInput?.value || '');
        if (recibido <= 0 || recibido < total) {
            mostrarMensaje("Ingresa un valor recibido válido.", "error");
            return;
        }
        cambio = recibido - total;
    }

    const ventaItems = carrito.map(item => ({
        id_sesion: item.id_sesion,
        id_producto: item.id_producto,
        nombre: item.nombre,
        precio: item.precio,
        cantidad: item.cantidad,
        stock: item.stock
    }));

    const venta = {
        id: `VENTA-${Date.now()}`,
        fecha: new Date().toLocaleString('es-CO'),
        clienteid: "",
        motododepago: metodo,
        metodo: metodo,
        metodoPago: metodo,
        total: total,
        recibido: recibido,
        cambio: cambio,
        items: JSON.stringify(ventaItems)
    };

    try {
        const respuesta = await fetch(`${API_URL}?resource=ventas`, {
            method: "POST",
            mode: "cors",
            headers: {
                'Content-Type': 'application/json; charset=UTF-8'
            },
            body: JSON.stringify(venta)
        });

        const textoRespuesta = await respuesta.text();
        console.log("Cerrar venta request:", venta);
        console.log("Cerrar venta response raw:", textoRespuesta);

        if (!respuesta.ok) {
            const serverError = textoRespuesta || `Status ${respuesta.status}`;
            mostrarMensaje(`No se pudo guardar la venta: ${serverError}`, "error");
            console.error("Error guardando venta:", respuesta.status, textoRespuesta);
            return;
        }

        await decrementarStockProductos(carrito);
        carrito = [];
        limpiarCarritoLocal(miSesion);
        if (typeof actualizarContadorInterfaz === "function") {
            actualizarContadorInterfaz();
        }
        render();
        localStorage.removeItem("papel_luna_sesion");
        mostrarMensaje("Venta registrada correctamente.", "success");
        await vaciar_carrito();
    } catch (error) {
        console.warn("Error cerrando venta con CORS, intento no-cors:", error);
        try {
            await fetch(`${API_URL}?resource=ventas`, {
                method: "POST",
                mode: "no-cors",
                body: JSON.stringify(venta)
            });
            await decrementarStockProductos(carrito);
            carrito = [];
            limpiarCarritoLocal(miSesion);
            if (typeof actualizarContadorInterfaz === "function") {
                actualizarContadorInterfaz();
            }
            render();
            localStorage.removeItem("papel_luna_sesion");
            mostrarMensaje("Venta registrada correctamente.", "success");
            await vaciar_carrito();
            return;
        } catch (backupError) {
            console.error("Error cerrando venta en modo no-cors:", backupError);
            mostrarMensaje("Error al cerrar la venta.", "error");
        }
    }
}

function render() {
    const contenedor = document.getElementById("carrito-lista");
    const totalElemento = document.getElementById("total-carrito");

    if (!contenedor) return;
    contenedor.innerHTML = "";
    let sumaTotal = 0;

    if (carrito.length === 0) {
        contenedor.innerHTML = "<p>Tu carrito está vacío.</p>";
        if (totalElemento) totalElemento.textContent = "$0";
        return;
    }

    carrito.forEach((item, index) => {
        const subtotal = Number(item.precio) * Number(item.cantidad);
        sumaTotal += subtotal;

        const div = document.createElement("div");
        div.className = "item-carrito";
        div.innerHTML = `
            <div class="info">
                <h4>${item.nombre}</h4>
                <p>Precio: ${Number(item.precio).toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}</p>
                <p class="cantidad-texto">Cantidad: <strong>${item.cantidad}</strong></p>
                <div class="cantidad-control">
                  <button class="btn btn-secondary btn-cantidad" type="button" onclick="ajustarCantidadCarrito(${index}, -1)">-</button>
                  <span class="cantidad-valor">${item.cantidad}</span>
                  <button class="btn btn-primary btn-cantidad" type="button" onclick="ajustarCantidadCarrito(${index}, 1)">+</button>
                </div>
            </div>
            <div class="subtotal">
                Subtotal: ${subtotal.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}
            </div>
            <button onclick="eliminarDelCarrito(${index})" class="btn-borrar">Eliminar</button>
        `;
        contenedor.appendChild(div);
    });

    if (totalElemento) {
        totalElemento.textContent = sumaTotal.toLocaleString('es-CO', { style: 'currency', currency: 'COP' });
    }
}

if (metodoSelect) {
    metodoSelect.addEventListener("change", actualizarMetodoPago);
}
if (recibidoInput) {
    recibidoInput.addEventListener("input", calcularCambio);
}
const cerrarBtn = document.getElementById("cerrar");
if (cerrarBtn) {
    cerrarBtn.addEventListener("click", cerrarVenta);
}
actualizarMetodoPago();
cargarCarritoDesdeNube();