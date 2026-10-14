/* ============================================================
   FinanApp — Lógica de la aplicación
   ============================================================ */

// -------------------- ESTADO GLOBAL --------------------
const CLAVE_MOVIMIENTOS = "finanapp_movimientos";
const CLAVE_TEMA = "finanapp_tema";

let movimientos = [];
let seccionActual = "inicio";

// Íconos por categoría (para la lista de movimientos)
const ICONOS_CATEGORIA = {
  "Alimentación": "🍔",
  "Transporte": "🚌",
  "Vivienda": "🏠",
  "Educación": "🎓",
  "Tecnología": "💻",
  "Entretenimiento": "🎬",
  "Compras": "🛍️",
  "Salud": "💊",
  "Otros": "📦"
};

// -------------------- INICIALIZACIÓN --------------------
document.addEventListener("DOMContentLoaded", function () {
  cargarTema();
  cargarDatos();
  actualizarDashboard();
  mostrarMovimientos();
  mostrarEstadisticas();
  mostrarSeccion("inicio");

  // Fecha por defecto = hoy
  const inputFecha = document.getElementById("input-fecha");
  if (inputFecha) {
    inputFecha.value = obtenerFechaHoy();
  }
});

// -------------------- PERSISTENCIA --------------------
function cargarDatos() {
  try {
    const datosGuardados = localStorage.getItem(CLAVE_MOVIMIENTOS);
    if (!datosGuardados) {
      movimientos = [];
      return;
    }
    const parseado = JSON.parse(datosGuardados);
    movimientos = Array.isArray(parseado) ? parseado : [];
  } catch (error) {
    // JSON inválido o corrupto: reiniciar a lista vacía
    console.error("Error al leer localStorage, reiniciando movimientos:", error);
    movimientos = [];
  }
}

function guardarDatos() {
  try {
    localStorage.setItem(CLAVE_MOVIMIENTOS, JSON.stringify(movimientos));
  } catch (error) {
    console.error("Error al guardar en localStorage:", error);
    mostrarToast("⚠️ No se pudo guardar la información");
  }
}

// -------------------- NAVEGACIÓN --------------------
function mostrarSeccion(nombreSeccion) {
  const secciones = document.querySelectorAll(".seccion");
  secciones.forEach(function (seccion) {
    seccion.classList.remove("activa");
  });

  const seccionElegida = document.getElementById("seccion-" + nombreSeccion);
  if (seccionElegida) {
    seccionElegida.classList.add("activa");
  }

  const navItems = document.querySelectorAll(".nav-item");
  navItems.forEach(function (item) {
    item.classList.remove("activo");
  });

  const navElegido = document.getElementById("nav-" + nombreSeccion);
  if (navElegido) {
    navElegido.classList.add("activo");
  }

  seccionActual = nombreSeccion;

  // Refrescar datos de la sección visitada
  if (nombreSeccion === "estadisticas") {
    mostrarEstadisticas();
  }
  if (nombreSeccion === "movimientos") {
    mostrarMovimientos();
  }

  window.scrollTo(0, 0);
}

// -------------------- BOTÓN FLOTANTE --------------------
function toggleMenuFab() {
  const menu = document.getElementById("fab-menu");
  const overlay = document.getElementById("fab-overlay");
  menu.classList.toggle("abierto");
  overlay.classList.toggle("abierto");
}

// -------------------- FORMULARIO / MODAL --------------------
function abrirFormulario(tipo) {
  const modal = document.getElementById("modal-formulario");
  const titulo = document.getElementById("modal-titulo");
  const subtitulo = document.getElementById("modal-subtitulo");
  const btnGuardar = document.getElementById("btn-guardar-movimiento");
  const inputTipo = document.getElementById("input-tipo");

  inputTipo.value = tipo;

  if (tipo === "ingreso") {
    titulo.textContent = "Agregar ingreso";
    subtitulo.textContent = "Registra un nuevo ingreso";
    btnGuardar.textContent = "Guardar ingreso";
  } else {
    titulo.textContent = "Agregar gasto";
    subtitulo.textContent = "Registra un nuevo gasto";
    btnGuardar.textContent = "Guardar gasto";
  }

  document.getElementById("input-fecha").value = obtenerFechaHoy();

  modal.classList.add("abierto");
}

function cerrarFormulario() {
  const modal = document.getElementById("modal-formulario");
  modal.classList.remove("abierto");
  limpiarFormulario();
}

function limpiarFormulario() {
  document.getElementById("form-movimiento").reset();
  document.getElementById("input-fecha").value = obtenerFechaHoy();

  ["monto", "descripcion", "categoria", "fecha", "cuenta"].forEach(function (campo) {
    const elementoError = document.getElementById("error-" + campo);
    if (elementoError) {
      elementoError.textContent = "";
    }
  });
}

