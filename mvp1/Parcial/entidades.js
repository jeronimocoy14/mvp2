// ============================================================
// CONFIGURACIÓN Y CACHE
// ============================================================
const cache = { categorias: [], proveedores: [], clientes: [] };

const secciones = {
  categorias: {
    key: "categorias",
    name: "Categorías",
    fields: [
      { id: "categorias-nombre", label: "Nombre", required: true },
      { id: "categorias-descripcion", label: "Descripción" }
    ],
    get listContainer() { return document.getElementById("categorias-list"); },
    get buscar() { return document.getElementById("categorias-buscar"); }
  },
  proveedores: {
    key: "proveedores",
    name: "Proveedores",
    fields: [
      { id: "proveedores-nombre", label: "Nombre", required: true },
      { id: "proveedores-contacto", label: "Contacto" },
      { id: "proveedores-correo", label: "Correo" },
      { id: "proveedores-telefono", label: "Teléfono" }
    ],
    get listContainer() { return document.getElementById("proveedores-list"); },
    get buscar() { return document.getElementById("proveedores-buscar"); }
  },
  clientes: {
    key: "clientes",
    name: "Clientes",
    fields: [
      { id: "clientes-nombre", label: "Nombre", required: true },
      { id: "clientes-documento", label: "Documento" },
      { id: "clientes-correo", label: "Correo" },
      { id: "clientes-telefono", label: "Teléfono" }
    ],
    get listContainer() { return document.getElementById("clientes-list"); },
    get buscar() { return document.getElementById("clientes-buscar"); }
  }
};

// ============================================================
// COMUNICACIÓN CON LA NUBE (API)
// ============================================================

async function fetchEntidades(resource) {
  try {
    const res = await fetch(`${API_URL}?resource=${resource}`);
    const json = await res.json();
    if (json.success) {
      cache[resource] = json.data;
      return json.data;
    }
    return cache[resource] || [];
  } catch (err) {
    console.error("Error de red (GET):", err);
    return cache[resource] || [];
  }
}

async function postEntidad(resource, data) {
  await fetch(API_URL, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify({ resource, ...data })
  });
  return { success: true };
}

async function deleteEntidad(resource, id) {
  await fetch(API_URL, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify({ resource, action: "delete", id: id })
  });
  return { success: true };
}

// ============================================================
// LÓGICA CRUD Y RENDERIZADO
// ============================================================

function renderizarSeccion(seccion, filtro = "") {
  const config = secciones[seccion];
  if (!config || !config.listContainer) return;

  const datos = (cache[seccion] || []).filter(item => {
    const texto = Object.values(item).join(" ").toLowerCase();
    return texto.includes(filtro.toLowerCase());
  });

  if (!datos.length) {
    config.listContainer.innerHTML = `<p class="empty-msg">No hay registros de ${config.name.toLowerCase()}.</p>`;
    return;
  }

  config.listContainer.innerHTML = datos.map(item => {
    const detalles = Object.entries(item)
      .filter(([key]) => key !== "id" && key !== "nombre")
      .map(([key, value]) => `<p><strong>${key.charAt(0).toUpperCase() + key.slice(1)}:</strong> ${value || "-"}</p>`)
      .join("");

    return `
      <div class="entity-card">
        <h4>${item.nombre}</h4>
        ${detalles}
        <div class="entity-actions">
          <button class="btn btn-secondary" onclick="editarEntidad('${seccion}','${item.id}')">Editar</button>
          <button class="btn btn-danger" onclick="eliminarEntidad('${seccion}','${item.id}')">Eliminar</button>
        </div>
      </div>`;
  }).join("");
}

async function guardarEntidad(seccion) {
  const config = secciones[seccion];
  const entidad = recolectarEntidad(seccion);
  if (!entidad) return;

  const esActualizacion = cache[seccion].some(item => String(item.id) === String(entidad.id));
  
  mostrarMensaje(esActualizacion ? "Actualizando información..." : "Creando nuevo registro...", "info");
  setBusy(seccion, true);

  try {
    const result = await postEntidad(seccion, entidad);

    if (result.success) {
      const idx = cache[seccion].findIndex(item => String(item.id) === String(entidad.id));
      if (idx >= 0) cache[seccion][idx] = entidad;
      else cache[seccion].push(entidad);

      const mensajesExito = {
        categorias: esActualizacion ? "¡Categoría actualizada con éxito!" : "¡Genial! Nueva categoría agregada.",
        proveedores: esActualizacion ? "Datos del proveedor actualizados." : "¡Bienvenido! Nuevo proveedor registrado.",
        clientes: esActualizacion ? "Información del cliente guardada." : "¡Excelente! Cliente añadido a la base de datos."
      };

      mostrarMensaje(mensajesExito[seccion] || "Guardado correctamente", "success");
      limpiarFormulario(seccion);
      renderizarSeccion(seccion, config.buscar?.value || "");
      
      // Sincronización de fondo
      setTimeout(() => fetchEntidades(seccion), 2000);
    }
  } catch (err) {
    mostrarMensaje("Error de conexión al guardar.", "error");
  } finally {
    setBusy(seccion, false);
  }
}

