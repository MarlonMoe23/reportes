import React, { useState, useEffect } from "react";
import axios from "axios";

function App() {
  const tecnicos = [
    "Carlos Cisneros",
    "César Sánchez",
    "Cristian Lara",
    "Juan Carrión",
    "Miguel Lozada",
    "Roberto Córdova",

    "---",
    "Alex Haro",
    "Angelo Porras",
    "Dario Ojeda",
    "Edgar Ormaza",
    "Israel Pérez",
    "José Urquizo",
    "Kevin Vargas",

    "---",
    "Edisson Bejarano",
    "Leonardo Ballesteros",
    "Marlon Ortiz",
  ];

  const plantas = ["CMA", "CMS", "PT", "CP", "MC"];

  // Estado para equipos sugeridos (autocompletado)
  const [equiposSugeridos, setEquiposSugeridos] = useState([]);
  const [reporteEditando, setReporteEditando] = useState(null);

  const [form, setForm] = useState({
    fecha_reporte: "",
    tecnico: "",
    planta: "",
    equipo: "",
    reporte: "",
    tiempo_horas: "00",
    tiempo_minutos: "00",
    terminado: false,
  });

  const [errores, setErrores] = useState({});
  const [mensaje, setMensaje] = useState("");
  const [reportesDiarios, setReportesDiarios] = useState([]);
  const [guardando, setGuardando] = useState(false);

  // Función para cargar reportes desde Supabase filtrados por técnico
  const cargarReportesDesdeSupabase = async (tecnicoSeleccionado = null) => {
    try {
      const tecnicoFiltro = tecnicoSeleccionado || form.tecnico;
      
      if (!tecnicoFiltro) {
        setReportesDiarios([]);
        return;
      }

      const response = await axios.get(`/api/reportes?tecnico=${encodeURIComponent(tecnicoFiltro)}`);
      if (response.data && Array.isArray(response.data)) {
        setReportesDiarios(response.data);
      }
    } catch (error) {
      console.error('Error al cargar reportes:', error);
      setMensaje('❌ Error al cargar el historial de reportes');
    }
  };

  // Función para eliminar reporte
  const eliminarReporte = async (reporteId) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este reporte?')) {
      return;
    }

    try {
      await axios.delete(`/api/reportes/${reporteId}`);
      setMensaje('✅ Reporte eliminado correctamente');
      await cargarReportesDesdeSupabase();
    } catch (error) {
      console.error('Error al eliminar reporte:', error);
      setMensaje('❌ Error al eliminar el reporte');
    }
  };

 // Función para cargar datos del reporte en el formulario para editar