function guardarMovimiento(evento) {
  evento.preventDefault();

  const tipo = document.getElementById("input-tipo").value;
  const monto = parseFloat(document.getElementById("input-monto").value);
  const descripcion = document.getElementById("input-descripcion").value.trim();
  const categoria = document.getElementById("input-categoria").value;
  const fecha = document.getElementById("input-fecha").value;
  const cuenta = document.getElementById("input-cuenta").value;

  let esValido = true;

  // Limpiar errores previos
  ["monto", "descripcion", "categoria", "fecha", "cuenta"].forEach(function (campo) {
    document.getElementById("error-" + campo).textContent = "";
  });

  if (isNaN(monto) || monto <= 0) {
    document.getElementById("error-monto").textContent = "Ingresa un monto mayor que 0";
    esValido = false;
  }
  if (!descripcion) {
    document.getElementById("error-descripcion").textContent = "La descripción es obligatoria";
    esValido = false;
  }
  if (!categoria) {
    document.getElementById("error-categoria").textContent = "Selecciona una categoría";
    esValido = false;
  }
  if (!fecha) {
    document.getElementById("error-fecha").textContent = "Selecciona una fecha";
    esValido = false;
  }
  if (!cuenta) {
    document.getElementById("error-cuenta").textContent = "Selecciona una cuenta";
    esValido = false;
  }

  if (!esValido) {
    return;
  }

  const nuevoMovimiento = {
    id: Date.now(),
    tipo: tipo,
    monto: monto,
    descripcion: descripcion,
    categoria: categoria,
    fecha: fecha,
    cuenta: cuenta
  };

  movimientos.push(nuevoMovimiento);
  guardarDatos();

  actualizarDashboard();
  mostrarMovimientos();
  mostrarEstadisticas();

  cerrarFormulario();

  if (tipo === "ingreso") {
    mostrarToast("✅ Ingreso guardado correctamente");
  } else {
    mostrarToast("✅ Gasto guardado correctamente");
  }
}

// -------------------- DASHBOARD (INICIO) --------------------
function actualizarDashboard() {
  const totales = calcularTotales();

  document.getElementById("saldo-total").textContent = formatearMoneda(totales.saldo);
  document.getElementById("total-ingresos").textContent = formatearMoneda(totales.ingresos);
  document.getElementById("total-gastos").textContent = formatearMoneda(totales.gastos);

  renderizarListaMovimientos("lista-movimientos-recientes", obtenerMovimientosOrdenados().slice(0, 5));
}

function calcularTotales() {
  let ingresos = 0;
  let gastos = 0;

  movimientos.forEach(function (movimiento) {
    if (movimiento.tipo === "ingreso") {
      ingresos += movimiento.monto;
    } else {
      gastos += movimiento.monto;
    }
  });

  return {
    ingresos: ingresos,
    gastos: gastos,
    saldo: ingresos - gastos
  };
}

// -------------------- MOVIMIENTOS --------------------
function obtenerMovimientosOrdenados() {
  return [...movimientos].sort(function (a, b) {
    if (a.fecha === b.fecha) {
      return b.id - a.id;
    }
    return new Date(b.fecha) - new Date(a.fecha);
  });
}

function mostrarMovimientos() {
  const ordenados = obtenerMovimientosOrdenados();
  renderizarListaMovimientos("lista-movimientos-todos", ordenados);
}

function renderizarListaMovimientos(idContenedor, lista) {
  const contenedor = document.getElementById(idContenedor);
  if (!contenedor) return;

  contenedor.innerHTML = "";

  if (lista.length === 0) {
    contenedor.innerHTML =
      '<div class="estado-vacio">' +
      '<span class="estado-vacio-icono">📋</span>' +
      '<p class="estado-vacio-titulo">Aún no tienes movimientos</p>' +
      '<p class="estado-vacio-subtitulo">Agrega tu primer ingreso o gasto</p>' +
      "</div>";
    return;
  }

  lista.forEach(function (movimiento) {
    const esIngreso = movimiento.tipo === "ingreso";
    const icono = esIngreso ? "💰" : (ICONOS_CATEGORIA[movimiento.categoria] || "💸");
    const signo = esIngreso ? "+" : "-";
    const claseMonto = esIngreso ? "positivo" : "negativo";

    const item = document.createElement("div");
    item.className = "movimiento-item";
    item.innerHTML =
      '<div class="movimiento-icono">' + icono + "</div>" +
      '<div class="movimiento-info">' +
      '<p class="movimiento-descripcion">' + escaparTexto(movimiento.descripcion) + "</p>" +
      '<p class="movimiento-detalle">' + escaparTexto(movimiento.categoria) + " · " +
      escaparTexto(movimiento.cuenta) + " · " + formatearFecha(movimiento.fecha) + "</p>" +
      "</div>" +
      '<div class="movimiento-monto ' + claseMonto + '">' + signo + " " + formatearMoneda(movimiento.monto) + "</div>";

    contenedor.appendChild(item);
  });
}

