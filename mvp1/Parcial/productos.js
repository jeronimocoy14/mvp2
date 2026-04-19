const listaContenedor = document.getElementById("lista");
const nombreInput = document.getElementById("nombre");
const precioInput = document.getElementById("precio");
const stockInput = document.getElementById("stock");
const costoInput = document.getElementById("costo");
const categoriaInput = document.getElementById("categoria");
const proveedorInput = document.getElementById("proveedor");
const imagenInput = document.getElementById("imagen");
const borrarInput = document.getElementById("borrar");
const editarInput = document.getElementById("editar");
const restockInput = document.getElementById("restock");
const mensajeBox = document.getElementById("mensaje");
const modalOverlay = document.getElementById("modal-overlay");
const modalText = document.getElementById("modal-text");
const btnVolver = document.getElementById("volver");
const modalInput = document.getElementById("modal-input");
const modalCancel = document.getElementById("modal-cancel");
const modalAccept = document.getElementById("modal-accept");
const modalCosto = document.getElementById("modal-costo");
const modalPrecio = document.getElementById("modal-precio");
const modalCancelar = document.getElementById("modal-cancelar");

function init() {
    cerrarModal();
}

window.addEventListener("DOMContentLoaded", init);


let productoEditandoId = null;
let modalConfirmCallback = null;
let modalPromptCallback = null;

function mostrarEditables(texto, id) {
    productoEditandoId = id; 
    modalText.textContent = texto;
    
    // opciones de borrar
    modalInput.classList.add("oculto");
    modalAccept.classList.add("oculto");
    modalCancel.classList.add("oculto");
    
   //opciones de editar
    modalCosto.classList.remove("oculto");
    modalPrecio.classList.remove("oculto");
    modalCancelar.classList.remove("oculto");

    modalOverlay.classList.remove("oculto");
}

function mostrarConfirm(texto, onConfirm, onCancel) {
    modalText.textContent = texto;
    modalInput.classList.add("oculto");
    modalInput.value = "";
    modalCancel.textContent = "No";
    modalAccept.textContent = "Sí";

    modalConfirmCallback = onConfirm;
    modalPromptCallback = null;
    modalOverlay.classList.remove("oculto");
}

function mostrarPrompt(texto, defaultValue, onSubmit, onCancel) {
    modalText.textContent = texto;
    modalInput.classList.remove("oculto");
    modalInput.value = defaultValue !== undefined ? defaultValue : "";

    modalCancel.textContent = "Cancelar";
    modalAccept.textContent = "Aceptar";

    modalPromptCallback = onSubmit;
    modalConfirmCallback = null;
    modalOverlay.classList.remove("oculto");
    setTimeout(() => modalInput.focus(), 0);
}

function cerrarModal() {
    modalOverlay.classList.add("oculto");
    modalInput.classList.add("oculto");
    
    modalAccept.classList.remove("oculto");
    modalCancel.classList.remove("oculto");
 
    modalCosto.classList.add("oculto");
    modalPrecio.classList.add("oculto");
    modalCancelar.classList.add("oculto");

    modalInput.value = "";
    modalConfirmCallback = null;
    modalPromptCallback = null;
    productoEditandoId = null;
}
modalPrecio.addEventListener("click", () => {
    if (!productoEditandoId) return;
    const producto = productos.find(p => String(p.id).trim() === String(productoEditandoId).trim());

    if (!producto) return mostrarMensaje("Error: No encontrado", "error");
    
    cerrarModal();
    mostrarPrompt(`Nuevo precio para ${producto.nombre}:`, producto.precio, async (nuevoValor) => {
        const num = Number(nuevoValor);
        if (isNaN(num) || num < 0) return mostrarMensaje("Valor no válido", "error");
        
        producto.precio = num;
        producto.resource = "productos"; // <--- ESTO ES VITAL
        await sincronizarConNube(producto);
    });
});

