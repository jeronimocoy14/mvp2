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
            <p>${Number(p.precio).toLocaleString('es-CO', {style:'currency', currency:'COP'})}</p>
            <button onclick="agregar(${p.id})">Agregar</button>
        `;
        catalogo.appendChild(card);
    });
}
const buscador = document.getElementById("buscador");

buscador.addEventListener("input", () => {
    const texto = buscador.value.toLowerCase();
    const filtrados = productos.filter(p => 
        p.nombre.toLowerCase().includes(texto) || 
        p.categoria.toLowerCase().includes(texto)
    );
    renderProductos(filtrados);
});
function agregar(id) {
    const producto = productos.find(p => p.id === id);
    if (!producto) return;

    const itemEnCarrito = carrito.find(p => p.id === id);

    if (itemEnCarrito) {
        itemEnCarrito.cantidad++;
    } else {
        carrito.push({ ...producto, cantidad: 1 });
    }

    localStorage.setItem("carrito", JSON.stringify(carrito));
    actualizarContadorInterfaz();
    mostrarMensaje("Producto agregado al carrito", "success");  
}

obtenerProductos();