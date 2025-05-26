import React, { useState, useEffect } from "react";
import axios from "axios";
import CreatableSelect from "react-select/creatable";

function App() {
  const tecnicos = [
    "Carlos Cisneros",
    "Juan Carrión",
    "César Sánchez",
    "Miguel Lozada",
    "Roberto Córdova",
    "Alex Haro",
    "Dario Ojeda",
    "Israel Pérez",
    "José Urquizo",
    "Kevin Vargas",
    "Edisson Bejarano",
    "Leonardo Ballesteros",
    "Marlon Ortiz",
  ];

  const plantas = ["CMA", "CMS", "PT", "CP", "MC"];

  // Estado para equipos sugeridos (autocompletado)
  const [equiposSugeridos, setEquiposSugeridos] = useState([]);

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

  const [equipoSeleccionado, setEquipoSeleccionado] = useState(null);
  const [errores, setErrores] = useState({});
  const [mensaje, setMensaje] = useState("");
  const [reportesDiarios, setReportesDiarios] = useState([]);
  const [guardando, setGuardando] = useState(false);
  const [fechasExpandidas, setFechasExpandidas] = useState({});

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
    const hoy = new Date().toLocaleDateString('en-CA'); // Fecha local corregida
    const tecnicoGuardado = localStorage.getItem("tecnico") || "";
    const plantaGuardada = localStorage.getItem("planta") || "";
    const reportesGuardados =
      JSON.parse(localStorage.getItem("reportesDiarios")) || [];
    const equiposGuardados =
      JSON.parse(localStorage.getItem("equiposSugeridos")) || [];

    setForm((prev) => ({
      ...prev,
      fecha_reporte: hoy,
      tecnico: tecnicoGuardado,
      planta: plantaGuardada,
    }));
    setReportesDiarios(reportesGuardados);
    setEquiposSugeridos(equiposGuardados);

    // Si hay equipo guardado, seleccionarlo en react-select
    if (equiposGuardados.length > 0) {
      setEquipoSeleccionado(null);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("reportesDiarios", JSON.stringify(reportesDiarios));
  }, [reportesDiarios]);

  useEffect(() => {
    localStorage.setItem("equiposSugeridos", JSON.stringify(equiposSugeridos));
  }, [equiposSugeridos]);

  // Funciones auxiliares para agrupación por fecha
  const agruparReportesPorFecha = (reportes) => {
    return reportes.reduce((grupos, reporte) => {
      const fecha = reporte.fecha_reporte;
      if (!grupos[fecha]) {
        grupos[fecha] = [];
      }
      grupos[fecha].push(reporte);
      return grupos;
    }, {});
  };

  const toggleFecha = (fecha) => {
    setFechasExpandidas(prev => ({
      ...prev,
      [fecha]: !prev[fecha]
    }));
  };

  const formatearFecha = (fecha) => {
    const opciones = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return new Date(fecha + 'T00:00:00').toLocaleDateString('es-ES', opciones);
  };

  const calcularTiempoDia = (reportes) => {
    return reportes.reduce((total, reporte) => total + reporte.tiempo, 0);
  };

  const validar = () => {
    const nuevosErrores = {};

    if (!form.tecnico) nuevosErrores.tecnico = "Selecciona un técnico.";
    if (!form.planta) nuevosErrores.planta = "Selecciona una planta.";
    if (!form.equipo || form.equipo.trim().length < 3)
      nuevosErrores.equipo = "El equipo debe tener al menos 3 caracteres.";
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
      return; // No actualizar si excede 250 caracteres
    }

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleEquipoChange = (newValue, actionMeta) => {
    setEquipoSeleccionado(newValue);
    setForm((prev) => ({
      ...prev,
      equipo: newValue ? newValue.value : "",
    }));

    // Si es creación de nueva opción, agregarla a equiposSugeridos
    if (actionMeta.action === "create-option" && newValue) {
      if (!equiposSugeridos.includes(newValue.value)) {
        const nuevosEquipos = [...equiposSugeridos, newValue.value];
        setEquiposSugeridos(nuevosEquipos);
        localStorage.setItem("equiposSugeridos", JSON.stringify(nuevosEquipos));
      }
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
      setGuardando(true); // Deshabilitar botón para evitar duplicados
      localStorage.setItem("tecnico", form.tecnico);
      localStorage.setItem("planta", form.planta);

      // Guardar equipo en sugeridos si no está ya (por seguridad, aunque ya se agrega en creación)
      if (
        form.equipo.trim() &&
        !equiposSugeridos.includes(form.equipo.trim())
      ) {
        const nuevosEquipos = [...equiposSugeridos, form.equipo.trim()];
        setEquiposSugeridos(nuevosEquipos);
        localStorage.setItem("equiposSugeridos", JSON.stringify(nuevosEquipos));
      }

      const nuevoReporte = {
        ...form,
        tiempo: tiempoDecimal(
          Number(form.tiempo_horas),
          Number(form.tiempo_minutos)
        ),
      };

      await axios.post("/api/reportes", nuevoReporte);

      setReportesDiarios((prevReportes) => [...prevReportes, nuevoReporte]);

      setMensaje("✅ Registro guardado con éxito!");
      const hoy = new Date().toLocaleDateString('en-CA'); // Fecha local corregida

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
      setEquipoSeleccionado(null);
      setErrores({});
    } catch (error) {
      setMensaje(
        "❌ Error al guardar registro. Por favor, verifica tu conexión y vuelve a intentarlo."
      );
      // Guardar datos en localStorage para persistencia
      localStorage.setItem("formBackup", JSON.stringify(form));
      console.error(error);
    } finally {
      setGuardando(false); // Habilitar botón nuevamente
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
      marginBottom: 5,
      padding: 8,
      backgroundColor: "#f9f9f9",
      borderRadius: 4,
      fontSize: 14,
    },
    grupoFecha: {
      marginBottom: 15,
      border: "1px solid #e0e0e0",
      borderRadius: 8,
      overflow: "hidden",
    },
    headerFecha: {
      padding: 15,
      backgroundColor: "#f8f9fa",
      cursor: "pointer",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      borderBottom: "1px solid #e0e0e0",
      transition: "background-color 0.2s ease",
    },
    reportesDia: {
      padding: 10,
      backgroundColor: "#fff",
    },
    separadorFecha: {
      fontSize: 12,
      color: "#666",
      marginTop: 4,
      fontWeight: "normal",
    },
  };

  const equiposSugeridosOptions = equiposSugeridos.map((equipo) => ({
    value: equipo,
    label: equipo,
  }));

  return (
    <div style={estilos.contenedor}>
      <h2>Reporte Diario de Mantenimiento</h2>
      <form onSubmit={handleSubmit} aria-label="Formulario de reporte diario">
        <label style={estilos.etiqueta} htmlFor="fecha_reporte">
          Fecha del reporte:
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
          Equipo:
        </label>
        <CreatableSelect
          inputId="equipo"
          value={equipoSeleccionado}
          onChange={handleEquipoChange}
          options={equiposSugeridosOptions}
          isClearable
          placeholder="Selecciona o crea un equipo..."
          styles={{
            control: (base, state) => ({
              ...base,
              border: errores.equipo ? "1px solid red" : "1px solid #ccc",
              backgroundColor: errores.equipo ? "#ffe6e6" : "white",
            }),
          }}
          aria-required="true"
          aria-invalid={errores.equipo ? "true" : "false"}
        />
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
            height: 100,
            ...(errores.reporte ? estilos.errorInput : {}),
          }}
          id="reporte"
          name="reporte"
          value={form.reporte}
          onChange={handleChange}
          maxLength={250}
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
              Guardando...
              <Spinner />
            </>
          ) : (
            "Guardar registro"
          )}
        </button>
      </form>

      {mensaje && (
        <div
          style={{
            ...estilos.mensaje,
            color: mensaje.includes("éxito") ? "green" : "red",
          }}
          role="alert"
          aria-live="assertive"
        >
          {mensaje}
        </div>
      )}

      <div style={estilos.listaReportes}>
        <h3>Historial de Reportes</h3>
        <p>
          <strong>Tiempo total trabajado: </strong>
          {formatTime(calcularTiempoTotal())}
        </p>

        {reportesDiarios.length === 0 && <p>No hay reportes aún.</p>}

        {Object.entries(agruparReportesPorFecha(reportesDiarios))
          .sort(([a], [b]) => new Date(b) - new Date(a))
          .map(([fecha, reportes]) => (
            <div key={fecha} style={estilos.grupoFecha}>
              <div 
                style={estilos.headerFecha}
                onClick={() => toggleFecha(fecha)}
              >
                <div>
                  <strong>{formatearFecha(fecha)}</strong>
                  <div style={estilos.separadorFecha}>
                    {reportes.length} trabajo{reportes.length !== 1 ? 's' : ''} - {formatTime(calcularTiempoDia(reportes))}
                  </div>
                </div>
                <span style={{ fontSize: 18 }}>
                  {fechasExpandidas[fecha] ? '▼' : '▶'}
                </span>
              </div>

              {fechasExpandidas[fecha] && (
                <div style={estilos.reportesDia}>
                  {reportes.map((reporte, index) => (
                    <div key={index} style={estilos.reporteItem}>
                      ({reporte.planta}) {reporte.reporte} {iconoEstado(reporte.terminado)} - {formatTime(reporte.tiempo)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
      </div>
    </div>
  );
}

export default App;