modalCosto.addEventListener("click", () => {
    if (!productoEditandoId) return;
    const producto = productos.find(p => String(p.id).trim() === String(productoEditandoId).trim());

    if (!producto) return mostrarMensaje("Error: No encontrado", "error");
    
    cerrarModal();
    mostrarPrompt(`Nuevo costo para ${producto.nombre}:`, producto.costo, async (nuevoValor) => {
        const num = Number(nuevoValor);
        if (isNaN(num) || num < 0) return mostrarMensaje("Valor no válido", "error");
        
        producto.costo = num;
        producto.resource = "productos"; // <--- ESTO ES VITAL
        await sincronizarConNube(producto);
    });
});

modalCancelar.addEventListener("click", () => {
    cerrarModal();
});

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
    cerrarModal();
});

modalInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        modalAccept.click();
    }
});

function cargarOpcionesEntidades() {
    // Cargar categorías
    fetch(`${API_URL}?resource=categorias`)
        .then(response => response.json())
        .then(data => {
            if (data.success && Array.isArray(data.data)) {
                const categoriasDatalist = document.getElementById('categorias-datalist');
                if (categoriasDatalist) {
                    categoriasDatalist.innerHTML = data.data
                        .map(c => `<option value="${c.nombre}"></option>`)
                        .join('');
                }
            }
        })
        .catch(error => console.error('Error cargando categorías:', error));

    // Cargar proveedores
    fetch(`${API_URL}?resource=proveedores`)
        .then(response => response.json())
        .then(data => {
            if (data.success && Array.isArray(data.data)) {
                const proveedoresDatalist = document.getElementById('proveedores-datalist');
                if (proveedoresDatalist) {
                    proveedoresDatalist.innerHTML = data.data
                        .map(p => `<option value="${p.nombre}"></option>`)
                        .join('');
                }
            }
        })
        .catch(error => console.error('Error cargando proveedores:', error));
}

async function obtenerProductos() {
    try {
        const respuesta = await fetch(`${API_URL}?resource=productos`);
        const resultado = await respuesta.json();

        if (resultado.success) {
            productos = resultado.data;
            renderizarTabla();
        }
    } catch (error) {
        console.error("Error cargando productos:", error);
        mostrarMensaje("Error de conexión con la nube", "error");
    }
}

//Crear o Actualizar en la nube
async function sincronizarConNube(producto, esNuevo = false) {
    try {
        mostrarMensaje("Sincronizando...", "info");

        const respuesta = await fetch(API_URL, {
            method: "POST",
            mode: "no-cors", 
            headers: {
                'Content-Type': 'text/plain; charset=UTF-8' 
            },
            body: JSON.stringify(producto)
        });
        mostrarMensaje(esNuevo ? "Producto creado" : "Producto actualizado");

        renderizarTabla();

        setTimeout(obtenerProductos, 2500);

    } catch (error) {
        console.error("Error en POST:", error);
        mostrarMensaje("Error de red", "error");
    }
}


function cancelar() {
    nombreInput.value = "";
    precioInput.value = "";
    stockInput.value = "";
    costoInput.value = "";
}


async function crear() {
    const nombre = nombreInput.value.trim();
    const precio = Number(precioInput.value);
    const stock = Number(stockInput.value) || 0;
    const costo = Number(costoInput.value) || 0;
    const categoria = categoriaInput?.value.trim() || "General";
    const proveedor = proveedorInput?.value.trim() || "Sin proveedor";
    const imagen = imagenInput?.value.trim() || "https://via.placeholder.com/150";

    if (!nombre || precio <= 0) {
        mostrarMensaje("❌ Ingresa un nombre y precio válido", "error");
        return;
    }

    // Buscamos si ya existe para mantener el ID
    const existente = productos.find(p => p.nombre.toLowerCase() === nombre.toLowerCase());

    const productoData = {
        resource: "productos", // Importante para el servidor
        id: existente ? existente.id : Date.now().toString(),
        nombre: nombre,
        precio: precio,
        stock: stock,
        costo: costo,
        categoria: categoria,
        proveedor: proveedor,
        imagen: imagen
    };

    await sincronizarConNube(productoData, !existente);
    cancelar(); 
}


