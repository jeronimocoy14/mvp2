const params = new URLSearchParams(window.location.search);
const miSesion = params.get("sesion");
const mensajeBox = document.getElementById("mensaje");
const metodoSelect = document.getElementById("metodo");
const recibidoInput = document.getElementById("recibido");
const cambioSpan = document.getElementById("cambio");
const efectivoBox = document.getElementById("efectivo-box");

function normalizarItemCarrito(item) {
    return {
        id_sesion: item.id_sesion ?? item.idSesion ?? item.sesion ?? item.SESION,
        id_producto: item.id_producto ?? item.idProducto ?? item.id ?? item.producto ?? item.product_id ?? item.productId,
        nombre: item.nombre ?? item.Nombre ?? item.producto ?? item.name,
        precio: item.precio ?? item.Precio ?? item.valor ?? item.price,
        cantidad: item.cantidad ?? item.Cantidad ?? item.cant ?? item.quantity ?? 1
    };
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
    const pagado = Number(recibidoInput.value) || 0;
    const cambio = pagado - total;
    if (cambio < 0) {
        cambioSpan.textContent = `Faltan ${Math.abs(cambio).toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}`;
    } else {
        cambioSpan.textContent = cambio.toLocaleString('es-CO', { style: 'currency', currency: 'COP' });
    }
}

async function cargarCarritoDesdeNube() {
    if (!miSesion) {
        console.error("No hay sesión en la URL");
        return;
    }
    const contenedor = document.getElementById("carrito-lista");
    if (contenedor) contenedor.innerHTML = "<p>Cargando tu carrito...</p>";

    try {
        const respuesta = await fetch(`${API_URL}?resource=Carrito`);
        const resultado = await respuesta.json();

        if (resultado.success) {
            carrito = resultado.data
                .map(normalizarItemCarrito)
                .filter(item => String(item.id_sesion).trim() === String(miSesion).trim());
            console.log("Productos filtrados para esta sesión:", carrito);
            render(); // Dibujamos los productos filtrados
        }
    } catch (error) {
        console.error("Error cargando carrito:", error);
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
    try {
        const idProducto = item.id_producto;
        if (!idProducto) {
            console.error("No se encontró id_producto en el ítem:", item);
            return;
        }
        const datos = {
            id_sesion: miSesion,
            id_producto: idProducto,
            accion: "delete"
        };
        const respuesta = await fetch(`${API_URL}?resource=Carrito`, {
            method: "POST",
            mode: "cors",
            body: JSON.stringify(datos)
        });
        const resultado = await respuesta.json();
        console.log("Eliminar carrito response:", resultado);
        if (!resultado.success) {
            console.error("No se pudo eliminar el ítem del carrito:", resultado);
            return;
        }
        carrito.splice(index, 1);
        render();
    } catch (error) {
        console.error("Error eliminando item del carrito:", error);
    }
}
async function vaciar_carrito() {
    if (!miSesion) {
        console.error("No hay sesión en la URL");
        return;
    }
    try {
        const datos = {
            id_sesion: miSesion,
            accion: "vaciar"
        };
     
        const respuesta = await fetch(`${API_URL}?resource=Carrito`, {
            method: "POST",
            mode: "cors",
            body: JSON.stringify(datos)
        });
        const resultado = await respuesta.json();
       
        if (!resultado.success) {
            console.error("No se pudo vaciar el carrito:", resultado);
            return;
        }
        carrito = [];
        render();
    } catch (error) {
        console.error("Error vaciando carrito:", error);
    }
}

async function cerrarVenta() {
    if (!miSesion) {
        console.error("No hay sesión en la URL");
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
        recibido = Number(recibidoInput?.value || 0);
        if (recibido <= 0 || recibido < total) {
            mostrarMensaje("Ingresa un valor recibido válido.", "error");
            return;
        }
        cambio = recibido - total;
    }

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
        items: carrito.map(item => ({
            id_sesion: item.id_sesion,
            id_producto: item.id_producto,
            nombre: item.nombre,
            precio: item.precio,
            cantidad: item.cantidad
        }))
    };

    try {
        const respuesta = await fetch(`${API_URL}?resource=ventas`, {
            method: "POST",
            mode: "cors",
            body: JSON.stringify(venta)
        });
        const resultado = await respuesta.json();
        console.log("Cerrar venta response:", resultado);
        if (!resultado.success) {
            mostrarMensaje("No se pudo guardar la venta.", "error");
            console.error("Error guardando venta:", resultado);
            return;
        }

        mostrarMensaje("Venta registrada correctamente.", "success");
        await vaciar_carrito();
    } catch (error) {
        console.error("Error cerrando venta:", error);
        mostrarMensaje("Error al cerrar la venta.", "error");
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
                <p>Cantidad: ${item.cantidad}</p>
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