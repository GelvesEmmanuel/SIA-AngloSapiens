
import { useState, type FormEvent } from "react";

import { useAuth } from "../useAuth";
import { extraerMensajeError } from "../../../api/apiError";

export default function ChangePasswordPage() {
  const { cambiarContrasena } = useAuth();

  const [contrasenaActual, setContrasenaActual] = useState("");
  const [nuevaContrasena, setNuevaContrasena] = useState("");
  const [confirmarContrasena, setConfirmarContrasena] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

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
      await cambiarContrasena({
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
    <main className="grid min-h-screen bg-white lg:grid-cols-2">

      {/* Panel informativo */}
      <section className="relative flex min-h-[240px] flex-col justify-between overflow-hidden bg-navy px-8 py-10 text-white sm:px-14 lg:min-h-screen lg:px-16 lg:py-14">
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full border border-white/10" />
        <div className="absolute -bottom-32 -left-24 h-96 w-96 rounded-full border border-white/10" />

        <div className="relative z-10">
          <div className="mb-12 flex items-center gap-3 lg:mb-20">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-xl font-extrabold text-navy">
              A
            </div>
            <div>
              <p className="text-lg font-bold tracking-wide">ANGLOSAPIENS</p>
              <p className="text-xs tracking-[0.2em] text-white/60">
                ACADEMIA DE INGLÉS
              </p>
            </div>
          </div>

          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-white/60">
            Seguridad de tu cuenta
          </p>

          <h1 className="max-w-xl text-4xl font-extrabold leading-tight sm:text-5xl">
            Protege tu acceso,
            <span className="block text-red"> comienza con seguridad.</span>
          </h1>

          <p className="mt-6 max-w-md text-base leading-7 text-white/70">
            Estás realizando el cambio de tu contraseña temporal.
            Este paso ayuda a proteger tu cuenta y tu información académica.
          </p>

          <div className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="font-semibold">Recomendación de seguridad</p>
            <p className="mt-2 text-sm leading-6 text-white/60">
              Utiliza una contraseña personal que no compartas con otras
              personas.
            </p>
          </div>
        </div>

        <p className="relative z-10 mt-12 text-xs text-white/40">
          © {new Date().getFullYear()} Anglosapiens. Todos los derechos reservados.
        </p>
      </section>

      {/* Formulario */}
      <section className="flex items-center justify-center px-6 py-12 sm:px-12 lg:px-16">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <span className="mb-3 inline-flex rounded-full bg-amber-soft px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber">
              Acción requerida
            </span>

            <h2 className="text-3xl font-extrabold tracking-tight text-heading">
              Actualiza tu contraseña
            </h2>

            <p className="mt-3 text-sm leading-6 text-muted">
              Para continuar utilizando el SIA Académico, debes cambiar tu
              contraseña temporal.
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
                className="w-full rounded-xl border border-border bg-surface-muted px-4 py-3.5 text-sm text-heading outline-none transition focus:border-navy focus:bg-white focus:ring-4 focus:ring-navy/10 disabled:opacity-60"
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
                aria-describedby="password-hint"
                className="w-full rounded-xl border border-border bg-surface-muted px-4 py-3.5 text-sm text-heading outline-none transition focus:border-navy focus:bg-white focus:ring-4 focus:ring-navy/10 disabled:opacity-60"
              />
              <small id="password-hint" className="mt-2 block text-xs text-muted">
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
                className="w-full rounded-xl border border-border bg-surface-muted px-4 py-3.5 text-sm text-heading outline-none transition focus:border-navy focus:bg-white focus:ring-4 focus:ring-navy/10 disabled:opacity-60"
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
              className="w-full rounded-xl bg-red px-5 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-red-dark focus:outline-none focus:ring-4 focus:ring-red/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Actualizando contraseña..." : "Guardar nueva contraseña"}
            </button>
          </form>

          <p className="mt-8 text-center text-xs leading-5 text-muted">
            Tu cuenta estará lista para utilizarse después de actualizar
            correctamente la contraseña.
          </p>
        </div>
      </section>
    </main>
  );
}
