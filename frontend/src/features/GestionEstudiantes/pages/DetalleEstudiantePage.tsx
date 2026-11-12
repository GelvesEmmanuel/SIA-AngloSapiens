import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { extraerMensajeError } from "../../../api/apiError";
import { useEstudiantes } from "../hooks/useEstudiantes";
import type {
  ActualizarContactoEstudiantePayload,
  CategoriaDocumento,
  ContactoEstudiante,
  ContactoEstudiantePayload,
  Estudiante,
  TipoContacto,
} from "../estudiantes.type";

type FormularioContacto = ContactoEstudiantePayload;

const crearFormularioContacto = (
  contacto?: ContactoEstudiante,
): FormularioContacto => ({
  tipo: contacto?.tipo ?? "ACUDIENTE_LEGAL",
  nombre: contacto?.nombre ?? "",
  apellidos: contacto?.apellidos ?? "",
  tipoDocumento: contacto?.tipoDocumento ?? "",
  numeroDocumento: contacto?.numeroDocumento ?? "",
  telefono: contacto?.telefono ?? "",
  direccion: contacto?.direccion ?? "",
  ocupacion: contacto?.ocupacion ?? "",
  parentesco: contacto?.parentesco ?? "",
});

const mostrarFecha = (fecha: string | null | undefined) => {
  if (!fecha) return "No registrada";
 
  const fechaParseada = new Date(fecha);
  return Number.isNaN(fechaParseada.getTime())
    ? fecha
    : fechaParseada.toLocaleDateString("es-CO");
};

