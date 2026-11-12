import { useEffect, useRef, useState } from "react";
import type { FormEvent, PointerEvent } from "react";
import { useNavigate } from "react-router-dom";
import { extraerMensajeError } from "../../../api/apiError";
import { registrarEstudianteConFirma } from "../gestionEstudiantes.service";

export function TermsAndSignaturePage() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const [numeroDocumento, setNumeroDocumento] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [mediaPermission, setMediaPermission] = useState<boolean | null>(null);
  const [hasSignature, setHasSignature] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorAccion, setErrorAccion] = useState("");
  const [mensajeExito, setMensajeExito] = useState("");
  const [usernameGenerado, setUsernameGenerado] = useState("");

  useEffect(() => {
    const context = canvasRef.current?.getContext("2d");
    if (!context) return;

    context.strokeStyle = "#0f172a";
    context.lineWidth = 2.5;
    context.lineCap = "round";
    context.lineJoin = "round";
  }, []);

  const getCoordinates = (event: PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const startDrawing = (event: PointerEvent<HTMLCanvasElement>) => {
    if (isSubmitting || mensajeExito) return;
    event.preventDefault();
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    canvas.setPointerCapture(event.pointerId);
    isDrawingRef.current = true;
    const { x, y } = getCoordinates(event);
    context.beginPath();
    context.moveTo(x, y);
  };

  const draw = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    event.preventDefault();

    const context = canvasRef.current?.getContext("2d");
    if (!context) return;

    const { x, y } = getCoordinates(event);
    context.lineTo(x, y);
    context.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    isDrawingRef.current = false;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    context.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorAccion("");
    setMensajeExito("");

    const documento = numeroDocumento.trim();
    const canvas = canvasRef.current;
    if (
      !documento ||
      !acceptedTerms ||
      mediaPermission === null ||
      !hasSignature ||
      !canvas
    ) {
      setErrorAccion("Completa el documento, los consentimientos y la firma.");
      return;
    }

    setIsSubmitting(true);
    try {
      const firmaBlob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("No fue posible procesar la firma digital."));
          }
        }, "image/png");
      });

      const response = await registrarEstudianteConFirma({
        numeroDocumento: documento,
        terminosyCondiciones: acceptedTerms,
        consentimientoUsoImagen: mediaPermission,
        firmaDigital: new File([firmaBlob], "firma.png", {
          type: "image/png",
        }),
      });

      if (response.success !== true) {
        throw new Error(
          response.message || "El servidor no confirmó el registro.",
        );
      }

      setMensajeExito(response.message || "Estudiante registrado con éxito.");
      setUsernameGenerado(response.data.usernameGenerado);
    } catch (error: unknown) {
      setErrorAccion(extraerMensajeError(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-6">
      <header className="flex flex-col justify-between gap-3 border-b border-border pb-4 sm:flex-row sm:items-center">
        <div>
          <p className="eyebrow mb-1">Academia</p>
          <h1 className="page-title">Consentimiento y firma digital</h1>
          <p className="mt-1 text-sm text-muted">
            Revisa las condiciones y registra la decisión sobre el uso de
            imágenes y videos.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate("/estudiantes")}
          className="outline-btn text-xs"
        >
          ← Volver a estudiantes
        </button>
      </header>

      {errorAccion && (
        <div
          role="alert"
          className="rounded-lg border border-error/25 bg-error-soft p-4"
        >
          <p className="text-sm font-medium text-error">{errorAccion}</p>
        </div>
      )}
      {mensajeExito && (
        <div
          role="status"
          className="rounded-lg border border-green/25 bg-green-soft p-4"
        >
          <p className="text-sm font-medium text-green">{mensajeExito}</p>
          {usernameGenerado && (
            <p className="mt-1 text-sm text-green">
              Usuario generado: {usernameGenerado}
            </p>
          )}
          <button
            type="button"
            onClick={() => navigate("/estudiantes")}
            className="outline-btn mt-3"
          >
            Volver a estudiantes
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="card space-y-4 p-5 sm:p-6">
          <div>
            <h2 className="section-title">Identificación del estudiante</h2>
            <p className="mt-1 text-sm text-muted">
              Debe coincidir con el documento utilizado en el pre-registro.
            </p>
          </div>
          <div className="max-w-md">
            <label htmlFor="numeroDocumento" className="field-label">
              Número de documento *
            </label>
            <input
              id="numeroDocumento"
              name="numeroDocumento"
              value={numeroDocumento}
              onChange={(event) => setNumeroDocumento(event.target.value)}
              className="form-input"
              minLength={5}
              autoComplete="off"
              required
              disabled={isSubmitting || Boolean(mensajeExito)}
            />
          </div>
        </section>

        <section className="card space-y-4 p-5 sm:p-6">
          <div>
            <h2 className="section-title">Términos y condiciones</h2>
            <p className="mt-1 text-sm text-muted">
              Tratamiento de datos personales y compromisos institucionales.
            </p>
          </div>
          <div className="h-56 overflow-y-auto rounded-lg border border-border bg-slate-50 p-4 text-sm leading-relaxed text-muted">
            <h3 className="font-semibold text-heading">
              1. Tratamiento de datos personales
            </h3>
            <p className="mt-1">
              Al continuar, el estudiante y/o su acudiente declaran conocer que
              los datos suministrados se utilizarán para gestionar el proceso
              académico y las comunicaciones relacionadas con la institución,
              de acuerdo con la política institucional de tratamiento de datos.
            </p>
            <h3 className="mt-4 font-semibold text-heading">
              2. Veracidad de la información
            </h3>
            <p className="mt-1">
              La persona responsable declara que la información y los
              documentos entregados para el registro son correctos y están
              actualizados.
            </p>
            <h3 className="mt-4 font-semibold text-heading">
              3. Compromisos institucionales
            </h3>
            <p className="mt-1">
              El estudiante y su acudiente se comprometen a conocer y respetar
              el manual de convivencia y las normas institucionales aplicables.
            </p>
          </div>

          <label className="flex items-start gap-3 rounded-lg border border-border bg-slate-50 p-4 text-sm text-heading">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(event) => setAcceptedTerms(event.target.checked)}
              className="mt-1 h-4 w-4 rounded border-border"
              required
              disabled={isSubmitting || Boolean(mensajeExito)}
            />
            <span>
              He leído y acepto los términos y condiciones y la política
              institucional de tratamiento de datos.
            </span>
          </label>
        </section>

        <fieldset
          className="card space-y-4 p-5 sm:p-6"
          disabled={isSubmitting || Boolean(mensajeExito)}
        >
          <legend className="section-title">
            Autorización de fotografías y videos
          </legend>
          <p className="text-sm text-muted">
            Indica si autorizas el uso de imágenes o videos del estudiante para
            actividades y comunicaciones institucionales.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {(
              [
                [true, "Sí, autorizo"],
                [false, "No autorizo"],
              ] as const
            ).map(([value, label]) => (
              <label
                key={label}
                className="flex items-center gap-3 rounded-lg border border-border p-4 text-sm font-medium text-heading"
              >
                <input
                  type="radio"
                  name="mediaPermission"
                  value={String(value)}
                  checked={mediaPermission === value}
                  onChange={() => setMediaPermission(value)}
                  required
                  className="h-4 w-4"
                />
                {label}
              </label>
            ))}
          </div>
        </fieldset>

        <section className="card space-y-4 p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="section-title">Firma digital</h2>
              <p className="mt-1 text-sm text-muted">
                Firma en el recuadro usando el ratón, el dedo o un lápiz
                táctil.
              </p>
            </div>
            <button
              type="button"
              onClick={clearCanvas}
              className="outline-btn text-xs"
              disabled={isSubmitting || Boolean(mensajeExito)}
            >
              Limpiar firma
            </button>
          </div>

          <div className="overflow-hidden rounded-xl border-2 border-dashed border-border bg-slate-50 p-2">
            <canvas
              ref={canvasRef}
              width={600}
              height={200}
              aria-label="Recuadro para realizar la firma digital"
              className="h-[200px] w-full touch-none cursor-crosshair rounded-lg bg-white"
              onPointerDown={startDrawing}
              onPointerMove={draw}
              onPointerUp={stopDrawing}
              onPointerCancel={stopDrawing}
            />
          </div>
          {!hasSignature && (
            <p className="text-xs text-muted">
              La firma es obligatoria para validar este formulario.
            </p>
          )}
        </section>

        <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => navigate("/estudiantes")}
            className="outline-btn"
            disabled={isSubmitting}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={
              !numeroDocumento.trim() ||
              !acceptedTerms ||
              mediaPermission === null ||
              !hasSignature ||
              isSubmitting ||
              Boolean(mensajeExito)
            }
            className="primary-btn disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "Registrando..." : "Aceptar y registrar estudiante"}
          </button>
        </div>
      </form>
    </div>
  );
}
