
import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useDocentes } from "../hooks/useDocents";
import {
  actualizarDocumentosDocente,
  buscarUsuarioDisponibleParaDocencia,
  vincularDocenteAUsuarioExistente,
} from "../gestionDocente.service";
import { extraerMensajeError } from "../../../api/apiError";
import type {
  Docente,
  UsuarioDisponibleDocencia,
  VincularDocentePayload,
} from "../docente.types";

type ArchivosDocente = {
  profilePicture: File | null;
  identityDocument: File | null;
  cv: File | null;
  disabilityCertificate: File | null;
};

const archivosVacios: ArchivosDocente = {
  profilePicture: null,
  identityDocument: null,
  cv: null,
  disabilityCertificate: null,
};

const datosDocenteVacio: VincularDocentePayload = {
  tipoDocumento: "CC",
  fechaNacimiento: "",
  telefono: "",
  correo: "",
  formacionAcademica: "",
  experienciaLaboral: "",
  reportaDiscapacidad: false,
};

export function GestionDocentePage() {
  const navigate = useNavigate();
  const [mostrarVinculacion, setMostrarVinculacion] = useState(false);
  const [documentoBusqueda, setDocumentoBusqueda] = useState("");
  const [usuarioEncontrado, setUsuarioEncontrado] =
    useState<UsuarioDisponibleDocencia | null>(null);
  const [buscandoUsuario, setBuscandoUsuario] = useState(false);
  const [vinculandoDocente, setVinculandoDocente] = useState(false);
  const [errorVinculacion, setErrorVinculacion] = useState("");
  const [mensajeVinculacion, setMensajeVinculacion] = useState("");
  const [docenteVinculado, setDocenteVinculado] = useState<Docente | null>(null);
  const [datosDocente, setDatosDocente] =
    useState<VincularDocentePayload>(datosDocenteVacio);
  const [archivosDocente, setArchivosDocente] =
    useState<ArchivosDocente>(archivosVacios);

  const {
    docentes,
    busqueda,
    setBusqueda,
    estado,
    setEstado,
    isLoading,
    error,
    recargarDocentes,
    mensajeExito,
    errorAccion,
    //limpiarMensajes,
  } = useDocentes();

  // Indicadores
  const listaDocentes = Array.isArray(docentes) ? docentes : [];
  const totalDocentes = listaDocentes.length;
  const activos = listaDocentes.filter(
    (d) => d.estado === "ACTIVO"
  ).length;
  const inactivos = listaDocentes.filter(
    (d) => d.estado === "INACTIVO"
  ).length;

  const buscarCoordinador = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorVinculacion("");
    setMensajeVinculacion("");
    setUsuarioEncontrado(null);
    setBuscandoUsuario(true);

    try {
      const response = await buscarUsuarioDisponibleParaDocencia(
        documentoBusqueda.trim(),
      );
      setUsuarioEncontrado(response.data);
    } catch (error: unknown) {
      setErrorVinculacion(extraerMensajeError(error));
    } finally {
      setBuscandoUsuario(false);
    }
  };

  const vincularComoDocente = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!usuarioEncontrado) return;

    setErrorVinculacion("");
    setMensajeVinculacion("");
    setVinculandoDocente(true);

    try {
      const response = await vincularDocenteAUsuarioExistente(
        usuarioEncontrado.usuarioId,
        datosDocente,
      );
      setDocenteVinculado(response.data);

      const documentos = new FormData();
      if (archivosDocente.profilePicture) {
        documentos.append("profilePicture", archivosDocente.profilePicture);
      }
      if (archivosDocente.identityDocument) {
        documentos.append("identityDocument", archivosDocente.identityDocument);
      }
      if (archivosDocente.cv) {
        documentos.append("cv", archivosDocente.cv);
      }
      if (
        datosDocente.reportaDiscapacidad &&
        archivosDocente.disabilityCertificate
      ) {
        documentos.append(
          "disabilityCertificate",
          archivosDocente.disabilityCertificate,
        );
      }

      if ([...documentos.keys()].length > 0) {
        try {
          await actualizarDocumentosDocente(response.data.id, documentos);
        } catch (error: unknown) {
          setErrorVinculacion(
            `El perfil docente se vinculó, pero no se pudieron guardar algunos documentos: ${extraerMensajeError(error)}. Puedes completarlos desde el expediente.`,
          );
          recargarDocentes();
          return;
        }
      }

      setMensajeVinculacion(
        "El perfil docente quedó vinculado a la cuenta existente.",
      );
      recargarDocentes();
    } catch (error: unknown) {
      setErrorVinculacion(extraerMensajeError(error));
    } finally {
      setVinculandoDocente(false);
    }
  };

  const cerrarVinculacion = () => {
    if (vinculandoDocente) return;
    setMostrarVinculacion(false);
    setDocumentoBusqueda("");
    setUsuarioEncontrado(null);
    setDatosDocente(datosDocenteVacio);
    setArchivosDocente(archivosVacios);
    setDocenteVinculado(null);
    setErrorVinculacion("");
    setMensajeVinculacion("");
  };


  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 p-4 sm:p-6">

      {/* Encabezado */}
      <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">

        <div>
          <p className="eyebrow mb-2">Academia</p>
          <h1 className="page-title">Gestión de Docentes</h1>
          <p className="mt-2 text-sm text-muted">
            Consulta, filtra y administra los expedientes y perfiles
            de los docentes.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => setMostrarVinculacion(true)}
            className="outline-btn"
          >
            Vincular coordinador existente
          </button>
          <button
            type="button"
            onClick={() => navigate("/docentes/registrar")}
            className="primary-btn"
          >
            + Registrar docente
          </button>
        </div>

      </header>

      {/* Indicadores */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">

        <div className="card p-4">
          <p className="text-xs font-semibold text-muted">
            Docentes encontrados
          </p>
          <p className="mt-2 text-2xl font-bold text-navy">
            {totalDocentes}
          </p>
        </div>

        <div className="card p-4">
          <p className="text-xs font-semibold text-muted">
            Docentes activos
          </p>
          <p className="mt-2 text-2xl font-bold text-green">
            {activos}
          </p>
        </div>

        <div className="card p-4">
          <p className="text-xs font-semibold text-muted">
            Docentes inactivos
          </p>
          <p className="mt-2 text-2xl font-bold text-red">
            {inactivos}
          </p>
        </div>

      </section>

      {/* Mensajes globales */}
      {mensajeExito && (
        <div
          role="status"
          className="rounded-lg border border-green/25 bg-green-soft p-4"
        >
          <p className="text-sm font-medium text-green">
            {mensajeExito}
          </p>
        </div>
      )}

      {errorAccion && (
        <div
          role="alert"
          className="rounded-lg border border-error/25 bg-error-soft p-4"
        >
          <p className="text-sm font-medium text-error">
            {errorAccion}
          </p>
        </div>
      )}

      {/* Listado y filtros */}
      <section className="card overflow-hidden">

        <div className="flex flex-col gap-4 border-b border-border p-4 sm:p-5">

          <div>
            <h2 className="section-title">
              Listado de docentes
            </h2>
            <p className="mt-1 text-xs text-muted">
              Busca por nombre, código o número de documento.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(220px,1fr)_200px]">

            {/* Búsqueda */}
            <div>
              <label
                htmlFor="busqueda-docentes"
                className="field-label"
              >
                Buscar docente
              </label>

              <input
                id="busqueda-docentes"
                type="search"
                value={busqueda}
                onChange={(event) =>
                  setBusqueda(event.target.value)
                }
                placeholder="Nombre, apellidos o documento..."
                className="form-input"
              />
            </div>

            {/* Filtro de estado */}
            <div>
              <label
                htmlFor="filtro-estado-docente"
                className="field-label"
              >
                Estado
              </label>

              <select
                id="filtro-estado-docente"
                value={estado}
                onChange={(event) =>
                  setEstado(
                    event.target.value as
                      | ""
                      | "ACTIVO"
                      | "INACTIVO"
                      | "REGISTRADO"
                  )
                }
                className="form-input"
              >
                <option value="">Todos los estados</option>
                <option value="ACTIVO">Activo</option>
                <option value="INACTIVO">Inactivo</option>
                <option value="REGISTRADO">Registrado</option>
              </select>
            </div>

          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={recargarDocentes}
              disabled={isLoading}
              className="outline-btn disabled:opacity-50"
            >
              {isLoading ? "Actualizando..." : "Actualizar listado"}
            </button>
          </div>

        </div>

        {/* Error de carga */}
        {error && (
          <div className="m-4 rounded-lg border border-error/20 bg-error-soft p-4">
            <p className="text-sm font-medium text-error">
              {error}
            </p>

            <button
              type="button"
              onClick={recargarDocentes}
              disabled={isLoading}
              className="mt-2 text-xs font-bold text-error underline"
            >
              Intentar nuevamente
            </button>
          </div>
        )}

        {/* Tabla */}
        <div className="overflow-x-auto">

          <table className="w-full min-w-[750px] text-left">

            <thead>
              <tr className="table-header">
                <th className="px-5 py-3">Código</th>
                <th className="px-5 py-3">Docente</th>
                <th className="px-5 py-3">Documento</th>
                <th className="px-5 py-3">Estado</th>
                <th className="px-5 py-3 text-right">Acciones</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border">

              {/* Estado de carga */}
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center">
                    <p className="text-sm text-muted">
                      Cargando docentes...
                    </p>
                  </td>
                </tr>

              ) : error && docentes.length === 0 ? (
                /* Error sin datos */
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center">
                    <p className="font-semibold text-heading">
                      No se pudo cargar el listado
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      Intenta nuevamente en unos momentos.
                    </p>
                  </td>
                </tr>

              ) : docentes.length === 0 ? (
                /* Listado vacío */
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center">
                    <p className="font-semibold text-heading">
                      No se encontraron docentes
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      Prueba cambiando los filtros o el término de búsqueda.
                    </p>
                  </td>
                </tr>

              ) : (
                /* Listado de docentes */
                docentes.map((docente) => (
                  <tr
                    key={docente.id}
                    className="transition hover:bg-surface-muted"
                  >

                    <td className="px-5 py-4 text-sm font-medium text-navy">
                      {docente.codigo}
                    </td>

                    <td className="px-5 py-4">
                      <p className="text-sm font-semibold text-heading">
                        {docente.nombre} {docente.apellidos}
                      </p>
                    </td>

                    <td className="px-5 py-4 text-sm text-body">
                      {docente.tipoDocumento}: {docente.numeroDocumento}
                    </td>

                    

                    <td className="px-5 py-4">
                      <span
                        className={
                          docente.estado === "ACTIVO"
                            ? "badge badge-green"
                            : docente.estado === "INACTIVO"
                            ? "badge badge-red"
                            : "badge badge-amber"
                        }
                      >
                        {docente.estado}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() =>
                          navigate(`/docentes/detalle/${docente.id}`)
                        }
                        className="primary-btn px-3 py-1.5 text-xs"
                      >
                        Ver detalle / Hoja de vida
                      </button>
                    </td>

                  </tr>
                ))
              )}

            </tbody>
          </table>
        </div>

      </section>

      {mostrarVinculacion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="vincular-docente-titulo"
            className="my-auto max-h-[95vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white shadow-xl"
          >
            <header className="flex items-start justify-between border-b border-border p-5">
              <div>
                <h2 id="vincular-docente-titulo" className="text-lg font-bold text-navy">
                  Vincular coordinador como docente
                </h2>
                <p className="mt-1 text-sm text-muted">
                  Se conserva la cuenta existente y solo se completa la
                  información propia del perfil docente y los documentos que
                  selecciones.
                </p>
              </div>
              <button
                type="button"
                onClick={cerrarVinculacion}
                disabled={vinculandoDocente}
                className="text-xl text-muted hover:text-red disabled:opacity-50"
                aria-label="Cerrar"
              >
                ×
              </button>
            </header>

            <div className="space-y-5 p-5">
              {!docenteVinculado ? (
                <>
                  <form onSubmit={buscarCoordinador} className="space-y-3">
                    <label htmlFor="documento-coordinador-docente" className="field-label">
                      Documento de identidad del coordinador
                    </label>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <input
                        id="documento-coordinador-docente"
                        value={documentoBusqueda}
                        onChange={(event) => setDocumentoBusqueda(event.target.value)}
                        className="form-input flex-1"
                        minLength={5}
                        required
                      />
                      <button
                        type="submit"
                        disabled={buscandoUsuario || vinculandoDocente}
                        className="outline-btn disabled:opacity-50"
                      >
                        {buscandoUsuario ? "Buscando..." : "Buscar cuenta"}
                      </button>
                    </div>
                  </form>

                  {usuarioEncontrado && (
                    <form onSubmit={vincularComoDocente} className="space-y-5">
                      <div className="rounded-lg border border-border bg-surface-muted p-4">
                        <p className="font-semibold text-heading">
                          {usuarioEncontrado.nombre} {usuarioEncontrado.apellidos}
                        </p>
                        <p className="mt-1 text-sm text-muted">
                          Documento: {usuarioEncontrado.documentoIdentidad} ·
                          Usuario: {usuarioEncontrado.username}
                        </p>
                        <p className="mt-1 text-xs text-muted">
                          Roles actuales: {usuarioEncontrado.roles.join(", ")}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <label htmlFor="tipo-documento-vincular" className="field-label">
                            Tipo de documento *
                          </label>
                          <select
                            id="tipo-documento-vincular"
                            value={datosDocente.tipoDocumento}
                            onChange={(event) =>
                              setDatosDocente((current) => ({
                                ...current,
                                tipoDocumento: event.target.value as VincularDocentePayload["tipoDocumento"],
                              }))
                            }
                            className="form-input"
                          >
                            <option value="CC">Cédula de ciudadanía</option>
                            <option value="CE">Cédula de extranjería</option>
                            <option value="TI">Tarjeta de identidad</option>
                            <option value="PAS">Pasaporte</option>
                          </select>
                        </div>
                        <div>
                          <label htmlFor="fecha-nacimiento-vincular" className="field-label">
                            Fecha de nacimiento *
                          </label>
                          <input
                            id="fecha-nacimiento-vincular"
                            type="date"
                            value={datosDocente.fechaNacimiento}
                            onChange={(event) =>
                              setDatosDocente((current) => ({
                                ...current,
                                fechaNacimiento: event.target.value,
                              }))
                            }
                            className="form-input"
                            required
                          />
                        </div>
                        <div>
                          <label htmlFor="telefono-vincular-docente" className="field-label">
                            Teléfono
                          </label>
                          <input
                            id="telefono-vincular-docente"
                            value={datosDocente.telefono ?? ""}
                            onChange={(event) =>
                              setDatosDocente((current) => ({
                                ...current,
                                telefono: event.target.value,
                              }))
                            }
                            className="form-input"
                          />
                        </div>
                        <div>
                          <label htmlFor="correo-vincular-docente" className="field-label">
                            Correo electrónico
                          </label>
                          <input
                            id="correo-vincular-docente"
                            type="email"
                            value={datosDocente.correo ?? ""}
                            onChange={(event) =>
                              setDatosDocente((current) => ({
                                ...current,
                                correo: event.target.value,
                              }))
                            }
                            className="form-input"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label htmlFor="formacion-vincular-docente" className="field-label">
                            Formación académica
                          </label>
                          <input
                            id="formacion-vincular-docente"
                            value={datosDocente.formacionAcademica ?? ""}
                            onChange={(event) =>
                              setDatosDocente((current) => ({
                                ...current,
                                formacionAcademica: event.target.value,
                              }))
                            }
                            className="form-input"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label htmlFor="experiencia-vincular-docente" className="field-label">
                            Experiencia laboral
                          </label>
                          <textarea
                            id="experiencia-vincular-docente"
                            value={datosDocente.experienciaLaboral ?? ""}
                            onChange={(event) =>
                              setDatosDocente((current) => ({
                                ...current,
                                experienciaLaboral: event.target.value,
                              }))
                            }
                            className="form-input"
                            rows={3}
                          />
                        </div>
                        <label className="flex items-center gap-2 text-sm text-body sm:col-span-2">
                          <input
                            type="checkbox"
                            checked={datosDocente.reportaDiscapacidad}
                            onChange={(event) =>
                              setDatosDocente((current) => ({
                                ...current,
                                reportaDiscapacidad: event.target.checked,
                              }))
                            }
                            className="h-4 w-4 rounded border-border"
                          />
                          Reporta condición de discapacidad
                        </label>
                      </div>

                      <fieldset className="space-y-3">
                        <legend className="field-label">
                          Documentos faltantes (opcional)
                        </legend>
                        <p className="text-xs text-muted">
                          Solo se cargarán los archivos que selecciones. Si no
                          cuentas con alguno ahora, podrás agregarlo desde el
                          expediente del docente.
                        </p>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          {([
                            ["profilePicture", "Foto de perfil", "image/*"],
                            ["identityDocument", "Documento de identidad", ".pdf,image/*"],
                            ["cv", "Hoja de vida (PDF)", ".pdf"],
                            ...(datosDocente.reportaDiscapacidad
                              ? [["disabilityCertificate", "Certificado de discapacidad", ".pdf,image/*"]]
                              : []),
                          ] as const).map(([field, label, accept]) => (
                            <label key={field} className="card space-y-2 p-3">
                              <span className="text-sm font-medium text-body">{label}</span>
                              <input
                                type="file"
                                accept={accept}
                                onChange={(event) =>
                                  setArchivosDocente((current) => ({
                                    ...current,
                                    [field]: event.target.files?.[0] ?? null,
                                  }))
                                }
                                className="form-input text-xs"
                              />
                            </label>
                          ))}
                        </div>
                      </fieldset>

                      <div className="flex justify-end gap-3 border-t border-border pt-4">
                        <button
                          type="button"
                          onClick={cerrarVinculacion}
                          disabled={vinculandoDocente}
                          className="outline-btn"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          disabled={vinculandoDocente}
                          className="primary-btn disabled:opacity-50"
                        >
                          {vinculandoDocente ? "Vinculando..." : "Crear perfil docente"}
                        </button>
                      </div>
                    </form>
                  )}
                </>
              ) : (
                <div className="space-y-4">
                  <p role="status" className="rounded-lg bg-green-soft p-3 text-sm text-green">
                    {mensajeVinculacion || "El perfil docente quedó vinculado."}
                  </p>
                  <p className="text-sm text-body">
                    Expediente creado para {docenteVinculado.nombre} {docenteVinculado.apellidos}
                    {" "}({docenteVinculado.codigo}).
                  </p>
                  <div className="flex flex-wrap justify-end gap-3">
                    <button type="button" onClick={cerrarVinculacion} className="outline-btn">
                      Cerrar
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate(`/docentes/detalle/${docenteVinculado.id}`)}
                      className="primary-btn"
                    >
                      Abrir expediente
                    </button>
                  </div>
                </div>
              )}

              {errorVinculacion && (
                <p role="alert" className="rounded-lg bg-error-soft p-3 text-sm text-error">
                  {errorVinculacion}
                </p>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
