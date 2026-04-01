const API_URL="https://script.google.com/macros/s/AKfycbw4DM0trCjx_g6ypBp_nR0-FWZlSSZBByuxnKTCDdsyZo3MSCcgnXhp0ML5B8ckBIs/exec"; 
let productos   = [];
let ventas      = [];
let compras     = [];
let clientes    = [];
let categorias  = [];
let carrito     = JSON.parse(localStorage.getItem("carrito")) || [];
 
const actualizarContadorInterfaz = () => {
  const contador = document.getElementById("contador-carrito");
  if (contador) {
    contador.textContent = carrito.reduce((acc, p) => acc + p.cantidad, 0);
  }
};
 

