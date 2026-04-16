const API_URL = "https://script.google.com/macros/s/AKfycbxeDfafnPFJ3mJ10_SWNxN4AMvT6BUJ63gwIBJWl9tXOAAQ71c_TeGHGoetliB-_Hw/exec";
let productos = [];
let carrito = [];
let ventas = [];
let compras = [];
let clientes = [];
let categorias = [];

const STORAGE_KEYS = {
  ventasAbiertas: 'papel_luna_ventas_abiertas',
  categorias: 'papel_luna_categorias',
  proveedores: 'papel_luna_proveedores',
  clientes: 'papel_luna_clientes'
};

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
    // Ignorar fallos de almacenamiento
  }
}

const CART_STORAGE_PREFIX = 'papel_luna_cart_';

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

function cargarVentasAbiertas() {
  return cargarStorageJSON(STORAGE_KEYS.ventasAbiertas);
}

function guardarVentaAbiertaMeta(sesion, meta) {
  const ventas = cargarVentasAbiertas();
  const index = ventas.findIndex(v => String(v.id) === String(sesion));
  const openSale = {
    id: sesion,
    fecha: meta.fecha || new Date().toLocaleString('es-CO'),
    total: Number(meta.total) || 0,
    items: meta.items || [],
    actualizado: meta.actualizado || new Date().toISOString(),
    estado: meta.estado || 'abierta'
  };

  if (index >= 0) {
    ventas[index] = openSale;
  } else {
    ventas.push(openSale);
  }

  guardarStorageJSON(STORAGE_KEYS.ventasAbiertas, ventas);
}

function borrarVentaAbierta(sesion) {
  const ventas = cargarVentasAbiertas().filter(v => String(v.id) !== String(sesion));
  guardarStorageJSON(STORAGE_KEYS.ventasAbiertas, ventas);
}

function cargarEntidades(tipo) {
  return cargarStorageJSON(STORAGE_KEYS[tipo] || '[]');
}

function guardarEntidades(tipo, lista) {
  guardarStorageJSON(STORAGE_KEYS[tipo], lista);
}

const actualizarContadorInterfaz = () => {
  const contador = document.getElementById("contador-carrito");
  if (contador) {
    contador.textContent = carrito.reduce((acc, p) => acc + (Number(p.cantidad) || 0), 0);
  }
};
 

