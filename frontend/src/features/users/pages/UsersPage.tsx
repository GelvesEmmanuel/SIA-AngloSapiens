
import { useUsers } from "../hooks/useUSers";
import type { UserRole } from "../../auth/auth.types";
import { useState } from "react";
import type { Usuario, CrearUsuarioCoordinadorPayload } from "../user.types";
import type { FormEvent } from "react";

const roles: { value: UserRole | ""; label: string }[] = [
  { value: "", label: "Todos los roles" },
  { value: "SUPER_ADMIN", label: "Superadministrador" },
  { value: "COORD_ACADEMICO", label: "Coordinador académico" },
  { value: "COORD_ADMINISTRATIVO", label: "Coordinador administrativo" },
  { value: "DOCENTE", label: "Docente" },
  { value: "ESTUDIANTE", label: "Estudiante" },
];

const roleLabels: Record<UserRole, string> = {
  SUPER_ADMIN: "Superadministrador",
  COORD_ACADEMICO: "Coord. académico",
  COORD_ADMINISTRATIVO: "Coord. administrativo",
  DOCENTE: "Docente",
  ESTUDIANTE: "Estudiante",
};

function formatDate(date: string) {
  if (!date) return "—";

  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
  }).format(new Date(date));
}

export default function UsersPage() {
  const {
  usuarios,
  busqueda,
  setBusqueda,
  rol,
  setRol,
  estado,
  setEstado,
  isLoading,
  error,
  recargarUsuarios,
  accionEnCurso,
  mensajeExito,
  errorAccion,
  ejecutarCambiarEstado,
  ejecutarRestablecerContrasena,
  limpiarMensajes,

  isCreating,
    ejecutarCrearCoordinador,
} = useUsers();

// estado del formulario de crear
const [mostrarFormulario, setMostrarFormulario] = useState(false);

const [formulario, setFormulario] =
  useState<CrearUsuarioCoordinadorPayload>({
    primerNombre: "",
    segundoNombre: "",
    primerApellido: "",
    segundoApellido: "",
    documentoIdentidad: "",
    diaCumpleanos: 1,
    rol: "COORD_ACADEMICO",
  });

const [usuarioSeleccionado, setUsuarioSeleccionado] =
  useState<Usuario | null>(null);

const [tipoAccion, setTipoAccion] = useState<
  "estado" | "contrasena" | null
>(null);
  const activos = usuarios.filter(
    (usuario) => usuario.estado === "ACTIVO"
  ).length;

  const inactivos = usuarios.filter(
    (usuario) => usuario.estado === "INACTIVO"
  ).length;

// funciones del formulario
const actualizarCampo = (
  campo: keyof CrearUsuarioCoordinadorPayload,
  valor: string
) => {
  setFormulario((actual) => ({
    ...actual,
    [campo]: campo === "diaCumpleanos" ? Number(valor) : valor,
  }));
};

const cerrarFormulario = () => {
  if (isCreating) return;

  setMostrarFormulario(false);
  setFormulario({
    primerNombre: "",
    segundoNombre: "",
    primerApellido: "",
    segundoApellido: "",
    documentoIdentidad: "",
    diaCumpleanos: 1,
    rol: "COORD_ACADEMICO",
  });
  limpiarMensajes();
};

const enviarFormulario = async (event: FormEvent<HTMLFormElement>) => {
  event.preventDefault();

  try {
    await ejecutarCrearCoordinador(formulario);

    setMostrarFormulario(false);
    setFormulario({
      primerNombre: "",
      segundoNombre: "",
      primerApellido: "",
      segundoApellido: "",
      documentoIdentidad: "",
      diaCumpleanos: 1,
      rol: "COORD_ACADEMICO",
    });
  } catch {
    // El hook conserva el mensaje de error para mostrarlo.
  }
};
  // funcione sabrir el modal 
  const abrirConfirmacion = (
  usuario: Usuario,
  accion: "estado" | "contrasena"
) => {
  limpiarMensajes();
  setUsuarioSeleccionado(usuario);
  setTipoAccion(accion);
};

const cerrarConfirmacion = () => {
  if (accionEnCurso) return;

  setUsuarioSeleccionado(null);
  setTipoAccion(null);
  limpiarMensajes();
};

const confirmarAccion = async () => {
  if (!usuarioSeleccionado || !tipoAccion) return;

  try {
    if (tipoAccion === "estado") {
      await ejecutarCambiarEstado(usuarioSeleccionado.usuarioId);
    } else {
      await ejecutarRestablecerContrasena(usuarioSeleccionado.usuarioId);
    }

    setUsuarioSeleccionado(null);
    setTipoAccion(null);
  } catch {
    // El hook ya guarda y expone el mensaje de error.
    // Mantenemos abierto el modal para que el usuario pueda verlo.
  }
};
  return (
    <div className="mx-auto w-full max-w-7xl space-y-5">

      {/* Encabezado */}
      <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <button
  type="button"
  onClick={() => {
    limpiarMensajes();
    setMostrarFormulario(true);
  }}
  className="primary-btn"
>
  + Crear coordinador
</button>
        <div>
          <p className="eyebrow mb-2">Administración</p>
          <h1 className="page-title">Usuarios</h1>
          <p className="mt-2 text-sm text-muted">
            Consulta y administra las cuentas de acceso al sistema académico.
          </p>
        </div>
      </header>

      {/* Indicadores */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="card p-4">
          <p className="text-xs font-semibold text-muted">
            Usuarios encontrados
          </p>
          <p className="mt-2 text-2xl font-bold text-navy">
            {usuarios.length}
          </p>
        </div>

        <div className="card p-4">
          <p className="text-xs font-semibold text-muted">
            Cuentas activas
          </p>
          <p className="mt-2 text-2xl font-bold text-green">
            {activos}
          </p>
        </div>

        <div className="card p-4">
          <p className="text-xs font-semibold text-muted">
            Cuentas inactivas
          </p>
          <p className="mt-2 text-2xl font-bold text-red">
            {inactivos}
          </p>
        </div>
      </section>
        {mensajeExito && (
  <div className="rounded-lg border border-green/20 bg-green-soft p-4">
    <p className="text-sm font-medium text-green">
      {mensajeExito}
    </p>
  </div>
)}

{errorAccion && (
  <div className="rounded-lg border border-error/20 bg-error-soft p-4">
    <p className="text-sm font-medium text-error">
      {errorAccion}
    </p>
  </div>
)}
      {/* Listado */}
      <section className="card overflow-hidden">

        <div className="flex flex-col gap-4 border-b border-border p-4 sm:p-5">
          <div>
            <h2 className="section-title">Listado de usuarios</h2>
            <p className="mt-1 text-xs text-muted">
              Busca y filtra las cuentas registradas en la plataforma.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(220px,1fr)_220px_180px]">

            {/* Búsqueda */}
            <div>
              <label htmlFor="busqueda-usuarios" className="field-label">
                Buscar usuario
              </label>
              <div className="relative">
                <input
                  id="busqueda-usuarios"
                  type="search"
                  value={busqueda}
                  onChange={(event) => setBusqueda(event.target.value)}
                  placeholder="Nombre, documento o username..."
                  className="form-input"
                />
              </div>
            </div>

            {/* Filtro de rol */}
            <div>
              <label htmlFor="filtro-rol" className="field-label">
                Rol
              </label>
              <select
                id="filtro-rol"
                value={rol}
                onChange={(event) =>
                  setRol(event.target.value as UserRole | "")
                }
                className="form-input"
              >
                {roles.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro de estado */}
            <div>
              <label htmlFor="filtro-estado" className="field-label">
                Estado
              </label>
              <select
                id="filtro-estado"
                value={estado}
                onChange={(event) =>
                  setEstado(event.target.value as "" | "ACTIVO" | "INACTIVO")
                }
                className="form-input"
              >
                <option value="">Todos los estados</option>
                <option value="ACTIVO">Activo</option>
                <option value="INACTIVO">Inactivo</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={recargarUsuarios}
              className="outline-btn"
            >
              Actualizar listado
            </button>
          </div>
        </div>

        {/* Errores */}
        {error && (
          <div className="m-4 rounded-lg border border-error/20 bg-error-soft p-4">
            <p className="text-sm font-medium text-error">{error}</p>
            <button
              type="button"
              onClick={recargarUsuarios}
              className="mt-2 text-xs font-bold text-error underline"
            >
              Intentar nuevamente
            </button>
          </div>
        )}

        {/* Tabla */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left">
            <thead>
              <tr className="table-header">
                <th className="px-5 py-3">Usuario</th>
                <th className="px-5 py-3">Documento</th>
                <th className="px-5 py-3">Username</th>
                <th className="px-5 py-3">Rol</th>
                <th className="px-5 py-3">Estado</th>
                <th className="px-5 py-3">Creación</th>
                <th className="px-5 py-3">Contraseña</th>
                <th className="px-5 py-3">Acciones</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center">
                    <p className="text-sm text-muted">
                      Cargando usuarios...
                    </p>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-sm text-muted">
                    No se pudo cargar el listado.
                  </td>
                </tr>
              ) : usuarios.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center">
                    <p className="font-semibold text-heading">
                      No se encontraron usuarios
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      Prueba cambiando los filtros o el término de búsqueda.
                    </p>
                  </td>
                </tr>
              ) : (
                usuarios.map((usuario) => (
                  <tr
                    key={usuario.usuarioId}
                    className="transition hover:bg-surface-muted"
                  >
                    <td className="px-5 py-4">
                      <p className="text-sm font-semibold text-heading">
                        {usuario.nombre === "N/A"
                          ? "Sin información personal"
                          : `${usuario.nombre} ${usuario.apellidos}`.trim()}
                      </p>
                    </td>

                    <td className="px-5 py-4 text-sm text-body">
                      {usuario.documentoIdentidad}
                    </td>

                    <td className="px-5 py-4 text-sm font-medium text-navy">
                      {usuario.username}
                    </td>

                    <td className="px-5 py-4">
                      <span className="badge badge-navy">
                        {roleLabels[usuario.rol]}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={
                          usuario.estado === "ACTIVO"
                            ? "badge badge-green"
                            : "badge badge-red"
                        }
                      >
                        {usuario.estado}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-sm text-muted">
                      {formatDate(usuario.createAt)}
                    </td>

                    <td className="px-5 py-4">
                      {usuario.requiereCambioContrasena ? (
                        <span className="badge badge-amber">
                          Pendiente
                        </span>
                      ) : (
                        <span className="badge badge-gray">
                          Actualizada
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4">
  <div className="flex items-center gap-2">

    <button
      type="button"
      onClick={() => abrirConfirmacion(usuario, "estado")}
      disabled={
        accionEnCurso?.usuarioId === usuario.usuarioId
      }
      className="text-xs font-semibold text-navy hover:underline disabled:opacity-50"
    >
      {usuario.estado === "ACTIVO" ? "Desactivar" : "Activar"}
    </button>

    <span className="text-border">|</span>

    <button
      type="button"
      onClick={() => abrirConfirmacion(usuario, "contrasena")}
      disabled={
        accionEnCurso?.usuarioId === usuario.usuarioId
      }
      className="text-xs font-semibold text-red hover:underline disabled:opacity-50"
    >
      Restablecer contraseña
    </button>

  </div>
</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <footer className="border-t border-border px-5 py-3">
          <p className="text-xs text-muted">
            {isLoading
              ? "Consultando información..."
              : `${usuarios.length} usuario(s) encontrados`}
          </p>
        </footer>
      </section>
      {usuarioSeleccionado && tipoAccion && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
    <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">

      <div className="mb-4">
        <h2 className="text-lg font-bold text-navy">
          {tipoAccion === "estado"
            ? usuarioSeleccionado.estado === "ACTIVO"
              ? "Desactivar usuario"
              : "Activar usuario"
            : "Restablecer contraseña"}
        </h2>

        <p className="mt-2 text-sm leading-6 text-muted">
          {tipoAccion === "estado"
            ? `¿Estás seguro de que deseas ${
                usuarioSeleccionado.estado === "ACTIVO"
                  ? "desactivar"
                  : "activar"
              } la cuenta de ${usuarioSeleccionado.username}?`
            : `¿Deseas restablecer la contraseña de ${usuarioSeleccionado.username}?`}
        </p>
      </div>

      {tipoAccion === "contrasena" && (
        <div className="mb-4 rounded-lg bg-amber-soft p-3">
          <p className="text-xs leading-5 text-amber">
            Esta operación puede generar una contraseña temporal
            y exigir que el usuario la cambie en su próximo inicio
            de sesión. Confirma que deseas continuar.
          </p>
        </div>
      )}

      <div className="flex justify-end gap-3">

        <button
          type="button"
          onClick={cerrarConfirmacion}
          disabled={!!accionEnCurso}
          className="outline-btn"
        >
          Cancelar
        </button>

        <button
          type="button"
          onClick={confirmarAccion}
          disabled={!!accionEnCurso}
          className="primary-btn disabled:cursor-not-allowed disabled:opacity-60"
        >
          {accionEnCurso
            ? "Procesando..."
            : "Confirmar"}
        </button>

      </div>
    </div>
  </div>
)}

{/*formulario*/ }
{mostrarFormulario && (
  <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4">
    <div className="my-auto w-full max-w-2xl rounded-xl bg-white shadow-xl">

      <div className="flex items-center justify-between border-b border-border p-5">
        <div>
          <h2 className="text-lg font-bold text-navy">
            Registrar coordinador
          </h2>
          <p className="mt-1 text-sm text-muted">
            Completa los datos personales y asigna el tipo de coordinador.
          </p>
        </div>

        <button
          type="button"
          onClick={cerrarFormulario}
          disabled={isCreating}
          className="text-xl text-muted hover:text-red disabled:opacity-50"
        >
          ×
        </button>
      </div>

      <form onSubmit={enviarFormulario} className="space-y-5 p-5">

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

          <div>
            <label className="field-label">Primer nombre *</label>
            <input
              type="text"
              required
              maxLength={60}
              value={formulario.primerNombre}
              onChange={(e) =>
                actualizarCampo("primerNombre", e.target.value)
              }
              className="form-input"
              placeholder="Primer nombre"
            />
          </div>

          <div>
            <label className="field-label">Segundo nombre</label>
            <input
              type="text"
              maxLength={60}
              value={formulario.segundoNombre}
              onChange={(e) =>
                actualizarCampo("segundoNombre", e.target.value)
              }
              className="form-input"
              placeholder="Segundo nombre"
            />
          </div>

          <div>
            <label className="field-label">Primer apellido *</label>
            <input
              type="text"
              required
              maxLength={60}
              value={formulario.primerApellido}
              onChange={(e) =>
                actualizarCampo("primerApellido", e.target.value)
              }
              className="form-input"
              placeholder="Primer apellido"
            />
          </div>

          <div>
            <label className="field-label">Segundo apellido</label>
            <input
              type="text"
              maxLength={60}
              value={formulario.segundoApellido}
              onChange={(e) =>
                actualizarCampo("segundoApellido", e.target.value)
              }
              className="form-input"
              placeholder="Segundo apellido"
            />
          </div>

          <div>
            <label className="field-label">Documento de identidad *</label>
            <input
              type="text"
              required
              maxLength={30}
              value={formulario.documentoIdentidad}
              onChange={(e) =>
                actualizarCampo("documentoIdentidad", e.target.value)
              }
              className="form-input"
              placeholder="Número de documento"
            />
          </div>

          <div>
            <label className="field-label">Día de cumpleaños *</label>
            <input
              type="number"
              required
              min={1}
              max={31}
              value={formulario.diaCumpleanos}
              onChange={(e) =>
                actualizarCampo("diaCumpleanos", e.target.value)
              }
              className="form-input"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="field-label">Tipo de coordinador *</label>
            <select
              required
              value={formulario.rol}
              onChange={(e) =>
                actualizarCampo("rol", e.target.value)
              }
              className="form-input"
            >
              <option value="COORD_ACADEMICO">
                Coordinador académico
              </option>
              <option value="COORD_ADMINISTRATIVO">
                Coordinador administrativo
              </option>
            </select>
          </div>

        </div>

        <div className="rounded-lg bg-surface-muted p-3">
          <p className="text-xs leading-5 text-muted">
            El sistema gestionará la creación de la cuenta de acceso
            según las reglas configuradas en el backend.
          </p>
        </div>

        {errorAccion && (
          <div className="rounded-lg border border-error/20 bg-error-soft p-3">
            <p className="text-sm text-error">{errorAccion}</p>
          </div>
        )}

        <div className="flex justify-end gap-3 border-t border-border pt-4">

          <button
            type="button"
            onClick={cerrarFormulario}
            disabled={isCreating}
            className="outline-btn"
          >
            Cancelar
          </button>

          <button
            type="submit"
            disabled={isCreating}
            className="primary-btn disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isCreating ? "Registrando..." : "Registrar coordinador"}
          </button>

        </div>

      </form>
    </div>
  </div>
)}
    </div>
  );
}
