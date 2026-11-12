import { useState, type FormEvent } from "react";
import type {
  CursoPayload,
  HabilidadCurso,
  NivelCurso,
} from "../curso.types";

const niveles: NivelCurso[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

const habilidadesDisponibles: Array<{
  value: HabilidadCurso;
  label: string;
}> = [
  { value: "SPEAKING", label: "Expresión oral" },
  { value: "WRITING", label: "Escritura" },
  { value: "LISTENING", label: "Comprensión auditiva" },
  { value: "READING", label: "Lectura" },
  { value: "GRAMMAR", label: "Gramática" },
  { value: "HOMEWORK", label: "Tareas" },
  { value: "ASISTENCIA", label: "Asistencia" },
  { value: "PARTICIPATION", label: "Participación" },
  { value: "EXAMS", label: "Exámenes" },
];

interface CursoFormProps {
  initialValues?: CursoPayload;
  submitLabel: string;
  isSubmitting: boolean;
  onSubmit: (payload: CursoPayload) => Promise<void>;
}

export function CursoForm({
  initialValues,
  submitLabel,
  isSubmitting,
  onSubmit,
}: CursoFormProps) {
  const [nombre, setNombre] = useState(initialValues?.nombre ?? "");
  const [nivel, setNivel] = useState<NivelCurso>(initialValues?.nivel ?? "A1");
  const [descripcion, setDescripcion] = useState(
    initialValues?.descripcion ?? "",
  );
  const [duracionSemanas, setDuracionSemanas] = useState(
    String(initialValues?.duracionSemanas ?? ""),
  );
  const [intensidadSemanal, setIntensidadSemanal] = useState(
    String(initialValues?.intensidadSemanal ?? ""),
  );
  const [habilidades, setHabilidades] = useState<HabilidadCurso[]>(
    initialValues?.habilidades ?? [],
  );
  const [errorValidacion, setErrorValidacion] = useState("");

  const alternarHabilidad = (habilidad: HabilidadCurso) => {
    setHabilidades((actuales) =>
      actuales.includes(habilidad)
        ? actuales.filter((item) => item !== habilidad)
        : [...actuales, habilidad],
    );
  };

  const enviarFormulario = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const semanas = Number(duracionSemanas);
    const horasSemanales = Number(intensidadSemanal);

    if (!nombre.trim()) {
      setErrorValidacion("El nombre del curso es obligatorio.");
      return;
    }
    if (!Number.isInteger(semanas) || semanas <= 0) {
      setErrorValidacion("La duración debe ser un número entero mayor a cero.");
      return;
    }
    if (!Number.isInteger(horasSemanales) || horasSemanales <= 0) {
      setErrorValidacion(
        "La intensidad semanal debe ser un número entero mayor a cero.",
      );
      return;
    }
    if (habilidades.length === 0) {
      setErrorValidacion("Selecciona al menos una habilidad.");
      return;
    }

    setErrorValidacion("");
    await onSubmit({
      nombre: nombre.trim(),
      nivel,
      descripcion: descripcion.trim() || null,
      duracionSemanas: semanas,
      intensidadSemanal: horasSemanales,
      habilidades,
    });
  };

  return (
    <form onSubmit={enviarFormulario} className="space-y-5">
      {errorValidacion && (
        <p role="alert" className="rounded-lg bg-error-soft p-3 text-sm text-error">
          {errorValidacion}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="curso-nombre" className="field-label">Nombre del curso</label>
          <input
            id="curso-nombre"
            value={nombre}
            onChange={(event) => setNombre(event.target.value)}
            maxLength={100}
            required
            className="form-input"
          />
        </div>
        <div>
          <label htmlFor="curso-nivel" className="field-label">Nivel MCER</label>
          <select
            id="curso-nivel"
            value={nivel}
            onChange={(event) => setNivel(event.target.value as NivelCurso)}
            className="form-input"
          >
            {niveles.map((opcion) => <option key={opcion}>{opcion}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="curso-duracion" className="field-label">
            Duración (semanas)
          </label>
          <input
            id="curso-duracion"
            type="number"
            min="1"
            step="1"
            value={duracionSemanas}
            onChange={(event) => setDuracionSemanas(event.target.value)}
            required
            className="form-input"
          />
        </div>
        <div>
          <label htmlFor="curso-intensidad" className="field-label">
            Intensidad semanal
          </label>
          <input
            id="curso-intensidad"
            type="number"
            min="1"
            step="1"
            value={intensidadSemanal}
            onChange={(event) => setIntensidadSemanal(event.target.value)}
            required
            className="form-input"
          />
        </div>
      </div>

      <div>
        <label htmlFor="curso-descripcion" className="field-label">
          Descripción
        </label>
        <textarea
          id="curso-descripcion"
          value={descripcion}
          onChange={(event) => setDescripcion(event.target.value)}
          rows={4}
          className="form-input"
        />
      </div>

      <fieldset>
        <legend className="field-label">Habilidades del curso</legend>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {habilidadesDisponibles.map(({ value, label }) => (
            <label key={value} className="flex items-center gap-2 text-sm text-body">
              <input
                type="checkbox"
                checked={habilidades.includes(value)}
                onChange={() => alternarHabilidad(value)}
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      <button type="submit" disabled={isSubmitting} className="primary-btn disabled:opacity-50">
        {isSubmitting ? "Guardando..." : submitLabel}
      </button>
    </form>
  );
}
