import { Construction } from "lucide-react";

interface FuncionalidadAcademicaPageProps {
  titulo: string;
  descripcion: string;
}

export function FuncionalidadAcademicaPage({
  titulo,
  descripcion,
}: FuncionalidadAcademicaPageProps) {
  return (
    <section className="card p-8 text-center sm:p-12">
      <Construction size={34} className="mx-auto text-muted" />
      <h2 className="mt-4 section-title">{titulo}</h2>
      <p className="mx-auto mt-2 max-w-lg text-sm text-muted">{descripcion}</p>
      <span className="mt-5 inline-flex rounded-full bg-surface-muted px-3 py-1 text-xs font-semibold text-muted">
        Próximamente
      </span>
    </section>
  );
}
