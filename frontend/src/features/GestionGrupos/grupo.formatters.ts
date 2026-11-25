import type { DiaSemana, Grupo } from "./grupo.types";

type GrupoConHorario = Pick<Grupo, "codigo" | "horarios">;

const abreviaturasDias: Record<DiaSemana, string> = {
  LUNES: "Lun",
  MARTES: "Mar",
  MIERCOLES: "Mié",
  JUEVES: "Jue",
  VIERNES: "Vie",
  SABADO: "Sáb",
};

export function formatearNombreGrupo(
  grupo: Pick<Grupo, "codigo">,
  nombreCurso?: string | null,
): string {
  return `${grupo.codigo} - ${nombreCurso?.trim() || "Curso no disponible"}`;
}

export function formatearNombreGrupoConHorario(
  grupo: GrupoConHorario,
  nombreCurso?: string | null,
): string {
  const nombre = formatearNombreGrupo(grupo, nombreCurso);
  if (grupo.horarios.length === 0) return nombre;

  const diasPorHorario = new Map<string, DiaSemana[]>();
  for (const horario of grupo.horarios) {
    const rango = `${horario.horaInicio.slice(0, 5)}–${horario.horaFin.slice(0, 5)}`;
    const dias = diasPorHorario.get(rango) ?? [];
    dias.push(horario.diaSemana);
    diasPorHorario.set(rango, dias);
  }

  const horarios = Array.from(diasPorHorario, ([rango, dias]) =>
    `${dias.map((dia) => abreviaturasDias[dia]).join("/")} ${rango}`,
  ).join(" / ");

  return `${nombre} (${horarios})`;
}
