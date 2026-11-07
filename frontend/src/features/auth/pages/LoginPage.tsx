
import { useState, type FormEvent } from "react";
import { useAuth } from "../useAuth";
import { extraerMensajeError } from "../../../api/apiError";

export default function LoginPage() {
  const { login } = useAuth();

  const [username, setUsername] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      await login({
        username: username.trim(),
        contrasena,
      });
    } catch (error: unknown) {
      setErrorMessage(extraerMensajeError(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="grid min-h-[100dvh] overflow-x-hidden bg-white lg:h-[100dvh] lg:min-h-0 lg:grid-cols-2 lg:overflow-hidden">

      {/* Panel institucional */}
      <section className="relative flex min-h-[220px] flex-col justify-between overflow-hidden bg-navy px-8 py-7 text-white sm:px-10 lg:min-h-0 lg:px-12 lg:py-9">
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full border border-white/10" />
        <div className="absolute -bottom-32 -left-24 h-96 w-96 rounded-full border border-white/10" />
        <div className="absolute -bottom-20 -right-16 h-64 w-64 rounded-full bg-white/5" />

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

          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.25em] text-white/60">
            Sistema de gestión académica
          </p>

          <h1 className="max-w-xl text-4xl font-extrabold leading-tight sm:text-5xl xl:text-6xl">
            Tu aprendizaje,
            <span className="block text-red"> nuestra prioridad.</span>
          </h1>

          <p className="mt-6 max-w-md text-base leading-7 text-white/70 sm:text-lg">
            Gestiona tu experiencia académica desde un solo lugar.
            Accede a tus cursos, grupos y procesos académicos de manera
            sencilla y organizada.
          </p>
        </div>

        <div className="relative z-10 mt-12">
          <div className="mb-5 h-1 w-16 rounded-full bg-red" />
          <p className="text-sm text-white/60">
            Formación de calidad, oportunidades sin fronteras.
          </p>
          <p className="mt-2 text-xs text-white/40">
            © {new Date().getFullYear()} Anglosapiens. Todos los derechos reservados.
          </p>
        </div>
      </section>

      {/* Panel de acceso */}
      <section className="flex items-center justify-center px-6 py-8 sm:px-10 lg:px-12 lg:py-6">
        <div className="w-full max-w-sm">

          <div className="mb-10">
            <span className="mb-3 inline-flex rounded-full bg-navy-soft px-3 py-1 text-xs font-bold uppercase tracking-wider text-navy">
              Bienvenido
            </span>

            <h2 className="text-3xl font-extrabold tracking-tight text-heading">
              Iniciar sesión
            </h2>

            <p className="mt-3 text-sm leading-6 text-muted">
              Ingresa tus credenciales para acceder a la plataforma académica.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-1">
            <div>
              <label
                htmlFor="username"
                className="mb-2 block text-sm font-semibold text-body"
              >
                Nombre de usuario
              </label>

              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="Ingresa tu usuario"
                required
                disabled={isSubmitting}
                className="w-full rounded-xl border border-border bg-surface-muted px-4 py-3.5 text-sm text-heading outline-none transition placeholder:text-slate-400 focus:border-navy focus:bg-white focus:ring-4 focus:ring-navy/10 disabled:opacity-60"
              />
            </div>

            <div>
              <label
                htmlFor="contrasena"
                className="mb-2 block text-sm font-semibold text-body"
              >
                Contraseña
              </label>

              <input
                id="contrasena"
                name="contrasena"
                type="password"
                autoComplete="current-password"
                value={contrasena}
                onChange={(event) => setContrasena(event.target.value)}
                placeholder="Ingresa tu contraseña"
                required
                disabled={isSubmitting}
                className="w-full rounded-xl border border-border bg-surface-muted px-4 py-3.5 text-sm text-heading outline-none transition placeholder:text-slate-400 focus:border-navy focus:bg-white focus:ring-4 focus:ring-navy/10 disabled:opacity-60"
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
              {isSubmitting ? "Iniciando sesión..." : "Ingresar a la plataforma"}
            </button>
          </form>

          <div className="mt-10 border-t border-border pt-6 text-center">
            <p className="text-xs leading-5 text-muted">
              Si tienes inconvenientes para ingresar, comunícate con el
              administrador de la academia.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
