const productoCompraInput = document.getElementById('producto-compra');
const cantidadCompraInput = document.getElementById('cantidad-compra');
const costoCompraInput = document.getElementById('costo-compra');
const proveedorCompraInput = document.getElementById('proveedor-compra');
const notaCompraInput = document.getElementById('nota-compra');
const tablaCompraCuerpo = document.querySelector('#tabla-compra tbody');
const totalCompraLabel = document.getElementById('total-compra');
const mensajeBoxCompra = document.getElementById('mensaje');

let compraItems = [];
let productosCompra = [];

function mostrarMensajeCompra(texto, tipo = 'success') {
    if (!mensajeBoxCompra) {
        alert(texto);
        return;
    }
    mensajeBoxCompra.textContent = texto;
    mensajeBoxCompra.className = `mensaje ${tipo} mostrar`;
    setTimeout(() => mensajeBoxCompra.classList.remove('mostrar'), 3000);
}

function parseNumber(value) {
    const numero = Number(String(value).replace(/[^0-9.,-]/g, '').replace(/,/g, '.'));
    return Number.isNaN(numero) ? 0 : numero;
}

function cargarProductosCompra() {
    const datalist = document.getElementById('productos-compra');
    if (!datalist) return;
    fetch(`${API_URL}?resource=productos`)
        .then(response => response.json())
        .then(data => {
            if (data.success && Array.isArray(data.data)) {
                productosCompra = data.data;
                datalist.innerHTML = productosCompra
                    .map(producto => `<option value="${producto.nombre}"></option>`)
                    .join('');
            }
        })
        .catch(error => {
            console.error('Error cargando productos para compras:', error);
            mostrarMensajeCompra('No se pudo cargar el catálogo de productos.', 'error');
        });
}
function cargarProveedoresCompra() {
    const datalist = document.getElementById('proveedores-compra');
    if (!datalist) return;

    fetch(`${API_URL}?resource=proveedores`)
        .then(response => response.json())
        .then(data => {
            if (data.success && Array.isArray(data.data)) {
                datalist.innerHTML = data.data
                    .map(p => `<option value="${p.nombre}"></option>`)
                    .join('');
            } else {
                datalist.innerHTML = '';
                console.error('Error cargando proveedores:', data.message);
            }
        })
        .catch(error => {
            datalist.innerHTML = '';
            console.error('Error de red al cargar proveedores:', error);
        });
}

function calcularTotalCompra() {
    const total = compraItems.reduce((acc, item) => acc + (Number(item.costo) || 0) * (Number(item.cantidad) || 0), 0);
    totalCompraLabel.textContent = `Total: ${total.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}`;
}

function renderizarCompra() {
    if (!tablaCompraCuerpo) return;
    tablaCompraCuerpo.innerHTML = compraItems.map((item, index) => `
        <tr>
            <td>${item.producto}</td>
            <td>${item.cantidad}</td>
            <td>${Number(item.costo).toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}</td>
            <td>${(Number(item.costo) * Number(item.cantidad)).toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}</td>
            <td>
              <button class="btn btn-secondary" onclick="editarItemCompra(${index})">Editar</button>
              <button class="btn btn-danger" onclick="eliminarItemCompra(${index})">Eliminar</button>
            </td>
        </tr>
    `).join('');
    calcularTotalCompra();
}

function agregarItemCompra() {
    const producto = productoCompraInput.value.trim();
    const cantidad = parseNumber(cantidadCompraInput.value);
    const costo = parseNumber(costoCompraInput.value);
    const proveedor = proveedorCompraInput.value.trim();

    if (!producto || cantidad <= 0 || costo <= 0 || !proveedor) {
        mostrarMensajeCompra('Completa producto, cantidad, costo y proveedor.', 'error');
        return;
    }

    compraItems.push({ producto, cantidad, costo, proveedor, nota: notaCompraInput.value.trim() });
    productoCompraInput.value = '';
    cantidadCompraInput.value = '';
    costoCompraInput.value = '';
    notaCompraInput.value = '';
    renderizarCompra();
}

function editarItemCompra(index) {
    const item = compraItems[index];
    if (!item) return;
    const nuevoProducto = prompt('Producto', item.producto)?.trim();
    const nuevaCantidad = parseNumber(prompt('Cantidad', item.cantidad));
    const nuevoCosto = parseNumber(prompt('Costo unitario', item.costo));
    if (!nuevoProducto || nuevaCantidad <= 0 || nuevoCosto <= 0) {
        mostrarMensajeCompra('Valores inválidos para el producto.', 'error');
        return;
    }
    compraItems[index] = { ...item, producto: nuevoProducto, cantidad: nuevaCantidad, costo: nuevoCosto };
    renderizarCompra();
}

function eliminarItemCompra(index) {
    compraItems.splice(index, 1);
    renderizarCompra();
}
async function registrarCompra() {
    if (compraItems.length === 0) {
        mostrarMensajeCompra('Agrega productos a la lista primero.', 'error');
        return;
    }

    const proveedorSeleccionado = proveedorCompraInput.value.trim();
    if (!proveedorSeleccionado) {
        mostrarMensajeCompra('Debes seleccionar un proveedor.', 'error');
        return;
    }

    const nuevoId = `CP-${Date.now()}`;
    const totalCalculado = compraItems.reduce((acc, item) => acc + (Number(item.costo) * Number(item.cantidad)), 0);

    const compra = {
        resource: "Compras",
        id: nuevoId,
        fecha: new Date().toLocaleString('es-CO'),
        proveedor: proveedorSeleccionado,
        total: totalCalculado,
        nota: notaCompraInput.value.trim() || "Sin nota",
        items: JSON.stringify(compraItems)
    };

    try {
        mostrarMensajeCompra(`Enviando registro ${nuevoId}...`, 'info');
        
        // CAMBIO CRÍTICO AQUÍ: Usamos mode: 'no-cors' y 'text/plain'
        await fetch(API_URL, {
            method: 'POST',
            mode: 'no-cors', 
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify(compra)
        });

        // Como usamos no-cors, no podemos leer la respuesta JSON, 
        // así que asumimos éxito si el fetch no lanza error.
        mostrarMensajeCompra(`Compra ${nuevoId} registrada con éxito.`, 'success');
        
        compraItems = [];
        renderizarCompra();
        limpiarFormularioCompra();
    } catch (error) {
        console.error('Error:', error);
        mostrarMensajeCompra('Error de conexión con el servidor.', 'error');
    }
}

function limpiarFormularioCompra() {
    proveedorCompraInput.value = '';
    notaCompraInput.value = '';
    productoCompraInput.value = '';
    cantidadCompraInput.value = '';
    costoCompraInput.value = '';
}
function limpiarCompra() {
    compraItems = []; // Vacía la lista de productos agregados
    limpiarFormularioCompra(); // Limpia los inputs
    renderizarCompra(); // Refresca la tabla
}

function inicializarCompras() {
    document.getElementById('agregar-compra')?.addEventListener('click', agregarItemCompra);
    document.getElementById('registrar-compra')?.addEventListener('click', registrarCompra);
    document.getElementById('vaciar-compra')?.addEventListener('click', limpiarCompra);
    document.getElementById('limpiar-compra')?.addEventListener('click', limpiarCompra);
    cargarProductosCompra();
    cargarProveedoresCompra();
    renderizarCompra();
}

window.editarItemCompra = editarItemCompra;
window.eliminarItemCompra = eliminarItemCompra;
window.addEventListener('DOMContentLoaded', inicializarCompras);