async function restock(id) {

    const producto = productos.find(p => String(p.id).trim() === String(id).trim());
    if (!producto) {
        mostrarMensaje("Producto no encontrado", "error");
        return;
    }

    mostrarPrompt(`Agregar stock a: ${producto.nombre} (Actual: ${producto.stock})`, "", async (valor) => {
        const cantidadASumar = Number(valor);

        if (isNaN(cantidadASumar) || cantidadASumar <= 0) {
            mostrarMensaje("Por favor, ingresa una cantidad válida", "error");
            return;
        }

        producto.stock = Number(producto.stock) + cantidadASumar;
        
        producto.resource = "productos"; 

        await sincronizarConNube(producto);
    });
}
async function eliminar(id) {
    // Buscamos el producto con comparación robusta de IDs
    const producto = productos.find(p => String(p.id).trim() === String(id).trim());
    if (!producto) return;

    mostrarConfirm(`¿Deseas eliminar definitivamente "${producto.nombre}"?`, async () => {
        try {
            mostrarMensaje("Eliminando de la nube...", "info");

            // Creamos el objeto de la solicitud de borrado
            const datosBorrado = {
                resource: "productos",
                action: "delete", // Añadimos una acción específica
                id: String(id).trim()
            };

            await fetch(API_URL, {
                method: "POST",
                mode: "no-cors", // Evita el error de política CORS
                headers: {
                    'Content-Type': 'text/plain; charset=UTF-8'
                },
                body: JSON.stringify(datosBorrado)
            });

            // Actualización visual inmediata
            productos = productos.filter(p => String(p.id).trim() !== String(id).trim());
            renderizarTabla();

            mostrarMensaje("Producto eliminado con éxito");
            
            // Refrescar desde la nube tras un breve retraso
            setTimeout(obtenerProductos, 2000);

        } catch (error) {
            console.error("Error al eliminar:", error);
            mostrarMensaje("Error de conexión al eliminar", "error");
        }
    });
}


async function editar(id) {
    const producto = productos.find(p => Number(p.id) === Number(id));
    if (!producto) return;

    mostrarEditables(`¿Qué deseas modificar de ${producto.nombre}?`, id);
}



function renderizarTabla() {
    listaContenedor.innerHTML = "";

    productos.forEach(p => {
        const item = document.createElement("div");
        item.className = "producto-item"; 
        item.innerHTML = `
            <p>
                <strong>${p.nombre}</strong> - 
                Precio: ${Number(p.precio).toLocaleString('es-CO', { style: 'currency', currency: 'COP' })} | 
                Stock: <b class="${p.stock < 5 ? 'stock-bajo' : ''}">${p.stock}</b> |
                Costo: ${Number(p.costo || 0).toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}
            </p>
            <p class="info-producto">Categoría: ${p.categoria || 'General'} | Proveedor: ${p.proveedor || 'Desconocido'}</p>
            <div class="acciones">
                <button class="restock" onclick="restock(${p.id})">Restock</button>
                <button class="editar" onclick="editar(${p.id})">Editar</button>
                <button class="eliminar" onclick="eliminar(${p.id})">Eliminar</button> 
            </div>
            <hr>
        `;
        listaContenedor.appendChild(item);
    });
}

function mostrarMensaje(texto, tipo = "success") {
    if (!mensajeBox) return;
    mensajeBox.textContent = texto;
    mensajeBox.className = `mensaje ${tipo} mostrar`;
    setTimeout(() => mensajeBox.classList.remove("mostrar"), 3000);
}

btnVolver.onclick = () => {
    window.location.href = "PapelLuna.html";
};



obtenerProductos();
cargarOpcionesEntidades();