const API_URL="https://script.google.com/macros/s/AKfycbzskgzfCftiQOnDPBC9ZpRqX-ROCNHakQVkNKCQBQ477oPgMTECmDCkeqK1HxYdLfo/exec"; 
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
 

