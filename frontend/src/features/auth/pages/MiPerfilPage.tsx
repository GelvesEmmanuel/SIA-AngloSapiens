import { useEffect, useState, type FormEvent } from "react";
import { extraerMensajeError } from "../../../api/apiError";
import { authService } from "../auth.service";
import type { PerfilAutenticado, UserRole } from "../auth.types";
import { useAuth } from "../useAuth";

const roleLabels: Record<UserRole, string> = {
  SUPER_ADMIN: "Superadministrador",
  COORD_ACADEMICO: "Coordinador académico",
  COORD_ADMINISTRATIVO: "Coordinador administrativo",
  DOCENTE: "Docente",
  ESTUDIANTE: "Estudiante",
};

export default function MiPerfilPage() {
  const { cambiarContrasenaDesdeSesion, activeRole } = useAuth();
  const [perfil, setPerfil] = useState<PerfilAutenticado | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState("");
  const [contrasenaActual, setContrasenaActual] = useState("");
  const [nuevaContrasena, setNuevaContrasena] = useState("");
  const [confirmarContrasena, setConfirmarContrasena] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    const cargarPerfil = async () => {
      try {
        const response = await authService.obtenerPerfilActual();
        if (!response.success) {
          throw new Error(response.message || "No fue posible cargar el perfil.");
        }
        if (isMounted) setPerfil(response.data);
      } catch (error: unknown) {
        if (isMounted) setProfileError(extraerMensajeError(error));
      } finally {
        if (isMounted) setIsProfileLoading(false);
      }
    };

    void cargarPerfil();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");

    if (nuevaContrasena.length < 6) {
      setErrorMessage("La nueva contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (nuevaContrasena !== confirmarContrasena) {
      setErrorMessage("Las contraseñas nuevas no coinciden.");
      return;
    }

    if (nuevaContrasena === contrasenaActual) {
      setErrorMessage("La nueva contraseña debe ser diferente de la actual.");
      return;
    }

    setIsSubmitting(true);
    try {
      await cambiarContrasenaDesdeSesion({
        contrasenaActual,
        nuevaContrasena,
      });
    } catch (error: unknown) {
      setErrorMessage(extraerMensajeError(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <section className="rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-wider text-muted">
            Cuenta
          </p>
          <h1 className="mt-2 text-2xl font-extrabold text-heading">Mi perfil</h1>
          <p className="mt-2 text-sm leading-6 text-muted">
            Información básica de tu cuenta y perfiles autorizados.
          </p>
        </div>

        {isProfileLoading && (
          <p role="status" className="text-sm text-muted">
            Cargando información del perfil...
          </p>
        )}
        {profileError && (
          <p
            className="rounded-xl border border-error/20 bg-error-soft px-4 py-3 text-sm text-error"
            role="alert"
          >
            {profileError}
          </p>
        )}
        {perfil && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-surface-muted p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                Nombre
              </p>
              <p className="mt-2 font-semibold text-heading">{perfil.nombre}</p>
            </div>
            <div className="rounded-xl bg-surface-muted p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                Usuario
              </p>
              <p className="mt-2 font-semibold text-heading">{perfil.username}</p>
            </div>
            <div className="rounded-xl bg-surface-muted p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                Perfil activo
              </p>
              <p className="mt-2 font-semibold text-heading">
                {activeRole ? roleLabels[activeRole] : "No asignado"}
              </p>
            </div>
            <div className="rounded-xl bg-surface-muted p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                Roles de la cuenta
              </p>
              <p className="mt-2 font-semibold text-heading">
                {perfil.roles.map((role) => roleLabels[role]).join(", ")}
              </p>
            </div>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-wider text-muted">
            Seguridad
          </p>
          <h2 className="mt-2 text-xl font-extrabold text-heading">
            Cambiar contraseña
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            Confirma tu contraseña actual y elige una nueva. Por seguridad,
            tendrás que iniciar sesión nuevamente después del cambio.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label
            htmlFor="contrasenaActual"
            className="mb-2 block text-sm font-semibold text-body"
          >
            Contraseña actual
          </label>
          <input
            id="contrasenaActual"
            name="contrasenaActual"
            type="password"
            autoComplete="current-password"
            value={contrasenaActual}
            onChange={(event) => setContrasenaActual(event.target.value)}
            required
            disabled={isSubmitting}
            className="w-full rounded-xl border border-border bg-surface-muted px-4 py-3 text-sm text-heading outline-none transition focus:border-navy focus:bg-white focus:ring-4 focus:ring-navy/10 disabled:opacity-60"
          />
        </div>

        <div>
          <label
            htmlFor="nuevaContrasena"
            className="mb-2 block text-sm font-semibold text-body"
          >
            Nueva contraseña
          </label>
          <input
            id="nuevaContrasena"
            name="nuevaContrasena"
            type="password"
            autoComplete="new-password"
            value={nuevaContrasena}
            onChange={(event) => setNuevaContrasena(event.target.value)}
            minLength={6}
            required
            disabled={isSubmitting}
            className="w-full rounded-xl border border-border bg-surface-muted px-4 py-3 text-sm text-heading outline-none transition focus:border-navy focus:bg-white focus:ring-4 focus:ring-navy/10 disabled:opacity-60"
          />
          <small className="mt-2 block text-xs text-muted">
            Debe tener al menos 6 caracteres.
          </small>
        </div>

        <div>
          <label
            htmlFor="confirmarContrasena"
            className="mb-2 block text-sm font-semibold text-body"
          >
            Confirmar nueva contraseña
          </label>
          <input
            id="confirmarContrasena"
            name="confirmarContrasena"
            type="password"
            autoComplete="new-password"
            value={confirmarContrasena}
            onChange={(event) => setConfirmarContrasena(event.target.value)}
            required
            disabled={isSubmitting}
            className="w-full rounded-xl border border-border bg-surface-muted px-4 py-3 text-sm text-heading outline-none transition focus:border-navy focus:bg-white focus:ring-4 focus:ring-navy/10 disabled:opacity-60"
          />
        </div>

        {errorMessage && (
          <p
            className="rounded-xl border border-error/20 bg-error-soft px-4 py-3 text-sm text-error"
            role="alert"
          >
            {errorMessage}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-xl bg-red px-5 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-red-dark focus:outline-none focus:ring-4 focus:ring-red/20 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {isSubmitting ? "Actualizando contraseña..." : "Actualizar contraseña"}
        </button>
        </form>
      </section>
    </div>
  );
}