const editarReporte = (reporte) => {
  const horas = Math.floor(reporte.tiempo);
  const minutos = Math.round((reporte.tiempo - horas) * 60);
  
  // Función auxiliar para convertir fecha a formato YYYY-MM-DD
  const formatearFechaParaInput = (fecha) => {
    if (!fecha) return new Date().toLocaleDateString('en-CA');
    
    // Si ya está en formato YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      return fecha;
    }
    
    // Si viene con timestamp ISO
    if (fecha.includes('T')) {
      return fecha.split('T')[0];
    }
    
    // Si viene en otro formato, intentar crear Date y convertir
    try {
      const fechaObj = new Date(fecha);
      return fechaObj.toLocaleDateString('en-CA');
    } catch (error) {
      console.error('Error al formatear fecha:', error);
      return new Date().toLocaleDateString('en-CA');
    }
  };
  
  setForm({
    fecha_reporte: formatearFechaParaInput(reporte.fecha_reporte),
    tecnico: reporte.tecnico,
    planta: reporte.planta,
    equipo: reporte.equipo,
    reporte: reporte.reporte,
    tiempo_horas: horas.toString().padStart(2, "0"),
    tiempo_minutos: minutos.toString().padStart(2, "0"),
    terminado: reporte.terminado,
  });
  
  setReporteEditando(reporte.id);
  setMensaje('📝 Editando reporte - Modifica los datos y guarda');
  
  // Scroll al formulario
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

  // Función para cancelar edición
  const cancelarEdicion = () => {
    setReporteEditando(null);
    const hoy = new Date().toLocaleDateString('en-CA');
    setForm({
      fecha_reporte: hoy,
      tecnico: form.tecnico,
      planta: form.planta,
      equipo: "",
      reporte: "",
      tiempo_horas: "00",
      tiempo_minutos: "00",
      terminado: false,
    });
    setMensaje('');
  };

  // Indicador visual de guardado (spinner simple)
  const Spinner = () => (
    <div
      role="status"
      aria-live="polite"
      aria-label="Guardando registro"
      style={{ marginLeft: 10, display: "inline-block" }}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 38 38"
        xmlns="http://www.w3.org/2000/svg"
        stroke="#fff"
      >
        <g fill="none" fillRule="evenodd">
          <g transform="translate(1 1)" strokeWidth="2">
            <circle strokeOpacity=".5" cx="18" cy="18" r="18" />
            <path d="M36 18c0-9.94-8.06-18-18-18">
              <animateTransform
                attributeName="transform"
                type="rotate"
                from="0 18 18"
                to="360 18 18"
                dur="1s"
                repeatCount="indefinite"
              />
            </path>
          </g>
        </g>
      </svg>
    </div>
  );

  const iconoEstado = (terminado) => (terminado ? "✅" : "⏳");

  useEffect(() => {
    const hoy = new Date().toLocaleDateString('en-CA');
    const tecnicoGuardado = localStorage.getItem("tecnico") || "";
    const plantaGuardada = localStorage.getItem("planta") || "";
    const equiposGuardados = JSON.parse(localStorage.getItem("equiposSugeridos")) || [];

    setForm((prev) => ({
      ...prev,
      fecha_reporte: hoy,
      tecnico: tecnicoGuardado,
      planta: plantaGuardada,
    }));
    
    setEquiposSugeridos(equiposGuardados);
    
    // Cargar reportes desde Supabase si hay técnico guardado
    if (tecnicoGuardado) {
      cargarReportesDesdeSupabase(tecnicoGuardado);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("equiposSugeridos", JSON.stringify(equiposSugeridos));
  }, [equiposSugeridos]);

  const formatearFecha = (fecha) => {
    const opciones = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    
    // Crear la fecha correctamente
    let fechaObj;
    if (fecha.includes('T')) {
      // Si ya tiene formato ISO
      fechaObj = new Date(fecha);
    } else {
      // Si es solo fecha (YYYY-MM-DD)
      fechaObj = new Date(fecha + 'T00:00:00');
    }
    
    return fechaObj.toLocaleDateString('es-ES', opciones);
  };

  const validar = () => {
    const nuevosErrores = {};

    if (!form.tecnico) nuevosErrores.tecnico = "Selecciona un técnico.";
    if (!form.planta) nuevosErrores.planta = "Selecciona una planta.";
    if (!form.equipo || form.equipo.trim().length < 3)
      nuevosErrores.equipo = "La OT debe tener al menos 3 caracteres.";
    if (!form.reporte || form.reporte.trim().length < 10)
      nuevosErrores.reporte = "El reporte debe tener al menos 10 caracteres.";
    else if (form.reporte.length > 250)
      nuevosErrores.reporte = "El reporte no puede exceder 250 caracteres.";

    const horas = Number(form.tiempo_horas);
    const minutos = Number(form.tiempo_minutos);
    if (
      isNaN(horas) ||
      horas < 0 ||
      horas > 12 || // Limitar a 12 horas
      ![0, 15, 30, 45].includes(minutos)
    ) {
      nuevosErrores.tiempo = "El tiempo debe ser válido y los minutos solo 00, 15, 30 o 45.";
    } else if (horas === 0 && minutos === 0) {
      nuevosErrores.tiempo = "El tiempo debe ser mayor que cero.";
    }

    return nuevosErrores;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    // Limitar longitud del reporte a 250 caracteres
    if (name === "reporte" && value.length > 250) {
      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Si cambió el técnico, recargar reportes
    if (name === "tecnico") {
      cargarReportesDesdeSupabase(value);
    }
  };

  const tiempoDecimal = (horas, minutos) => {
    return horas + minutos / 60;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nuevosErrores = validar();

    if (Object.keys(nuevosErrores).length > 0) {
      setErrores(nuevosErrores);
      setMensaje("");
      return;
    }

    try {
      setGuardando(true);
      localStorage.setItem("tecnico", form.tecnico);
      localStorage.setItem("planta", form.planta);

      // Guardar OT en sugeridos si no está ya
      if (
        form.equipo.trim() &&
        !equiposSugeridos.includes(form.equipo.trim())
      ) {
        const nuevosEquipos = [...equiposSugeridos, form.equipo.trim()];
        setEquiposSugeridos(nuevosEquipos);
        localStorage.setItem("equiposSugeridos", JSON.stringify(nuevosEquipos));
      }

      const reporteData = {
        ...form,
        tiempo: tiempoDecimal(
          Number(form.tiempo_horas),
          Number(form.tiempo_minutos)
        ),
      };

      if (reporteEditando) {
        // Actualizar reporte existente
        await axios.put(`/api/reportes/${reporteEditando}`, reporteData);
        setMensaje("✅ Reporte actualizado con éxito!");
        setReporteEditando(null);
      } else {
        // Crear nuevo reporte
        await axios.post("/api/reportes", reporteData);
        setMensaje("✅ Registro guardado con éxito!");
      }

      // Recargar reportes desde Supabase después de guardar
      await cargarReportesDesdeSupabase();

      const hoy = new Date().toLocaleDateString('en-CA');

      setForm({
        fecha_reporte: hoy,
        tecnico: form.tecnico,
        planta: form.planta,
        equipo: "",
        reporte: "",
        tiempo_horas: "00",
        tiempo_minutos: "00",
        terminado: false,
      });
      setErrores({});
    } catch (error) {
      setMensaje(
        "❌ Error al guardar reporte. Por favor, verifica tu conexión y vuelve a intentarlo."
      );
      localStorage.setItem("formBackup", JSON.stringify(form));
      console.error(error);
    } finally {
      setGuardando(false);
    }
  };

  const calcularTiempoTotal = () => {
    return reportesDiarios.reduce((total, reporte) => total + reporte.tiempo, 0);
  };

  const formatTime = (decimalTime) => {
    const hours = Math.floor(decimalTime);
    const minutes = (decimalTime - hours) * 60;
    return `${hours}h${minutes === 0 ? "" : Math.round(minutes)}`;
  };

  // Diseño responsivo básico y accesibilidad mejorada
  const estilos = {
    contenedor: {
      maxWidth: 500,
      margin: "40px auto",
      padding: 20,
      fontFamily: "Arial, sans-serif",
      boxShadow: "0 0 20px rgba(0,0,0,0.1)",
      borderRadius: 10,
      background: "#fff",
      boxSizing: "border-box",
    },
    input: {
      width: "100%",
      padding: "10px",
      fontSize: 16,
      borderRadius: 5,
      border: "1px solid #ccc",
      marginBottom: 10,
      boxSizing: "border-box",
    },
    errorInput: {
      borderColor: "red",
      backgroundColor: "#ffe6e6",
    },
    etiqueta: {
      display: "block",
      fontWeight: "bold",
      marginTop: 10,
    },
    textoError: {
      color: "red",
      fontSize: 13,
      marginBottom: 8,
    },
    boton: {
      width: "100%",
      padding: 12,
      fontSize: 16,
      fontWeight: "bold",
      backgroundColor: "#3498db",
      color: "white",
      border: "none",
      borderRadius: 5,
      cursor: "pointer",
      marginTop: 10,
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
    },
    botonSecundario: {
      width: "100%",
      padding: 8,
      fontSize: 14,
      fontWeight: "bold",
      backgroundColor: "#6c757d",
      color: "white",
      border: "none",
      borderRadius: 5,
      cursor: "pointer",
      marginTop: 5,
    },
    mensaje: {
      textAlign: "center",
      marginTop: 20,
      fontWeight: "bold",
    },
    tiempoContainer: {
      display: "flex",
      gap: 10,
      marginBottom: 10,
    },
    tiempoSelect: {
      flex: 1,
      padding: "10px",
      fontSize: 16,
      borderRadius: 5,
      border: "1px solid #ccc",
    },
    listaReportes: {
      marginTop: 20,
      borderTop: "1px solid #ccc",
      paddingTop: 10,
    },
    reporteItem: {
      marginBottom: 15,
      padding: 12,
      backgroundColor: "#f9f9f9",
      borderRadius: 8,
      fontSize: 14,
      border: "1px solid #e0e0e0",
    },
    botonesReporte: {
      display: "flex",
      gap: 5,
      marginTop: 8,
    },
    botonPequeno: {
      padding: "4px 8px",
      fontSize: 12,
      border: "none",
      borderRadius: 3,
      cursor: "pointer",
      fontWeight: "bold",
    },
    botonEditar: {
      backgroundColor: "#ffc107",
      color: "#000",
    },
    botonEliminar: {
      backgroundColor: "#dc3545",
      color: "white",
    },
  };

  return (
    <div style={estilos.contenedor}>
      <h2>Reporte Diario de Mantenimiento</h2>
      
      {reporteEditando && (
        <div style={{ 
          padding: 10, 
          backgroundColor: "#fff3cd", 
          border: "1px solid #ffeaa7", 
          borderRadius: 5, 
          marginBottom: 15,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <span>📝 Editando reporte</span>
          <button 
            onClick={cancelarEdicion}
            style={{
              padding: "2px 8px",
              fontSize: 12,
              backgroundColor: "#6c757d",
              color: "white",
              border: "none",
              borderRadius: 3,
              cursor: "pointer"
            }}
          >
            Cancelar
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} aria-label="Formulario de reporte diario">
        <label style={estilos.etiqueta} htmlFor="fecha_reporte">
          Fecha del trabajo:
        </label>
        <input
          style={estilos.input}
          type="date"
          id="fecha_reporte"
          name="fecha_reporte"
          value={form.fecha_reporte}
          onChange={handleChange}
          aria-required="true"
        />

        <label style={estilos.etiqueta} htmlFor="tecnico">
          Técnico:
        </label>
        <select
          id="tecnico"
          name="tecnico"
          value={form.tecnico}
          onChange={handleChange}
          style={{
            ...estilos.input,
            ...(errores.tecnico ? estilos.errorInput : {}),
          }}
          aria-required="true"
          aria-invalid={errores.tecnico ? "true" : "false"}
        >
          <option value="">-- Selecciona técnico --</option>
          {tecnicos.map((nombre) => (
            <option key={nombre} value={nombre}>
              {nombre}
            </option>
          ))}
        </select>
        {errores.tecnico && (
          <div style={estilos.textoError} role="alert">
            {errores.tecnico}
          </div>
        )}

        <label style={estilos.etiqueta} htmlFor="planta">
          Planta:
        </label>
        <select
          id="planta"
          name="planta"
          value={form.planta}
          onChange={handleChange}
          style={{
            ...estilos.input,
            ...(errores.planta ? estilos.errorInput : {}),
          }}
          aria-required="true"
          aria-invalid={errores.planta ? "true" : "false"}
        >
          <option value="">-- Selecciona planta --</option>
          {plantas.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        {errores.planta && (
          <div style={estilos.textoError} role="alert">
            {errores.planta}
          </div>
        )}

        <label style={estilos.etiqueta} htmlFor="equipo">
          Orden de Trabajo:
        </label>
        <input
          style={{
            ...estilos.input,
            ...(errores.equipo ? estilos.errorInput : {}),
          }}
          type="text"
          id="equipo"
          name="equipo"
          value={form.equipo}
          onChange={handleChange}
          list="equipos-list"
          placeholder="Ingresa el nº de OT, si se hizo sin ot, pon: SIN OT"
          aria-required="true"
          aria-invalid={errores.equipo ? "true" : "false"}
        />
        <datalist id="equipos-list">
          {equiposSugeridos.map((equipo, index) => (
            <option key={index} value={equipo} />
          ))}
        </datalist>
        {errores.equipo && (
          <div style={estilos.textoError} role="alert">
            {errores.equipo}
          </div>
        )}

        <label style={estilos.etiqueta} htmlFor="reporte">
          Reporte:
        </label>
        <textarea
          style={{
            ...estilos.input,
            height: 200,
            ...(errores.reporte ? estilos.errorInput : {}),
          }}
          id="reporte"
          name="reporte"
          value={form.reporte}
          onChange={handleChange}
          maxLength={250}
          placeholder="Usa la formula: Encontré+ Hice+ Resultado+ Recomendación. Ej: Encontré filtro Y sucio en un 80% y presion 1600. Limpié el filtro. La presion llego a 2000. Por favor comprar las tuercas debido a desgaste."
          aria-required="true"
          aria-invalid={errores.reporte ? "true" : "false"}
          aria-describedby="reporteHelp"
        />
        <div id="reporteHelp" style={{ fontSize: 12, color: "#666", marginBottom: 8 }}>
          {form.reporte.length} / 250 caracteres
        </div>
        {errores.reporte && (
          <div style={estilos.textoError} role="alert">
            {errores.reporte}
          </div>
        )}

        <label style={estilos.etiqueta} htmlFor="tiempo_horas">
          Tiempo (hh:mm):
        </label>
        <div style={estilos.tiempoContainer}>
          <select
            id="tiempo_horas"
            name="tiempo_horas"
            value={form.tiempo_horas}
            onChange={handleChange}
            style={{
              ...estilos.tiempoSelect,
              ...(errores.tiempo ? estilos.errorInput : {}),
            }}
            aria-required="true"
            aria-invalid={errores.tiempo ? "true" : "false"}
          >
            {Array.from({ length: 13 }, (_, i) => (
              <option key={i} value={i.toString().padStart(2, "0")}>
                {i.toString().padStart(2, "0")}
              </option>
            ))}
          </select>
          <select
            id="tiempo_minutos"
            name="tiempo_minutos"
            value={form.tiempo_minutos}
            onChange={handleChange}
            style={{
              ...estilos.tiempoSelect,
              ...(errores.tiempo ? estilos.errorInput : {}),
            }}
            aria-required="true"
            aria-invalid={errores.tiempo ? "true" : "false"}
          >
            <option value="00">00</option>
            <option value="15">15</option>
            <option value="30">30</option>
            <option value="45">45</option>
          </select>
        </div>
        {errores.tiempo && (
          <div style={estilos.textoError} role="alert">
            {errores.tiempo}
          </div>
        )}

        <label style={{ marginTop: 10 }}>
          <input
            type="checkbox"
            name="terminado"
            checked={form.terminado}
            onChange={handleChange}
            aria-checked={form.terminado}
          />{" "}
          Trabajo terminado
        </label>

        <button
          type="submit"
          style={estilos.boton}
          disabled={guardando}
          aria-disabled={guardando}
          aria-live="polite"
        >
          {guardando ? (
            <>
              {reporteEditando ? "Actualizando..." : "Guardando..."}
              <Spinner />
            </>
          ) : (
            reporteEditando ? "Actualizar reporte" : "Guardar reporte"
          )}
        </button>

        {reporteEditando && (
          <button
            type="button"
            onClick={cancelarEdicion}
            style={estilos.botonSecundario}
          >
            Cancelar edición
          </button>
        )}
      </form>

      {mensaje && (
        <div
          style={{
            ...estilos.mensaje,
            color: mensaje.includes("éxito") || mensaje.includes("correctamente") ? "green" : 
                   mensaje.includes("Editando") ? "#856404" : "red",
          }}
          role="alert"
          aria-live="assertive"
        >
          {mensaje}
        </div>
      )}

      <div style={estilos.listaReportes}>
        <h3>Últimos Reportes {form.tecnico && `- ${form.tecnico}`}</h3>

        {!form.tecnico && (
          <p style={{ color: '#666', fontStyle: 'italic' }}>
            Selecciona un técnico para ver su historial de reportes
          </p>
        )}

        {form.tecnico && reportesDiarios.length === 0 && (
          <p>No hay reportes para {form.tecnico}.</p>
        )}

        {reportesDiarios.length > 0 && (
          <div>
            {reportesDiarios.map((reporte, index) => (
              <div key={reporte.id || index} style={estilos.reporteItem}>
                <div style={{ fontWeight: 'bold', marginBottom: 5 }}>
                  {formatearFecha(reporte.fecha_reporte)} - ({reporte.planta}) {iconoEstado(reporte.terminado)}
                </div>
                <div style={{ marginBottom: 3 }}>
                  <strong>OT:</strong> {reporte.equipo}
                </div>
                <div style={{ marginBottom: 3 }}>
                  {reporte.reporte}
                </div>
                <div style={{ fontSize: 12, color: '#666' }}>
                  Tiempo: {formatTime(reporte.tiempo)}
                </div>
                
                <div style={estilos.botonesReporte}>
                  <button
                    onClick={() => editarReporte(reporte)}
                    style={{
                      ...estilos.botonPequeno,
                      ...estilos.botonEditar,
                    }}
                  >
                    ✏️ Editar
                  </button>
                  <button
                    onClick={() => eliminarReporte(reporte.id)}
                    style={{
                      ...estilos.botonPequeno,
                      ...estilos.botonEliminar,
                    }}
                  >
                    🗑️ Eliminar
                  </button>
                </div>
              </div>
            ))}
            
            {reportesDiarios.length > 0 && (
              <div style={{ 
                marginTop: 15, 
                padding: 10, 
                backgroundColor: '#f0f8ff', 
                borderRadius: 5,
                textAlign: 'center',
                fontWeight: 'bold'
              }}>
                Total de tiempo: {formatTime(calcularTiempoTotal())} | {reportesDiarios.length} reporte{reportesDiarios.length !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;