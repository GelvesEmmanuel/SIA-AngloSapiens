
// ventana de inicio que muestar un tutorial por rol o una descripciond e como funciona el modulo

import { useAuth } from "../auth/useAuth";
import { roleTutorials } from "./roleTutorial";

export default function HomePage() {
  const { activeRole } = useAuth();

  const profile = activeRole
    ? roleTutorials[activeRole]
    : null;

  return (
    <main className="mx-auto max-w-5xl space-y-6">

      {/* Encabezado */}
      <header>
        <p className="eyebrow mb-1">Inicio</p>
        <h1 className="page-title">
          Bienvenido/a al SIA Académico de la academia AngloSapiens
        </h1>
      </header>

      {/* Presentación del perfil */}
      <section className="card p-5 sm:p-6">
        <p className="text-sm font-semibold text-navy">
          {profile
            ? `Tu perfil activo: ${profile.label}`
            : "Tu espacio académico"}
        </p>

        <p className="mt-2 text-sm leading-6 text-muted">
          {profile?.description ??
            "Aquí encontrarás las herramientas e información disponibles para tu cuenta."}
        </p>
      </section>

      {/* Tutorial personalizado */}
      {profile && (
        <section className="card p-5 sm:p-6 space-y-5">

          <div>
            <p className="eyebrow mb-1">
              Centro de ayuda
            </p>

            <h2 className="text-lg font-bold text-heading">
              {profile.tutorialTitle}
            </h2>

            <p className="mt-2 text-sm leading-6 text-muted">
              {profile.tutorialIntro}
            </p>
          </div>

          <div className="space-y-4">
            {profile.tutorialSteps.map((step, index) => (
              <div
                key={index}
                className="flex gap-4"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy text-sm font-bold text-white">
                  {index + 1}
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-heading">
                    {step.title}
                  </h3>

                  <p className="mt-1 text-sm leading-6 text-muted">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-lg bg-slate-50 p-4">
            <p className="text-sm font-semibold text-heading">
              Recomendación
            </p>

            <p className="mt-1 text-sm leading-6 text-muted">
              {profile.recommendation}
            </p>
          </div>
           <div className="rounded-lg bg-slate-50 p-4">
            <p className="text-sm font-semibold text-heading">
              Advertencia
            </p>

            <p className="mt-1 text-sm leading-6 text-muted">
              {profile.advertencia}
            </p>
          </div>

        </section>
      )}

      {/* Información general */}
      <section className="card border-l-4 border-navy p-5 sm:p-6">
        <h2 className="text-base font-bold text-heading">
          Cómo interpretar los estados
        </h2>

        <p className="mt-2 text-sm leading-6 text-muted">
          Cada módulo puede manejar estados distintos,
          como programado, activo, finalizado o cancelado.
          Estos indican la etapa de un proceso y sus opciones
          dependen de tu perfil.
        </p>
      </section>

    </main>
  );
}