// -------------------- ESTADÍSTICAS --------------------
function mostrarEstadisticas() {
  const totales = calcularTotales();

  document.getElementById("stat-ingresos").textContent = formatearMoneda(totales.ingresos);
  document.getElementById("stat-gastos").textContent = formatearMoneda(totales.gastos);
  document.getElementById("stat-saldo").textContent = formatearMoneda(totales.saldo);
  document.getElementById("stat-cantidad").textContent = movimientos.length;

  const porCategoria = {};
  movimientos.forEach(function (movimiento) {
    if (movimiento.tipo === "gasto") {
      const categoria = movimiento.categoria || "Otros";
      porCategoria[categoria] = (porCategoria[categoria] || 0) + movimiento.monto;
    }
  });

  const contenedorCategorias = document.getElementById("lista-categorias");
  contenedorCategorias.innerHTML = "";

  const categoriasOrdenadas = Object.keys(porCategoria).sort(function (a, b) {
    return porCategoria[b] - porCategoria[a];
  });

  if (categoriasOrdenadas.length === 0) {
    contenedorCategorias.innerHTML =
      '<div class="estado-vacio">' +
      '<span class="estado-vacio-icono">📊</span>' +
      '<p class="estado-vacio-titulo">Sin datos todavía</p>' +
      '<p class="estado-vacio-subtitulo">Registra gastos para ver el resumen</p>' +
      "</div>";
    return;
  }

  categoriasOrdenadas.forEach(function (categoria) {
    const fila = document.createElement("div");
    fila.className = "categoria-item";
    fila.innerHTML =
      '<span class="categoria-nombre">' + (ICONOS_CATEGORIA[categoria] || "📦") + " " + escaparTexto(categoria) + "</span>" +
      '<span class="categoria-monto">' + formatearMoneda(porCategoria[categoria]) + "</span>";
    contenedorCategorias.appendChild(fila);
  });
}

// -------------------- CONFIGURACIÓN: TEMA --------------------
function cargarTema() {
  let temaGuardado = "sistema";
  try {
    temaGuardado = localStorage.getItem(CLAVE_TEMA) || "sistema";
  } catch (error) {
    console.error("Error al leer el tema guardado:", error);
  }

  aplicarTema(temaGuardado);

  const radio = document.getElementById("tema-" + temaGuardado);
  if (radio) {
    radio.checked = true;
  }
}

function cambiarTema(tema) {
  aplicarTema(tema);
  try {
    localStorage.setItem(CLAVE_TEMA, tema);
  } catch (error) {
    console.error("Error al guardar el tema:", error);
  }
}

function aplicarTema(tema) {
  const body = document.body;
  body.classList.remove("tema-oscuro");

  let esOscuro = false;

  if (tema === "oscuro") {
    esOscuro = true;
  } else if (tema === "sistema") {
    esOscuro = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  }

  if (esOscuro) {
    body.classList.add("tema-oscuro");
  }
}

// Reaccionar a cambios del tema del sistema en tiempo real
if (window.matchMedia) {
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function () {
    let temaGuardado = "sistema";
    try {
      temaGuardado = localStorage.getItem(CLAVE_TEMA) || "sistema";
    } catch (error) {
      temaGuardado = "sistema";
    }
    if (temaGuardado === "sistema") {
      aplicarTema("sistema");
    }
  });
}

// -------------------- CONFIGURACIÓN: ELIMINAR MOVIMIENTOS --------------------
function confirmarEliminarMovimientos() {
  document.getElementById("modal-confirmar").classList.add("abierto");
}

function cerrarModalConfirmar() {
  document.getElementById("modal-confirmar").classList.remove("abierto");
}

function eliminarMovimientos() {
  movimientos = [];
  try {
    localStorage.removeItem(CLAVE_MOVIMIENTOS);
  } catch (error) {
    console.error("Error al eliminar localStorage:", error);
  }

  actualizarDashboard();
  mostrarMovimientos();
  mostrarEstadisticas();

  cerrarModalConfirmar();
  mostrarToast("✅ Movimientos eliminados");
}

// -------------------- UTILIDADES --------------------
function formatearMoneda(valor) {
  try {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0
    }).format(valor);
  } catch (error) {
    return "$ " + Math.round(valor);
  }
}

function formatearFecha(fechaISO) {
  if (!fechaISO) return "";
  const partes = fechaISO.split("-");
  if (partes.length !== 3) return fechaISO;
  const [anio, mes, dia] = partes;
  return dia + "/" + mes + "/" + anio;
}

function obtenerFechaHoy() {
  const hoy = new Date();
  const anio = hoy.getFullYear();
  const mes = String(hoy.getMonth() + 1).padStart(2, "0");
  const dia = String(hoy.getDate()).padStart(2, "0");
  return anio + "-" + mes + "-" + dia;
}

function escaparTexto(texto) {
  const div = document.createElement("div");
  div.textContent = texto == null ? "" : texto;
  return div.innerHTML;
}

let temporizadorToast = null;
function mostrarToast(mensaje) {
  const toast = document.getElementById("toast");
  toast.textContent = mensaje;
  toast.classList.add("visible");

  if (temporizadorToast) {
    clearTimeout(temporizadorToast);
  }
  temporizadorToast = setTimeout(function () {
    toast.classList.remove("visible");
  }, 2200);
}