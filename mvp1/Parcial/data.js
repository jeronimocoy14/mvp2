const API_URL="https://script.google.com/macros/s/AKfycbxIbVLICvT2ua9tjUd7Kh6-Nt6vu2jUoMxO23HLhmf3neMJgcqUkXhSKo2O5KGJjV0/exec"; 
let productos   = [];
let carrito     = [];
let ventas      = [];
let compras     = [];
let clientes    = [];
let categorias  = [];

const actualizarContadorInterfaz = () => {
  const contador = document.getElementById("contador-carrito");
  if (contador) {
    contador.textContent = carrito.reduce((acc, p) => acc + p.cantidad, 0);
  }
};
 

