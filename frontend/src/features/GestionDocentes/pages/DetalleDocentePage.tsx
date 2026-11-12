import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { useDocentes } from "../hooks/useDocents";
import type { Docente, CategoriaDocumento } from "../docente.types";
import { extraerMensajeError } from "../../../api/apiError";

export function DetalleDocentePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { obtenerDetalleDocente, ejecutarCambiarEstado ,ejecutarActualizarDatos,ejecutarActualizarDocumentos, isUpdating} = useDocentes();

  // Estados de la página
  const [docente, setDocente] = useState<Docente | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorCargando, setErrorCargando] = useState("");
  const [errorAccion, setErrorAccion] = useState("");
  const [isChangingStatus, setIsChangingStatus] = useState(false);
  const [mostrarMotivo, setMostrarMotivo] = useState(false);
  const [mostrarModalInactivacion, setMostrarModalInactivacion] =
  useState(false);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("CV");
const [archivoNuevo, setArchivoNuevo] = useState<File | null>(null);
const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  // estados para actualizar datos y documentos
  const [isEditing, setIsEditing] = useState(false);
const [formData, setFormData] = useState({
  nombre: "",
  apellidos: "",
  telefono: "",
  formacionAcademica: "",
  experienciaLaboral: "",
  reportaDiscapacidad: false,
  fechaVinculacion: "",
}); 

const abrirEdicion = () => {
  if (!isEditing && docente) {
    setFormData({
      nombre: docente.nombre || "",
      apellidos: docente.apellidos || "", // asegúrate que esté en formato YYYY-MM-DD
      telefono: docente.telefono || "",
      formacionAcademica: docente.formacionAcademica || "",
      experienciaLaboral: docente.experienciaLaboral || "",
      fechaVinculacion: docente.fechaVinculacion || "",
      reportaDiscapacidad: Boolean(docente.reportaDiscapacidad),
    });
  }
  setIsEditing(!isEditing);
};


