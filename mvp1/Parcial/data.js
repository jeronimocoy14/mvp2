const productosIniciales = [
  { id: 1, nombre: "Cuadernos argollados (100 hojas)", categoria: "Cuadernos", precio: 23000, costo: 18000, stock: 40, seguimientoInventario: true, imagen: "cuadernos.jpg", descripcion: "Cuaderno argollado de 100 hojas." },
  { id: 2, nombre: "Marcadores de colores", categoria: "Marcadores", precio: 15000, costo: 10000, stock: 30, seguimientoInventario: true, imagen: "marcadores.jpg", descripcion: "Set de marcadores." },
  { id: 3, nombre: "Lápices de colores", categoria: "Lápices", precio: 10000, costo: 7000, stock: 50, seguimientoInventario: true, imagen: "lapices.jpg", descripcion: "Caja x12." },
  { id: 4, nombre: "Resaltadores de colores", categoria: "Resaltadores", precio: 12000, costo: 8000, stock: 35, seguimientoInventario: true, imagen: "resaltadores.jpg", descripcion: "Fluorescentes." },
  { id: 5, nombre: "Cartulinas de colores", categoria: "Cartulinas", precio: 15000, costo: 10000, stock: 60, seguimientoInventario: true, imagen: "cartulinas.jpg", descripcion: "Pliego." },
  { id: 6, nombre: "Esferos de colores", categoria: "Esferos", precio: 10000, costo: 6500, stock: 45, seguimientoInventario: true, imagen: "esferos.jpg", descripcion: "Set tinta suave." },
  { id: 7, nombre: "Borradores", categoria: "Accesorios", precio: 5000, costo: 3000, stock: 120, seguimientoInventario: true, imagen: "borradores.jpg", descripcion: "No daña papel." },
  { id: 8, nombre: "Tijeras", categoria: "Herramientas", precio: 10000, costo: 6500, stock: 30, seguimientoInventario: true, imagen: "tijeras.jpg", descripcion: "Punta redonda." },
  { id: 9, nombre: "Pegamento", categoria: "Adhesivos", precio: 7000, costo: 4500, stock: 55, seguimientoInventario: true, imagen: "pegastic.jpg", descripcion: "En barra." },
  { id: 10, nombre: "Post-it", categoria: "Oficina", precio: 5000, costo: 3000, stock: 80, seguimientoInventario: true, imagen: "post-it.jpg", descripcion: "Notas adhesivas." },
  { id: 11, nombre: "Cinta adhesiva", categoria: "Adhesivos", precio: 5000, costo: 3200, stock: 70, seguimientoInventario: true, imagen: "cinta.jpg", descripcion: "Multiuso." },
  { id: 12, nombre: "Carpetas de colores", categoria: "Oficina", precio: 10000, costo: 6500, stock: 40, seguimientoInventario: true, imagen: "carpetas.jpg", descripcion: "Documentos." }
];

if (!localStorage.getItem("productos")) {
  localStorage.setItem("productos", JSON.stringify(productosIniciales));
}