const calcularEdad = (fechaNacimiento: string) => {
  const nacimiento = new Date(`${fechaNacimiento.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(nacimiento.getTime())) return "No disponible";

  const hoy = new Date();
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  if (
    hoy.getMonth() < nacimiento.getMonth() ||
    (hoy.getMonth() === nacimiento.getMonth() &&
      hoy.getDate() < nacimiento.getDate())
  ) {
    edad--;
  }

  return `${edad} años`;
};

const valorSiNo = (valor: boolean | null | undefined) => {
  if (valor == null) return "No especificado";
  return valor ? "Sí" : "No";
};

const tipoDocumentoLabel: Record<Estudiante["tipoDocumento"], string> = {
  CC: "Cédula de ciudadanía",
  CE: "Cédula de extranjería",
  TI: "Tarjeta de identidad",
  PAS: "Pasaporte",
};

const claseEstado = (estado: Estudiante["estado"]) => {
  if (estado === "REGISTRADO" || estado === "MATRICULADO") {
    return "badge badge-green";
  }
  if (estado === "INACTIVO") return "badge badge-red";
  return "badge badge-amber";
};

export function DetalleEstudiantePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    obtenerDetalleEstudiante,
    ejecutarCambiarEstado,
    ejecutarActualizarDatos,
    ejecutarActualizarContacto,
    isUpdating,
    ejecutarActualizarDocumentos,
  } = useEstudiantes();
  const [estudiante, setEstudiante] = useState<Estudiante | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorCargando, setErrorCargando] = useState("");
  // para cambio de estado
  const [errorAccion, setErrorAccion] = useState("");
  const [isChangingStatus, setIsChangingStatus] = useState(false);
  const [mostrarMotivo, setMostrarMotivo] = useState(false);
    const [mostrarModalInactivacion, setMostrarModalInactivacion] = useState(false);
  const [motivoInactivacion, setMotivoInactivacion] = useState("");
//pra editar los datos del estudiante
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("FT");
const [archivoNuevo, setArchivoNuevo] = useState<File | null>(null);
const [isUploadingDoc, setIsUploadingDoc] = useState(false);
const [contactoEditandoId, setContactoEditandoId] = useState<string | null>(null);
const [formularioContacto, setFormularioContacto] = useState<FormularioContacto>(
  crearFormularioContacto(),
);
const [errorContacto, setErrorContacto] = useState("");

   const [isEditing, setIsEditing] = useState(false);
   const [formData, setFormData] = useState({
  nombre: "",
  apellidos: "",
  fechaNacimiento: "",
  telefono: "",
  gradoAcademico: "",
  institucionEducativa:"",
  consentimientoUsoImagen: true,
  reportaDiscapacidad: false,
}); 


const abrirEdicion = () => {
  if (!isEditing && estudiante) {
    setFormData({
      nombre: estudiante.nombre || "",
      apellidos: estudiante.apellidos || "",
      fechaNacimiento: estudiante.fechaNacimiento || "", // asegúrate que esté en formato YYYY-MM-DD
      telefono: estudiante.telefono || "",
      gradoAcademico: estudiante.gradoAcademico || "",
      institucionEducativa: estudiante.institucionEducativa || "",
      consentimientoUsoImagen: Boolean(estudiante.consentimientoUsoImagen),
      reportaDiscapacidad: Boolean(estudiante.reportaDiscapacidad),
    });
  }
  setIsEditing(!isEditing);
};


  useEffect(() => {
    let isMounted = true;

    const cargarDetalle = async () => {
      if (!id) {
        setErrorCargando("No se proporcionó el ID del estudiante.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setErrorCargando("");

        const data = await obtenerDetalleEstudiante(id);
        if (!isMounted) return;

        if (data) {
          setEstudiante(data);
        } else {
          setEstudiante(null);
          setErrorCargando("No se pudo cargar la información del estudiante.");
        }
      } catch (error: unknown) {
        if (isMounted) {
          setErrorCargando(extraerMensajeError(error));
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    void cargarDetalle();
    return () => {
      isMounted = false;
    };
  }, [id, obtenerDetalleEstudiante]);

  const obtenerDocumento = (categoria: CategoriaDocumento) =>
    estudiante?.documentos?.find(
      (documento) =>
        documento.categoria === categoria && documento.estado === "VIGENTE",
    );

  const abrirDocumento = (categoria: CategoriaDocumento) => {
    const url = obtenerDocumento(categoria)?.url;
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-sm text-muted">
          Cargando expediente del estudiante...
        </p>
      </div>
    );
  }

  if (errorCargando || !estudiante) {
    return (
      <div className="mx-auto max-w-3xl p-6 text-center">
        <p role="alert" className="font-medium text-error">
          {errorCargando || "Estudiante no encontrado."}
        </p>
        <button
          type="button"
          onClick={() => navigate("/estudiantes")}
          className="outline-btn mt-4"
        >
          Volver a estudiantes
        </button>
      </div>
    );
  }

  const fotoPerfil = obtenerDocumento("FOTO")?.url;
  const documentoIdentidad = obtenerDocumento("CEDULA");
  const certificadoDiscapacidad = obtenerDocumento("DISCAPACIDAD");
  const firmaDigital = obtenerDocumento("FIRMA");



  // cambiar estado del estudiante 
  // Cambiar estado del docente y volver a consultar su expediente
  const handleCambiarEstado = async () => {
  if (!id || !estudiante) return;

  // Si está activo, primero solicitamos el motivo
  if (estudiante.estado === "REGISTRADO") {
    setMotivoInactivacion("");
    setMostrarModalInactivacion(true);
    return;
  }

  // Si está inactivo, podemos activarlo directamente
  try {
    setIsChangingStatus(true);
    setErrorAccion("");

    await ejecutarCambiarEstado(id, {
      nuevoEstado: "REGISTRADO",
    });

    const actualizado = await obtenerDetalleEstudiante(id);

    if (actualizado) {
      setEstudiante(actualizado);
    } else {
      setErrorAccion(
        "El estado se actualizó, pero no fue posible recargar el expediente."
      );
    }
  } catch (error: unknown) {
    console.error("Error al activar el docente:", error);
    setErrorAccion(extraerMensajeError(error));
  } finally {
    setIsChangingStatus(false);
  }
};
// Esta función toma el motivo escrito en el modal y lo envía al backend:
const confirmarInactivacion = async () => {
  if (!id || !estudiante) return;

  if (!motivoInactivacion.trim()) {
    setErrorAccion("Debes ingresar el motivo de inactivación.");
    return;
  }

  try {
    setIsChangingStatus(true);
    setErrorAccion("");

    await ejecutarCambiarEstado(id, {
      nuevoEstado: "INACTIVO",
      motivoInactivacion: motivoInactivacion.trim(),
    });

    const actualizado = await obtenerDetalleEstudiante(id);

    if (actualizado) {
      setEstudiante(actualizado);
      setMostrarModalInactivacion(false);
      setMotivoInactivacion("");
    } else {
      setErrorAccion(
        "El Estudiante fue inactivado, pero no fue posible recargar su expediente."
      );
    }
  } catch (error: unknown) {
    console.error("Error al inactivar el estudiante:", error);
    setErrorAccion(extraerMensajeError(error));
  } finally {
    setIsChangingStatus(false);
  }
};

// actualizar los datos de estudiante
//funcion actualizar datos docente
  

const handleGuardarDatos = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!id) return;

  // Filtramos las propiedades que sean strings vacíos para que el PATCH no las sobrescriba
  const payload = Object.fromEntries(
    Object.entries(formData).filter(([_, value]) => {
      if (typeof value === "string") return value.trim() !== "";
      return value !== undefined && value !== null;
    })
  );

  try {
    await ejecutarActualizarDatos(id, payload);
    setIsEditing(false);
    const actualizado = await obtenerDetalleEstudiante(id);
    if (actualizado) setEstudiante(actualizado);
  } catch (error: unknown) {
    console.error("Error al actualizar datos:", error);
    setErrorAccion(extraerMensajeError(error));
  }
};

const iniciarEdicionContacto = (contacto: ContactoEstudiante) => {
  setContactoEditandoId(contacto.id);
  setFormularioContacto(crearFormularioContacto(contacto));
  setErrorContacto("");
};

const cancelarEdicionContacto = () => {
  setContactoEditandoId(null);
  setFormularioContacto(crearFormularioContacto());
  setErrorContacto("");
};

const handleGuardarContacto = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  if (!id || !contactoEditandoId) return;

  if (
    !formularioContacto.nombre.trim() ||
    !formularioContacto.apellidos.trim() ||
    !formularioContacto.telefono.trim() ||
    !formularioContacto.parentesco.trim()
  ) {
    setErrorContacto(
      "Nombre, apellidos, teléfono y parentesco son obligatorios.",
    );
    return;
  }

  const contacto: ActualizarContactoEstudiantePayload = {
    id: contactoEditandoId,
    tipo: formularioContacto.tipo,
    nombre: formularioContacto.nombre.trim(),
    apellidos: formularioContacto.apellidos.trim(),
    telefono: formularioContacto.telefono.trim(),
    parentesco: formularioContacto.parentesco.trim(),
    tipoDocumento: formularioContacto.tipoDocumento?.trim() || null,
    numeroDocumento: formularioContacto.numeroDocumento?.trim() || null,
    direccion: formularioContacto.direccion?.trim() || null,
    ocupacion: formularioContacto.ocupacion?.trim() || null,
  };

  try {
    setErrorContacto("");
    await ejecutarActualizarContacto(id, contacto);
    const actualizado = await obtenerDetalleEstudiante(id);
    if (!actualizado) {
      setErrorContacto(
        "El contacto se actualizó, pero no fue posible recargar el expediente.",
      );
      return;
    }

    setEstudiante(actualizado);
    cancelarEdicionContacto();
  } catch (error: unknown) {
    console.error("Error al actualizar el contacto:", error);
    setErrorContacto(extraerMensajeError(error));
  }
};

// actualizar documentos del estudiante 
// funcion actualizar documentos docente


const handleActualizarDocumentoSubmit = async (e: any) => {
    e.preventDefault();
    if (!archivoNuevo || !id) {
      alert("Por favor selecciona un archivo.");
      return;
    }

    const dataFiles = new FormData();
    dataFiles.append("categoria", categoriaSeleccionada);

    // 🗺️ Mapeamos la categoría seleccionada al nombre exacto del campo que espera Multer
    let fieldName = "archivo"; // por defecto
    switch (categoriaSeleccionada) {
      case "FOTO":
        fieldName = "profilePicture";
        break;
      case "DOCUMENTODEIDENTIDAD":
        fieldName = "identityDocument";
        break;
      case "FIRMADIGITAL":
        fieldName = "firmaDigital";
        break;
      
      case "DISCAPACIDAD":
        fieldName = "disabilityCertificate"; // O el nombre que tengas configurado en el backend para estos
        break;
      default:
        fieldName = "profilePicture";
    }

    // Adjuntamos el archivo usando la llave exacta que espera el backend
    dataFiles.append(fieldName, archivoNuevo);

    try {
      setIsUploadingDoc(true);
      await ejecutarActualizarDocumentos(id, dataFiles);
      setArchivoNuevo(null);
      
      // Recargamos el expediente para ver la nueva URL firmada
      const actualizado = await obtenerDetalleEstudiante(id);
      if (actualizado) setEstudiante(actualizado);
      alert("Documento actualizado y versionado correctamente.");
    } catch (error: unknown) {
      console.error("Error al actualizar documento:", error);
      setErrorAccion(extraerMensajeError(error));
    } finally {
      setIsUploadingDoc(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-6">
      <header className="flex items-center justify-between gap-3">
        <div>
          <p className="eyebrow mb-1">Academia</p>
          <h1 className="page-title">Detalle del estudiante</h1>
        </div>
        <button
          type="button"
          onClick={() => navigate("/estudiantes")}
          className="outline-btn text-xs"
        >
          ← Volver a estudiantes
        </button>

        <button
          type="button"
          disabled={isChangingStatus}
          onClick={handleCambiarEstado}
          className={
            estudiante.estado === "REGISTRADO"
              ? "px-4 py-2 bg-red-600 text-white rounded text-xs font-semibold hover:bg-red-700 transition disabled:opacity-50"
              : "px-4 py-2 bg-green-600 text-white rounded text-xs font-semibold hover:bg-green-700 transition disabled:opacity-50"
          }
        >
          {isChangingStatus
            ? "Procesando..."
            : estudiante.estado === "REGISTRADO"
              ? "Desactivar Estudiante"
              : "Activar Estudiante"}
        </button>


       
      </header>

      <article className="card space-y-6 p-5 sm:p-8">
        <section className="flex flex-col items-center gap-5 border-b border-border pb-6 sm:flex-row sm:items-start">
          {fotoPerfil ? (
            <img
              src={fotoPerfil}
              alt={`Fotografía de ${estudiante.nombre} ${estudiante.apellidos}`}
              className="h-32 w-32 rounded-full border-4 border-navy object-cover shadow-sm"
            />
          ) : (
            <div
              aria-label="Fotografía no disponible"
              className="flex h-32 w-32 items-center justify-center rounded-full border-4 border-border bg-slate-50 text-center text-xs text-muted"
            >
              Sin fotografía
            </div>
          )}

          <div className="space-y-2 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <h2 className="text-2xl font-bold text-heading">
                {estudiante.nombre} {estudiante.apellidos}
              </h2>
              <span className={claseEstado(estudiante.estado)}>
                {estudiante.estado.replaceAll("_", " ")}
              </span>
               {estudiante.estado === "INACTIVO" && (
                  <button
                    type="button"
                    onClick={() => setMostrarMotivo(true)}
                    className="text-xs font-medium text-blue-600 hover:text-blue-800 underline"
                  >
                    Ver motivo
                  </button>
                )}
            </div>
            <p className="text-sm font-medium text-navy">
              Código: {estudiante.codigo}
            </p>
            <p className="text-sm text-muted">
              Documento: {tipoDocumentoLabel[estudiante.tipoDocumento]}{" "}
              {estudiante.numeroDocumento}
            </p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="section-title">Información del estudiante</h2>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <dt className="field-label">Nombres</dt>
              <dd className="text-sm text-body">{estudiante.nombre}</dd>
            </div>
            <div>
              <dt className="field-label">Apellidos</dt>
              <dd className="text-sm text-body">{estudiante.apellidos}</dd>
            </div>
            <div>
              <dt className="field-label">Tipo de documento</dt>
              <dd className="text-sm text-body">
                {tipoDocumentoLabel[estudiante.tipoDocumento]} (
                {estudiante.tipoDocumento})
              </dd>
            </div>
            <div>
              <dt className="field-label">Número de documento</dt>
              <dd className="text-sm text-body">{estudiante.numeroDocumento}</dd>
            </div>
            <div>
              <dt className="field-label">Fecha de nacimiento</dt>
              <dd className="text-sm text-body">
                {mostrarFecha(estudiante.fechaNacimiento)}
              </dd>
            </div>
            <div>
              <dt className="field-label">Edad</dt>
              <dd className="text-sm text-body">
                {calcularEdad(estudiante.fechaNacimiento)}
              </dd>
            </div>
            <div>
              <dt className="field-label">Teléfono</dt>
              <dd className="text-sm text-body">
                {estudiante.telefono || "No registrado"}
              </dd>
            </div>
            <div>
              <dt className="field-label">Grado académico</dt>
              <dd className="text-sm text-body">
                {estudiante.gradoAcademico || "No especificado"}
              </dd>
            </div>
            <div>
              <dt className="field-label">Institución educativa</dt>
              <dd className="text-sm text-body">
                {estudiante.institucionEducativa || "No especificada"}
              </dd>
            </div>
            <div>
              <dt className="field-label">Reporta discapacidad</dt>
              <dd className="text-sm text-body">
                {valorSiNo(estudiante.reportaDiscapacidad)}
              </dd>
            </div>
            <div>
              <dt className="field-label">Acepta términos y condiciones</dt>
              <dd className="text-sm text-body">
                {valorSiNo(estudiante.terminosyCondiciones)}
              </dd>
            </div>
            <div>
              <dt className="field-label">Autoriza uso de imagen</dt>
              <dd className="text-sm text-body">
                {valorSiNo(estudiante.consentimientoUsoImagen)}
              </dd>
            </div>
            <div>
              <dt className="field-label">ID de estudiante</dt>
              <dd className="break-all text-sm text-body">{estudiante.id}</dd>
            </div>
            <div>
              <dt className="field-label">Cuenta asociada</dt>
              <dd className="break-all text-sm text-body">
                {estudiante.usuarioId || "Sin cuenta asociada"}
              </dd>
            </div>
            {estudiante.motivoInactivacion && (
              <div className="sm:col-span-2">
                <dt className="field-label">Motivo de inactivación</dt>
                <dd className="text-sm text-body">
                  {estudiante.motivoInactivacion}
                </dd>
              </div>
            )}
          </dl>
            {/* --- SECCIÓN DE EDICIÓN DE DATOS PERSONALES --- */}
<div className="card p-6 mt-6 space-y-4">
  <div className="flex justify-between items-center border-b pb-4">
    <h3 className="text-lg font-semibold text-heading">Gestión de Información Personal</h3>
    <button
      type="button"
      onClick={abrirEdicion}
      className="outline-btn text-xs"
    >
      {isEditing ? "Cancelar Edición" : "✏️ Editar Información"}
    </button>
  </div>

  {isEditing ? (
    <form onSubmit={handleGuardarDatos} className="space-y-4 pt-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="field-label">Nombre</label>
          <input
            type="text"
            value={formData.nombre}
            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
            className="form-input"
            
          />
        </div>
        <div>
          <label className="field-label">Apellidos</label>
          <input
            type="text"
            value={formData.apellidos}
            onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
            className="form-input"
            
          />
        </div>
        <div>
          <label className="field-label">Fecha de nacimiento</label>
          <input
            type="date"
            value={formData.fechaNacimiento}
            onChange={(e) => setFormData({ ...formData, fechaNacimiento: e.target.value })}
            className="form-input"
          />
        </div>
        <div>
          <label className="field-label">Teléfono</label>
          <input
            type="text"
            value={formData.telefono}
            onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
            className="form-input"
          />
        </div>
        <div>
          <label className="field-label">Grado o formacion Academica</label>
          <input
            type="text"
            value={formData.gradoAcademico}
            onChange={(e) => setFormData({ ...formData, gradoAcademico: e.target.value })}
            className="form-input"
          />
        </div>
        <div>
          <label className="field-label">Intitucion educativa</label>
          <input
            type="text"
            value={formData.institucionEducativa}
            onChange={(e) => setFormData({ ...formData, institucionEducativa: e.target.value })}
            className="form-input"
          />
        </div>
         <div>
    <label className="field-label">
    Consentimiento informado de uso de imagen
  </label>
  <input
    type="checkbox"
    checked={!!formData.consentimientoUsoImagen}
    onChange={(e) =>
      setFormData({
        ...formData,
        consentimientoUsoImagen: e.target.checked,
      })
    }
    className="form-input"
  />
</div>
<div>
    <label className="field-label">
    Reporta alguna discapacidad
  </label>
  <input
    type="checkbox"
    checked={!!formData.reportaDiscapacidad}
    onChange={(e) =>
      setFormData({
        ...formData,
        reportaDiscapacidad: e.target.checked,
      })
    }
    className="form-input"
  />
</div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="submit"
          disabled={isUpdating}
          className="primary-btn text-xs"
        >
          {isUpdating ? "Guardando..." : "Guardar Cambios"}
        </button>
      </div>
    </form>
  ) : (
    <p className="text-sm text-muted">
      Haz clic en editar si necesitas modificar los datos de contacto o formación académica del docente.
    </p>
  )}
</div>

          <div className="flex flex-wrap gap-2 border-t border-border pt-4">
          <h2 className="section-title">Documentos adjuntos del estudiante</h2>
            <button
              type="button"
              onClick={() => abrirDocumento("CEDULA")}
              disabled={!documentoIdentidad?.url}
              className="outline-btn text-xs disabled:cursor-not-allowed disabled:opacity-50"
            >
             📄 Ver documento de identidad
            </button>
            {estudiante.reportaDiscapacidad && (
              <button
                type="button"
                onClick={() => abrirDocumento("DISCAPACIDAD")}
                disabled={!certificadoDiscapacidad?.url}
                className="outline-btn text-xs disabled:cursor-not-allowed disabled:opacity-50"
              >
                Ver certificado de discapacidad
              </button>
            )}
          </div>

          {/* --- SECCIÓN DE ACTUALIZACIÓN DE DOCUMENTOS (VERSIONADO) --- */}
<div className="card p-6 mt-6 space-y-4">
  <h3 className="text-lg font-semibold text-heading border-b pb-4">
    Actualizar Soporte o Documento
  </h3>
  <p className="text-xs text-muted">
    Subir un nuevo documento para una categoría existente archivará automáticamente la versión anterior (HISTORICO) y dejará esta como VIGENTE.
  </p>

  <form onSubmit={handleActualizarDocumentoSubmit} className="space-y-4 pt-2">
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label className="field-label">Categoría de Documento</label>
        <select
          value={categoriaSeleccionada}
          onChange={(e) => setCategoriaSeleccionada(e.target.value)}
          className="form-input"
        >
          <option value="FOTO">Foto de Perfil</option>
          <option value="DOCUMENTODEIDENTIDAD">Cédula / Documento de Identidad</option>
          <option value="FIRMADIGITAL">Firma digital en png</option>
          <option value="DISCAPACIDAD">Certificado de Discapacidad</option>
        </select>
      </div>

      <div>
        <label className="field-label">Seleccionar Archivo Nuevo (PDF o Imagen)</label>
        <input
          type="file"
          onChange={(e) => setArchivoNuevo(e.target.files?.[0] || null)}
          className="form-input text-xs py-2"
          required
        />
      </div>
    </div>

    <div className="flex justify-end pt-2">
      <button
        type="submit"
        disabled={isUploadingDoc}
        className="primary-btn text-xs"
      >
        {isUploadingDoc ? "Subiendo y Versionando..." : "📤 Actualizar Documento"}
      </button>
    </div>
  </form>
</div>
        </section>

        <section className="space-y-4 border-t border-border pt-5">
          <div>
            <h2 className="section-title">Contactos y acudientes</h2>
            <p className="mt-1 text-sm text-muted">
              {estudiante.contactos.length
                ? `${estudiante.contactos.length} contacto(s) registrado(s).`
                : "No hay contactos registrados."}
            </p>
          </div>
          {errorContacto && (
            <p className="text-sm text-red-600" role="alert">
                {errorContacto}
            </p>
          )}

          {estudiante.contactos.map((contacto, index) => (
            <article
              key={contacto.id}
              className="space-y-4 rounded-lg border border-border p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-semibold text-heading">
                  Contacto {index + 1}: {contacto.nombre} {contacto.apellidos}
                </h3>
                <span className="badge badge-amber">
                  {contacto.tipo.replaceAll("_", " ")}
                </span>
                {contactoEditandoId !== contacto.id && (
                  <button
                    type="button"
                    onClick={() => iniciarEdicionContacto(contacto)}
                    disabled={isUpdating}
                    className="outline-btn text-xs disabled:opacity-50"
                  >
                    Editar contacto
                  </button>
                )}
              </div>
              {contactoEditandoId === contacto.id ? (
                <form onSubmit={handleGuardarContacto} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div>
                      <label className="field-label" htmlFor={`tipo-${contacto.id}`}>
                        Tipo de contacto
                      </label>
                      <select
                        id={`tipo-${contacto.id}`}
                        value={formularioContacto.tipo}
                        onChange={(e) =>
                          setFormularioContacto({
                            ...formularioContacto,
                            tipo: e.target.value as TipoContacto,
                          })
                        }
                        className="form-input"
                        required
                      >
                        <option value="ACUDIENTE_LEGAL">Acudiente legal</option>
                        <option value="EMERGENCIA">Emergencia</option>
                      </select>
                    </div>
                    {(
                      [
                        ["nombre", "Nombres", true],
                        ["apellidos", "Apellidos", true],
                        ["parentesco", "Parentesco", true],
                        ["tipoDocumento", "Tipo de documento", false],
                        ["numeroDocumento", "Número de documento", false],
                        ["telefono", "Teléfono", true],
                        ["direccion", "Dirección", false],
                        ["ocupacion", "Ocupación", false],
                      ] as const
                    ).map(([campo, etiqueta, requerido]) => (
                      <div key={campo}>
                        <label
                          className="field-label"
                          htmlFor={`${campo}-${contacto.id}`}
                        >
                          {etiqueta}
                        </label>
                        <input
                          id={`${campo}-${contacto.id}`}
                          type="text"
                          value={formularioContacto[campo] ?? ""}
                          onChange={(e) =>
                            setFormularioContacto({
                              ...formularioContacto,
                              [campo]: e.target.value,
                            })
                          }
                          className="form-input"
                          required={requerido}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={cancelarEdicionContacto}
                      disabled={isUpdating}
                      className="outline-btn text-xs disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isUpdating}
                      className="primary-btn text-xs disabled:opacity-50"
                    >
                      {isUpdating ? "Guardando..." : "Guardar contacto"}
                    </button>
                  </div>
                </form>
              ) : (
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <dt className="field-label">Parentesco</dt>
                  <dd className="text-sm text-body">
                    {contacto.parentesco || "No especificado"}
                  </dd>
                </div>
                <div>
                  <dt className="field-label">Tipo de documento</dt>
                  <dd className="text-sm text-body">
                    {contacto.tipoDocumento || "No especificado"}
                  </dd>
                </div>
                <div>
                  <dt className="field-label">Número de documento</dt>
                  <dd className="text-sm text-body">
                    {contacto.numeroDocumento || "No registrado"}
                  </dd>
                </div>
                <div>
                  <dt className="field-label">Teléfono</dt>
                  <dd className="text-sm text-body">
                    {contacto.telefono || "No registrado"}
                  </dd>
                </div>
                <div>
                  <dt className="field-label">Dirección</dt>
                  <dd className="text-sm text-body">
                    {contacto.direccion || "No registrada"}
                  </dd>
                </div>
                <div>
                  <dt className="field-label">Ocupación</dt>
                  <dd className="text-sm text-body">
                    {contacto.ocupacion || "No especificada"}
                  </dd>
                </div>
              </dl>
              )}
            </article>
          ))}
        </section>

        <section className="grid grid-cols-1 gap-4 border-t border-border pt-5 sm:grid-cols-2">
          <div>
            <p className="field-label">Fecha de registro</p>
            <p className="text-sm text-body">{mostrarFecha(estudiante.createdAt)}</p>
          </div>
          <div>
            <p className="field-label">Última actualización</p>
            <p className="text-sm text-body">{mostrarFecha(estudiante.updatedAt)}</p>
          </div>
          {estudiante.deletedAt && (
            <div>
              <p className="field-label">Fecha de eliminación</p>
              <p className="text-sm text-body">
                {mostrarFecha(estudiante.deletedAt)}
              </p>
            </div>
          )}
        </section>

        <section className="space-y-4 border-t border-border pt-5">
          <h2 className="section-title">Firma digital</h2>
          {firmaDigital?.url ? (
            <button
              type="button"
              onClick={() => abrirDocumento("FIRMA")}
              className="block rounded-lg border border-border bg-white p-3"
              aria-label="Abrir firma digital del estudiante"
            >
              <img
                src={firmaDigital.url}
                alt={`Firma digital de ${estudiante.nombre} ${estudiante.apellidos}`}
                className="max-h-48 max-w-full object-contain"
              />
              <span className="mt-2 block text-left text-xs text-muted">
                Abrir firma en una pestaña nueva
              </span>
            </button>
          ) : (
            <p className="text-sm text-muted">
              No hay una firma digital vigente para este estudiante.
            </p>
          )}
        </section>
      </article>

          {mostrarMotivo && (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    onClick={() => setMostrarMotivo(false)}
  >
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-motivo"
      className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="mb-4 flex items-center justify-between">
        <h2
          id="titulo-motivo"
          className="text-lg font-bold text-gray-800"
        >
          Motivo de inactivación
        </h2>

        <button
          type="button"
          onClick={() => setMostrarMotivo(false)}
          className="text-gray-500 hover:text-gray-800 text-xl"
          aria-label="Cerrar ventana"
        >
          ×
        </button>
      </div>

      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-sm text-gray-700">
          {estudiante.motivoInactivacion ||
            "No se ha registrado un motivo de inactivación."}
        </p>
      </div>

      <div className="mt-5 flex justify-end">
        <button
          type="button"
          onClick={() => setMostrarMotivo(false)}
          className="rounded-md bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
        >
          Cerrar
        </button>
      </div>
    </div>
  </div>
)}

{mostrarModalInactivacion && (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    onClick={() => {
      if (!isChangingStatus) {
        setMostrarModalInactivacion(false);
        setErrorAccion("");
      }
    }}
  >
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-inactivacion"
      className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
      onClick={(e) => e.stopPropagation()}
    >
      <h2
        id="titulo-inactivacion"
        className="mb-2 text-lg font-bold text-gray-800"
      >
        Desactivar docente
      </h2>

      <p className="mb-4 text-sm text-gray-600">
        Estás a punto de desactivar a{" "}
        <strong>
          {estudiante.nombre} {estudiante.apellidos}
        </strong>
        . Indica el motivo de esta decisión.
      </p>

      <label
        htmlFor="motivoInactivacion"
        className="mb-2 block text-sm font-medium text-gray-700"
      >
        Motivo de inactivación *
      </label>

      <textarea
        id="motivoInactivacion"
        value={motivoInactivacion}
        onChange={(e) => setMotivoInactivacion(e.target.value)}
        placeholder="Escribe el motivo de inactivación..."
        rows={4}
        maxLength={500}
        disabled={isChangingStatus}
        className="w-full resize-none rounded-md border border-gray-300 p-3 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
      />

      <p className="mt-1 text-right text-xs text-gray-400">
        {motivoInactivacion.length}/500 caracteres
      </p>

      {errorAccion && (
        <p className="mt-2 text-sm text-red-600" role="alert">
          {errorAccion}
        </p>
      )}

      <div className="mt-5 flex justify-end gap-3">
        <button
          type="button"
          disabled={isChangingStatus}
          onClick={() => {
            setMostrarModalInactivacion(false);
            setMotivoInactivacion("");
            setErrorAccion("");
          }}
          className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
        >
          Cancelar
        </button>

        <button
          type="button"
          disabled={isChangingStatus || !motivoInactivacion.trim()}
          onClick={confirmarInactivacion}
          className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isChangingStatus ? "Procesando..." : "Confirmar inactivación"}
        </button>
      </div>
    </div>
  </div>
)}


    </div>
  );
}