async function eliminarEntidad(seccion, id) {
  const config = secciones[seccion];
  const registro = cache[seccion].find(item => String(item.id) === String(id));
  const nombre = registro ? registro.nombre : "este registro";

  if (!confirm(`¿Estás seguro de que deseas eliminar a "${nombre}"? Esta acción no se puede deshacer.`)) return;

  mostrarMensaje(`Eliminando "${nombre}"...`, "info");
  setBusy(seccion, true);

  try {
    const result = await deleteEntidad(seccion, id);
    if (result.success) {
      cache[seccion] = cache[seccion].filter(item => String(item.id) !== String(id));
      renderizarSeccion(seccion, config.buscar?.value || "");
      mostrarMensaje(`"${nombre}" ha sido removido/a correctamente.`, "success");
    }
  } catch (err) {
    mostrarMensaje("No pudimos eliminar el registro.", "error");
  } finally {
    setBusy(seccion, false);
  }
}

// ============================================================
// HELPERS DE FORMULARIO Y UI
// ============================================================

function recolectarEntidad(seccion) {
  const config = secciones[seccion];
  const entidad = {
    id: document.getElementById(`${seccion}-id`)?.value || Date.now().toString()
  };

  config.fields.forEach(field => {
    const elemento = document.getElementById(field.id);
    const key = field.id.replace(`${seccion}-`, "");
    entidad[key] = elemento ? elemento.value.trim() : "";
  });

  if (!entidad.nombre) {
    mostrarMensaje(`Por favor, ingresa el nombre.`, "warning");
    return null;
  }
  return entidad;
}

function editarEntidad(seccion, id) {
  const item = cache[seccion].find(entry => String(entry.id) === String(id));
  if (!item) return;

  secciones[seccion].fields.forEach(field => {
    const el = document.getElementById(field.id);
    const key = field.id.replace(`${seccion}-`, "");
    if (el) el.value = item[key] || "";
  });

  const idField = document.getElementById(`${seccion}-id`);
  if (idField) idField.value = item.id;
  document.getElementById(`${seccion}-nombre`)?.focus();
}

function limpiarFormulario(seccion) {
  secciones[seccion].fields.forEach(field => {
    const el = document.getElementById(field.id);
    if (el) el.value = "";
  });
  const idField = document.getElementById(`${seccion}-id`);
  if (idField) idField.value = "";
}

function mostrarMensaje(texto, tipo = "success") {
  const contenedor = document.getElementById("mensaje");
  if (!contenedor) return;


  

  contenedor.textContent = ` ${texto}`;
  contenedor.className = `mensaje ${tipo} mostrar`;
  
  clearTimeout(mostrarMensaje._t);
  mostrarMensaje._t = setTimeout(() => contenedor.classList.remove("mostrar"), 3500);
}

function setBusy(seccion, busy) {
  const btn = document.getElementById(`${seccion}-guardar`);
  if (btn) {
    btn.disabled = busy;
    btn.textContent = busy ? "Procesando..." : `Guardar ${secciones[seccion].name.slice(0,-1)}`;
  }
}

async function iniciarEntidades() {
  // Tabs
  document.querySelectorAll('.tab-button').forEach(button => {
    button.addEventListener('click', () => {
      document.querySelectorAll('.tab-button, .tab-panel').forEach(el => el.classList.remove('active'));
      button.classList.add('active');
      document.getElementById(button.dataset.panel).classList.add('active');
    });
  });

  // Carga inicial
  await Promise.all(Object.keys(secciones).map(async seccion => {
    await fetchEntidades(seccion);
    renderizarSeccion(seccion);
    if (secciones[seccion].buscar) {
      secciones[seccion].buscar.addEventListener("input", (e) => renderizarSeccion(seccion, e.target.value));
    }
  }));

  // Event Listeners de botones
  Object.keys(secciones).forEach(sec => {
    document.getElementById(`${sec}-guardar`)?.addEventListener("click", () => guardarEntidad(sec));
    document.getElementById(`${sec}-limpiar`)?.addEventListener("click", () => limpiarFormulario(sec));
  });
}

window.editarEntidad = editarEntidad;
window.eliminarEntidad = eliminarEntidad;
window.addEventListener("DOMContentLoaded", iniciarEntidades);