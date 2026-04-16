const secciones = {
  categorias: {
    key: 'categorias',
    name: 'Categoría',
    storage: 'categorias',
    fields: [
      { id: 'categoria-nombre', label: 'Nombre', required: true },
      { id: 'categoria-descripcion', label: 'Descripción' }
    ],
    listContainer: document.getElementById('categorias-list'),
    buscar: document.getElementById('categoria-buscar')
  },
  proveedores: {
    key: 'proveedores',
    name: 'Proveedor',
    storage: 'proveedores',
    fields: [
      { id: 'proveedor-nombre', label: 'Nombre', required: true },
      { id: 'proveedor-contacto', label: 'Contacto' },
      { id: 'proveedor-telefono', label: 'Teléfono' }
    ],
    listContainer: document.getElementById('proveedores-list'),
    buscar: document.getElementById('proveedor-buscar')
  },
  clientes: {
    key: 'clientes',
    name: 'Cliente',
    storage: 'clientes',
    fields: [
      { id: 'cliente-nombre', label: 'Nombre', required: true },
      { id: 'cliente-documento', label: 'Documento' },
      { id: 'cliente-correo', label: 'Correo' },
      { id: 'cliente-telefono', label: 'Teléfono' }
    ],
    listContainer: document.getElementById('clientes-list'),
    buscar: document.getElementById('cliente-buscar')
  }
};

function inicializarTabs() {
  const botones = document.querySelectorAll('.tab-button');
  botones.forEach(boton => {
    boton.addEventListener('click', () => {
      botones.forEach(btn => btn.classList.remove('active'));
      boton.classList.add('active');
      const panelId = boton.dataset.panel;
      document.querySelectorAll('.tab-panel').forEach(panel => {
        panel.classList.toggle('active', panel.id === panelId);
      });
    });
  });
}

function obtenerDatosSeccion(seccion) {
  const config = secciones[seccion];
  if (!config) return [];
  return cargarEntidades(config.storage);
}

function guardarDatosSeccion(seccion, lista) {
  guardarEntidades(secciones[seccion].storage, lista);
}

function limpiarFormulario(seccion) {
  const config = secciones[seccion];
  if (!config) return;
  config.fields.forEach(field => {
    const elemento = document.getElementById(field.id);
    if (elemento) elemento.value = '';
  });
  const idField = document.getElementById(`${seccion}-id`);
  if (idField) idField.value = '';
}

function renderizarSeccion(seccion, filtro = '') {
  const config = secciones[seccion];
  if (!config || !config.listContainer) return;

  const datos = obtenerDatosSeccion(seccion).filter(item => {
    const texto = Object.values(item).join(' ').toLowerCase();
    return texto.includes(filtro.toLowerCase());
  });

  if (!datos.length) {
    config.listContainer.innerHTML = `<p>No hay ${config.name.toLowerCase()}s registrados.</p>`;
    return;
  }

  config.listContainer.innerHTML = datos.map(item => {
    const detalles = Object.entries(item)
      .filter(([key]) => key !== 'id' && key !== 'nombre')
      .map(([key, value]) => `<p><strong>${key.replace(/([A-Z])/g, ' $1')}:</strong> ${value || '-'}</p>`)
      .join('');

    return `
      <div class="entity-card">
        <h4>${item.nombre}</h4>
        ${detalles}
        <div class="entity-actions">
          <button class="btn btn-secondary" onclick="editarEntidad('${seccion}','${item.id}')">Editar</button>
          <button class="btn btn-danger" onclick="eliminarEntidad('${seccion}','${item.id}')">Eliminar</button>
        </div>
      </div>`;
  }).join('');
}

function recolectarEntidad(seccion) {
  const config = secciones[seccion];
  if (!config) return null;
  const entidad = { id: document.getElementById(`${seccion}-id`).value || Date.now().toString() };
  config.fields.forEach(field => {
    const elemento = document.getElementById(field.id);
    entidad[field.id.replace(`${seccion}-`, '')] = elemento ? elemento.value.trim() : '';
  });

  if (!entidad.nombre) {
    mostrarMensaje(`Ingresa el nombre de la ${config.name.toLowerCase()}.`, 'error');
    return null;
  }
  return entidad;
}

function guardarEntidad(seccion) {
  const config = secciones[seccion];
  if (!config) return;
  const entidad = recolectarEntidad(seccion);
  if (!entidad) return;

  const lista = obtenerDatosSeccion(seccion);
  const index = lista.findIndex(item => String(item.id) === String(entidad.id));
  if (index >= 0) {
    lista[index] = entidad;
    mostrarMensaje(`${config.name} actualizada correctamente.`, 'success');
  } else {
    lista.push(entidad);
    mostrarMensaje(`${config.name} creada correctamente.`, 'success');
  }

  guardarDatosSeccion(seccion, lista);
  limpiarFormulario(seccion);
  renderizarSeccion(seccion);
}

function editarEntidad(seccion, id) {
  const config = secciones[seccion];
  if (!config) return;
  const lista = obtenerDatosSeccion(seccion);
  const item = lista.find(entry => String(entry.id) === String(id));
  if (!item) return;
  config.fields.forEach(field => {
    const elemento = document.getElementById(field.id);
    if (!elemento) return;
    elemento.value = item[field.id.replace(`${seccion}-`, '')] || '';
  });
  const idField = document.getElementById(`${seccion}-id`);
  if (idField) idField.value = item.id;
  document.getElementById(`${seccion}-nombre`)?.focus();
}

function eliminarEntidad(seccion, id) {
  const config = secciones[seccion];
  if (!config) return;
  if (!confirm(`¿Eliminar esta ${config.name.toLowerCase()}?`)) return;

  const lista = obtenerDatosSeccion(seccion).filter(item => String(item.id) !== String(id));
  guardarDatosSeccion(seccion, lista);
  renderizarSeccion(seccion);
  mostrarMensaje(`${config.name} eliminada.`, 'success');
}

function mostrarMensaje(texto, tipo = 'success') {
  const contenedor = document.getElementById('mensaje');
  if (!contenedor) {
    alert(texto);
    return;
  }
  contenedor.textContent = texto;
  contenedor.className = `mensaje ${tipo} mostrar`;
  setTimeout(() => contenedor.classList.remove('mostrar'), 3000);
}

function iniciarEntidades() {
  Object.keys(secciones).forEach(seccion => {
    const config = secciones[seccion];
    renderizarSeccion(seccion);
    if (config.buscar) {
      config.buscar.addEventListener('input', () => {
        renderizarSeccion(seccion, config.buscar.value);
      });
    }
  });

  document.getElementById('categoria-guardar')?.addEventListener('click', () => guardarEntidad('categorias'));
  document.getElementById('proveedor-guardar')?.addEventListener('click', () => guardarEntidad('proveedores'));
  document.getElementById('cliente-guardar')?.addEventListener('click', () => guardarEntidad('clientes'));

  document.getElementById('categoria-limpiar')?.addEventListener('click', () => limpiarFormulario('categorias'));
  document.getElementById('proveedor-limpiar')?.addEventListener('click', () => limpiarFormulario('proveedores'));
  document.getElementById('cliente-limpiar')?.addEventListener('click', () => limpiarFormulario('clientes'));

  inicializarTabs();
}

window.editarEntidad = editarEntidad;
window.eliminarEntidad = eliminarEntidad;
window.addEventListener('DOMContentLoaded', iniciarEntidades);
