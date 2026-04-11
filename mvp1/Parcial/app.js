const mensajeBox = document.getElementById("mensaje");
const ID_SESION = "SES-" + Date.now();
const contadorCarrito = document.getElementById("contador-carrito");

async function obtenerProductos() {
    try {
        const respuesta = await fetch(`${API_URL}?resource=productos`);
        const resultado = await respuesta.json();

        if (resultado.success) {
            productos = resultado.data;
            renderProductos(productos);
        }
    } catch (error) {
        console.error("Error cargando productos desde Sheets:", error);
    }
}
function renderProductos(lista) {
    const catalogo = document.getElementById("catalogo");
    catalogo.innerHTML = "";

    lista.forEach(p => {
        console.log("Dibujando producto:", p);

        const card = document.createElement("div");
        card.className = "card";
        card.innerHTML = `
    <img src="${p.imagen}" alt="${p.nombre}">
    <h3>${p.nombre}</h3>
    <p>${Number(p.precio).toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}</p>
    <button onclick="agregar('${p.id}')">Agregar</button> 
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

    const itemExistente = carrito.find(item => String(item.id) === String(id));

    if (itemExistente) {
        itemExistente.cantidad += 1;
    } else {
        
        carrito.push({ ...producto, cantidad: 1 });
    }
     contadorCarritoActualizar();
    const datos = {
        id_sesion: ID_SESION,
        id_producto: producto.id,
        nombre: producto.nombre,
        precio: producto.precio,
        cantidad: 1
    };
   
    try {
        const respuesta = await fetch(`${API_URL}?resource=Carrito`, {
            method: "POST",
            mode: "cors",
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
function mostrarMensaje(texto, tipo = "success") {
    if (!mensajeBox) return;
    mensajeBox.textContent = texto;
    mensajeBox.className = `mensaje ${tipo} mostrar`;
    setTimeout(() => mensajeBox.classList.remove("mostrar"), 3000);
}
 

function cerrarModal() {
    modalOverlay.classList.add("oculto");
}



function verCarrito() {
   
    if (!ID_SESION) {
        console.error("Error: No se ha generado un ID de sesión");
        return;
    }
    window.location.href = `carrito.html?sesion=${ID_SESION}`;
}

function createResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

obtenerProductos();