const [motivoInactivacion, setMotivoInactivacion] = useState("");
  // Cargar expediente del docente
  useEffect(() => {
    let isMounted = true;

    const cargarDetalle = async () => {
      if (!id) {
        setErrorCargando("No se proporcionó el ID del docente.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setErrorCargando("");

        const data = await obtenerDetalleDocente(id);

        if (!isMounted) return;

        if (data) {
          setDocente(data);
        } else {
          setDocente(null);
          setErrorCargando("No se pudo cargar la información del docente.");
        }
      } catch (error: unknown) {
        console.error("Error al cargar el expediente:", error);

        if (isMounted) {
          setErrorCargando(extraerMensajeError(error));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    cargarDetalle();

    return () => {
      isMounted = false;
    };
  }, [id, obtenerDetalleDocente]);

  // Cambiar estado del docente y volver a consultar su expediente
  const handleCambiarEstado = async () => {
  if (!id || !docente) return;

  // Si está activo, primero solicitamos el motivo
  if (docente.estado === "ACTIVO") {
    setMotivoInactivacion("");
    setMostrarModalInactivacion(true);
    return;
  }

  // Si está inactivo, podemos activarlo directamente
  try {
    setIsChangingStatus(true);
    setErrorAccion("");

    await ejecutarCambiarEstado(id, {
      nuevoEstado: "ACTIVO",
    });

    const actualizado = await obtenerDetalleDocente(id);

    if (actualizado) {
      setDocente(actualizado);
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
  if (!id || !docente) return;

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

    const actualizado = await obtenerDetalleDocente(id);

    if (actualizado) {
      setDocente(actualizado);
      setMostrarModalInactivacion(false);
      setMotivoInactivacion("");
    } else {
      setErrorAccion(
        "El docente fue inactivado, pero no fue posible recargar su expediente."
      );
    }
  } catch (error: unknown) {
    console.error("Error al inactivar el docente:", error);
    setErrorAccion(extraerMensajeError(error));
  } finally {
    setIsChangingStatus(false);
  }
};
  // Buscar un documento vigente por categoría
  const obtenerDocumento = (categoria: CategoriaDocumento) => {
    return docente?.documentos.find(
      (documento) =>
        documento.categoria === categoria && documento.estado === "VIGENTE",
    );
  };

  // Abrir documento en una pestaña nueva
  const abrirDocumentoPorCategoria = (categoria: CategoriaDocumento) => {
    const documento = obtenerDocumento(categoria);

    if (!documento?.url) {
      alert("Este documento no ha sido cargado o no está disponible.");
      return;
    }

    window.open(documento.url, "_blank", "noopener,noreferrer");
  };

  // Buscar fotografía de perfil
  const fotoPerfilUrl = obtenerDocumento("FOTO")?.url;

  // Estado de carga
  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <p className="text-sm text-muted">Cargando expediente del docente...</p>
      </div>
    );
  }

  // Error o docente no encontrado
  if (errorCargando || !docente) {
    return (
      <div className="mx-auto max-w-3xl p-6 text-center">
        <p className="text-error font-medium">
          {errorCargando || "Docente no encontrado."}
        </p>

        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mt-4 outline-btn"
        >
          Volver al listado
        </button>
      </div>
    );
  }

  //funcion actualizar datos docente
  

const handleGuardarDatos = async (e: any) => {
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
    // Recargamos el docente para ver los cambios reflejados
    const actualizado = await obtenerDetalleDocente(id);
    if (actualizado) setDocente(actualizado);
  } catch (error: unknown) {
    console.error("Error al actualizar datos:", error);
    setErrorAccion(extraerMensajeError(error));
  }
};
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
      case "CEDULA":
        fieldName = "identityDocument";
        break;
      case "CV":
        fieldName = "cv";
        break;
      case "CERTIFICACION":
      case "DISCAPACIDAD":
        fieldName = "disabilityCertificate"; // O el nombre que tengas configurado en el backend para estos
        break;
      default:
        fieldName = "cv";
    }

    // Adjuntamos el archivo usando la llave exacta que espera el backend
    dataFiles.append(fieldName, archivoNuevo);

    try {
      setIsUploadingDoc(true);
      await ejecutarActualizarDocumentos(id, dataFiles);
      setArchivoNuevo(null);
      
      // Recargamos el expediente para ver la nueva URL firmada
      const actualizado = await obtenerDetalleDocente(id);
      if (actualizado) setDocente(actualizado);
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
      {/* Cabecera y acciones */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => navigate("/docentes")}
          className="outline-btn text-xs"
        >
          ← Volver a Docentes
        </button>

        <button
          type="button"
          disabled={isChangingStatus}
          onClick={handleCambiarEstado}
          className={
            docente.estado === "ACTIVO"
              ? "px-4 py-2 bg-red-600 text-white rounded text-xs font-semibold hover:bg-red-700 transition disabled:opacity-50"
              : "px-4 py-2 bg-green-600 text-white rounded text-xs font-semibold hover:bg-green-700 transition disabled:opacity-50"
          }
        >
          {isChangingStatus
            ? "Procesando..."
            : docente.estado === "ACTIVO"
              ? "Desactivar Docente"
              : "Activar Docente"}
        </button>
      </div>

      {/* Mensaje de error de acciones */}
      {errorAccion && (
        <div
          role="alert"
          className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700"
        >
          {errorAccion}
        </div>
      )}

      {/* Expediente / Hoja de vida */}
      <div className="card p-6 sm:p-8 space-y-6">
        {/* Foto y datos principales */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 border-b border-border pb-6">
          <img
            src={fotoPerfilUrl || "https://via.placeholder.com/150"}
            alt={`Foto de ${docente.nombre} ${docente.apellidos}`}
            className="w-32 h-32 rounded-full object-cover border-4 border-navy shadow-sm"
          />

          <div className="space-y-1 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h1 className="text-2xl font-bold text-heading">
                {docente.nombre} {docente.apellidos}
              </h1>

              <div className="flex items-center gap-2">
                <span
                  className={
                    docente.estado === "ACTIVO"
                      ? "badge badge-green"
                      : "badge badge-red"
                  }
                >
                  {docente.estado}
                </span>

                {docente.estado === "INACTIVO" && (
                  <button
                    type="button"
                    onClick={() => setMostrarMotivo(true)}
                    className="text-xs font-medium text-blue-600 hover:text-blue-800 underline"
                  >
                    Ver motivo
                  </button>
                )}
              </div>
            </div>

            <p className="text-sm font-medium text-navy">
              Código: {docente.codigo}
            </p>

            <p className="text-sm text-muted">
              Teléfono: {docente.telefono || "No registrado"}
            </p>
          </div>
        </div>

        {/* Información detallada */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Identificación */}
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-heading border-b pb-2">
              Datos de Identificación
            </h3>

            <div>
              <p className="text-xs text-muted font-medium">
                Tipo de Documento
              </p>
              <p className="text-sm text-body">{docente.tipoDocumento}</p>
            </div>

            <div>
              <p className="text-xs text-muted font-medium">
                Número de Documento
              </p>
              <p className="text-sm text-body">{docente.numeroDocumento}</p>
            </div>

            <div>
              <p className="text-xs text-muted font-medium">
                Formación Académica
              </p>
              <p className="text-sm text-body">
                {docente.formacionAcademica || "No especificada"}
              </p>
            </div>
             <div>
              <p className="text-xs text-muted font-medium">
                Expericia Laboral
              </p>
              <p className="text-sm text-body">
                {docente.experienciaLaboral || "No especificada"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted font-medium">
                Fecha de vinculación del docente
              </p>
              <p className="text-sm text-body">
                {docente.fechaVinculacion || "No especificada"}
              </p>
            </div>
          </div>

          {/* Información adicional y documentos */}
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-heading border-b pb-2">
              Información Adicional y Soportes
            </h3>

            <div>
              <p className="text-xs text-muted font-medium">
                Reporta Discapacidad
              </p>

              <p className="text-sm text-body">
                {docente.reportaDiscapacidad ? "Sí" : "No"}
              </p>
            </div>

            {/* Documentos adjuntos */}
            <div className="pt-2">
              <p className="text-xs text-muted font-medium mb-3">
                Documentos Vigentes Adjuntos:
              </p>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => abrirDocumentoPorCategoria("CEDULA")}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 transition"
                >
                  📄 Ver Cédula
                </button>

                <button
                  type="button"
                  onClick={() => abrirDocumentoPorCategoria("CV")}
                  className="px-3 py-1.5 bg-emerald-600 text-white rounded text-xs font-medium hover:bg-emerald-700 transition"
                >
                  📋 Ver Hoja de Vida (CV)
                </button>

                <button
                  type="button"
                  onClick={() => abrirDocumentoPorCategoria("CERTIFICACION")}
                  className="px-3 py-1.5 bg-indigo-600 text-white rounded text-xs font-medium hover:bg-indigo-700 transition"
                >
                  📜 Ver Certificación
                </button>

                {docente.reportaDiscapacidad && (
                  <button
                    type="button"
                    onClick={() => abrirDocumentoPorCategoria("DISCAPACIDAD")}
                    className="px-3 py-1.5 bg-purple-600 text-white rounded text-xs font-medium hover:bg-purple-700 transition"
                  >
                    🏥 Ver Cert. Discapacidad
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Información de registro */}
        <div className="border-t border-border pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted font-medium">Fecha de registro</p>
            <p className="text-sm text-body">
              {new Date(docente.createdAt).toLocaleDateString("es-CO")}
            </p>
          </div>

          <div>
            <p className="text-xs text-muted font-medium">
              Última actualización
            </p>
            <p className="text-sm text-body">
              {new Date(docente.updatedAt).toLocaleDateString("es-CO")}
            </p>
          </div>
        </div>
      </div>
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
          <label className="field-label">Teléfono</label>
          <input
            type="text"
            value={formData.telefono}
            onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
            className="form-input"
          />
        </div>
        <div>
          <label className="field-label">Formación Académica</label>
          <input
            type="text"
            value={formData.formacionAcademica}
            onChange={(e) => setFormData({ ...formData, formacionAcademica: e.target.value })}
            className="form-input"
          />
        </div>
        <div>
          <label className="field-label">Experiencia Laboral</label>
          <input
            type="text"
            value={formData.experienciaLaboral}
            onChange={(e) => setFormData({ ...formData, experienciaLaboral: e.target.value })}
            className="form-input"
          />
        </div>
         <div>
          <label className="field-label">Fecha de vinculación</label>
          <input
            type="text"
            value={formData.fechaVinculacion}
            onChange={(e) => setFormData({ ...formData, fechaVinculacion: e.target.value })}
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
          <option value="CEDULA">Cédula / Documento de Identidad</option>
          <option value="CV">Hoja de Vida (CV)</option>
          <option value="CERTIFICACION">Certificación</option>
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
          {docente.motivoInactivacion ||
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
          {docente.nombre} {docente.apellidos}
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

export default DetalleDocentePage;
