const params = new URLSearchParams(window.location.search);
const miSesion = params.get("sesion");
let carrito = []; // Se llenará desde la nube

async function cargarCarritoDesdeNube() {
    if (!miSesion) return;
    
    try {
        const respuesta = await fetch(`${API_URL}?resource=Carrito`);
        const resultado = await respuesta.json();
        
        if (resultado.success) {
            // Filtramos solo los productos que tengan NUESTRO id_sesion
            // Nota: Verifica si en tu Sheets la columna se llama "id" o "id_sesion"
           carrito = resultado.data.filter(item => String(item.id_sesion) === String(miSesion));
            render(); // Llamamos a tu función de dibujo
        }
    } catch (error) {
        console.error("Error cargando carrito:", error);
    }
}

// Al final de tu archivo carrito.js, inicia la carga:
cargarCarritoDesdeNube();