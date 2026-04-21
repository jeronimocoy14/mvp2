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
