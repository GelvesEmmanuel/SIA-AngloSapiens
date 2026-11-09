import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useEstudiantes } from "../hooks/useEstudiantes";
import type {
  ContactoEstudiantePayload,
  PreRegistrarEstudiantePayload,
} from "../estudiantes.type";

type DatosEstudiante = Omit<
  PreRegistrarEstudiantePayload,
  | "contactos"
  | "profilePicture"
  | "identityDocument"
  | "disabilityCertificate"
>;

type ContactoFormulario = ContactoEstudiantePayload;

const contactoInicial: ContactoFormulario = {
  tipo: "ACUDIENTE_LEGAL",
  nombre: "",
  apellidos: "",
  tipoDocumento: "CC",
  numeroDocumento: "",
  telefono: "",
  direccion: "",
  ocupacion: "",
  parentesco: "",
};

const datosIniciales: DatosEstudiante = {
  tipoDocumento: "CC",
  numeroDocumento: "",
  nombre: "",
  apellidos: "",
  fechaNacimiento: "",
  telefono: "",
  gradoAcademico: "",
  institucionEducativa: "",
  reportaDiscapacidad: false,
};

export function RegistrarEstudiantePage() {
  const navigate = useNavigate();
  const { ejecutarPreRegistro, isCreating, mensajeExito, errorAccion } =
    useEstudiantes();
  const [datos, setDatos] = useState<DatosEstudiante>(datosIniciales);
  const [contactos, setContactos] = useState<ContactoFormulario[]>([
    { ...contactoInicial },
  ]);
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [identityDocument, setIdentityDocument] = useState<File | null>(null);
  const [disabilityCertificate, setDisabilityCertificate] =
    useState<File | null>(null);
  const [errorValidacion, setErrorValidacion] = useState("");
  const [codigoCreado, setCodigoCreado] = useState("");

  const actualizarContacto = <K extends keyof ContactoFormulario>(
    index: number,
    campo: K,
    valor: ContactoFormulario[K],
  ) => {
    setContactos((actuales) =>
      actuales.map((contacto, posicion) =>
        posicion === index ? { ...contacto, [campo]: valor } : contacto,
      ),
    );
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorValidacion("");

    if (!profilePicture || !identityDocument) {
      setErrorValidacion(
        "Debes adjuntar la foto de perfil y el documento de identidad.",
      );
      return;
    }

    const payload: PreRegistrarEstudiantePayload = {
      ...datos,
      contactos,
      profilePicture,
      identityDocument,
      ...(datos.reportaDiscapacidad && disabilityCertificate
        ? { disabilityCertificate }
        : {}),
    };

    try {
      const response = await ejecutarPreRegistro(payload);
      setCodigoCreado(response.data.codigo);
    } catch {
      // El hook expone el error del servidor mediante errorAccion.
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-6">
      <header className="flex flex-col justify-between gap-3 border-b border-border pb-4 sm:flex-row sm:items-center">
        <div>
          <p className="eyebrow mb-1">Academia</p>
          <h1 className="page-title">Pre-registrar estudiante</h1>
          <p className="mt-1 text-sm text-muted">
            Completa la información del estudiante, sus contactos y documentos.
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

      {errorValidacion && (
        <div role="alert" className="rounded-lg border border-error/25 bg-error-soft p-4">
          <p className="text-sm font-medium text-error">{errorValidacion}</p>
        </div>
      )}
      {errorAccion && (
        <div role="alert" className="rounded-lg border border-error/25 bg-error-soft p-4">
          <p className="text-sm font-medium text-error">{errorAccion}</p>
        </div>
      )}
      {mensajeExito && (
        <div role="status" className="rounded-lg border border-green/25 bg-green-soft p-4">
          <p className="text-sm font-medium text-green">{mensajeExito}</p>
          {codigoCreado && (
            <p className="mt-1 text-sm text-green">Código: {codigoCreado}</p>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="card space-y-4 p-5 sm:p-6">
          <div>
            <h2 className="section-title">Información personal</h2>
            <p className="mt-1 text-sm text-muted">
              Los campos marcados con * son obligatorios.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="tipoDocumento" className="field-label">
                Tipo de documento *
              </label>
              <select
                id="tipoDocumento"
                name="tipoDocumento"
                value={datos.tipoDocumento}
                onChange={(event) => {
                  const tipoDocumento = event.target.value;
                  if (
                    tipoDocumento === "CC" ||
                    tipoDocumento === "CE" ||
                    tipoDocumento === "TI" ||
                    tipoDocumento === "PAS"
                  ) {
                    setDatos((actuales) => ({
                      ...actuales,
                      tipoDocumento,
                    }));
                  }
                }}
                className="form-input"
                required
              >
                <option value="CC">Cédula de ciudadanía (CC)</option>
                <option value="CE">Cédula de extranjería (CE)</option>
                <option value="TI">Tarjeta de identidad (TI)</option>
                <option value="PAS">Pasaporte (PAS)</option>
              </select>
            </div>
            <div>
              <label htmlFor="numeroDocumento" className="field-label">
                Número de documento *
              </label>
              <input
                id="numeroDocumento"
                name="numeroDocumento"
                value={datos.numeroDocumento}
                onChange={(event) =>
                  setDatos((actuales) => ({
                    ...actuales,
                    numeroDocumento: event.target.value,
                  }))
                }
                className="form-input"
                minLength={5}
                required
              />
            </div>
            <div>
              <label htmlFor="nombre" className="field-label">Nombres *</label>
              <input
                id="nombre"
                name="nombre"
                value={datos.nombre}
                onChange={(event) =>
                  setDatos((actuales) => ({ ...actuales, nombre: event.target.value }))
                }
                className="form-input"
                minLength={2}
                required
              />
            </div>
            <div>
              <label htmlFor="apellidos" className="field-label">Apellidos *</label>
              <input
                id="apellidos"
                name="apellidos"
                value={datos.apellidos}
                onChange={(event) =>
                  setDatos((actuales) => ({ ...actuales, apellidos: event.target.value }))
                }
                className="form-input"
                minLength={2}
                required
              />
            </div>
            <div>
              <label htmlFor="fechaNacimiento" className="field-label">
                Fecha de nacimiento *
              </label>
              <input
                id="fechaNacimiento"
                name="fechaNacimiento"
                type="date"
                value={datos.fechaNacimiento}
                onChange={(event) =>
                  setDatos((actuales) => ({
                    ...actuales,
                    fechaNacimiento: event.target.value,
                  }))
                }
                className="form-input"
                required
              />
            </div>
            <div>
              <label htmlFor="telefono" className="field-label">Teléfono</label>
              <input
                id="telefono"
                name="telefono"
                type="tel"
                value={datos.telefono ?? ""}
                onChange={(event) =>
                  setDatos((actuales) => ({ ...actuales, telefono: event.target.value }))
                }
                className="form-input"
                maxLength={20}
              />
            </div>
            <div>
              <label htmlFor="gradoAcademico" className="field-label">
                Grado académico
              </label>
              <input
                id="gradoAcademico"
                name="gradoAcademico"
                value={datos.gradoAcademico ?? ""}
                onChange={(event) =>
                  setDatos((actuales) => ({
                    ...actuales,
                    gradoAcademico: event.target.value,
                  }))
                }
                className="form-input"
                maxLength={100}
              />
            </div>
            <div>
              <label htmlFor="institucionEducativa" className="field-label">
                Institución educativa
              </label>
              <input
                id="institucionEducativa"
                name="institucionEducativa"
                value={datos.institucionEducativa ?? ""}
                onChange={(event) =>
                  setDatos((actuales) => ({
                    ...actuales,
                    institucionEducativa: event.target.value,
                  }))
                }
                className="form-input"
                maxLength={150}
              />
            </div>
          </div>

          <label className="flex items-center gap-3 text-sm text-heading">
            <input
              type="checkbox"
              checked={datos.reportaDiscapacidad}
              onChange={(event) => {
                const reportaDiscapacidad = event.target.checked;
                setDatos((actuales) => ({ ...actuales, reportaDiscapacidad }));
                if (!reportaDiscapacidad) setDisabilityCertificate(null);
              }}
              className="h-4 w-4 rounded border-border"
            />
            El estudiante reporta discapacidad
          </label>
        </section>

        <section className="card space-y-4 p-5 sm:p-6">
          <div>
            <h2 className="section-title">Contactos y acudientes</h2>
            <p className="mt-1 text-sm text-muted">
              Registra al menos un contacto. El backend requiere nombre,
              apellidos, teléfono y parentesco.
            </p>
          </div>

          {contactos.map((contacto, index) => (
            <fieldset
              key={index}
              className="space-y-4 rounded-lg border border-border p-4"
            >
              <legend className="font-semibold text-heading">
                Contacto {index + 1}
              </legend>
              <div className="flex items-center justify-between gap-3">
                {contactos.length > 1 && (
                  <button
                    type="button"
                    onClick={() =>
                      setContactos((actuales) =>
                        actuales.filter((_, posicion) => posicion !== index),
                      )
                    }
                    className="text-sm font-medium text-error"
                  >
                    Quitar
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor={`contacto-tipo-${index}`} className="field-label">
                    Tipo de contacto *
                  </label>
                  <select
                    id={`contacto-tipo-${index}`}
                    value={contacto.tipo}
                    onChange={(event) =>
                      actualizarContacto(index, "tipo", event.target.value)
                    }
                    className="form-input"
                    required
                  >
                    <option value="ACUDIENTE_LEGAL">Acudiente legal</option>
                    <option value="EMERGENCIA">Contacto de emergencia</option>
                  </select>
                </div>
                <div>
                  <label htmlFor={`contacto-parentesco-${index}`} className="field-label">
                    Parentesco *
                  </label>
                  <input
                    id={`contacto-parentesco-${index}`}
                    value={contacto.parentesco}
                    onChange={(event) =>
                      actualizarContacto(index, "parentesco", event.target.value)
                    }
                    className="form-input"
                    minLength={2}
                    required
                  />
                </div>
                <div>
                  <label htmlFor={`contacto-nombre-${index}`} className="field-label">
                    Nombres *
                  </label>
                  <input
                    id={`contacto-nombre-${index}`}
                    value={contacto.nombre}
                    onChange={(event) =>
                      actualizarContacto(index, "nombre", event.target.value)
                    }
                    className="form-input"
                    minLength={2}
                    required
                  />
                </div>
                <div>
                  <label htmlFor={`contacto-apellidos-${index}`} className="field-label">
                    Apellidos *
                  </label>
                  <input
                    id={`contacto-apellidos-${index}`}
                    value={contacto.apellidos}
                    onChange={(event) =>
                      actualizarContacto(index, "apellidos", event.target.value)
                    }
                    className="form-input"
                    minLength={2}
                    required
                  />
                </div>
                <div>
                  <label htmlFor={`contacto-tipo-documento-${index}`} className="field-label">
                    Tipo de documento
                  </label>
                  <select
                    id={`contacto-tipo-documento-${index}`}
                    value={contacto.tipoDocumento ?? ""}
                    onChange={(event) =>
                      actualizarContacto(
                        index,
                        "tipoDocumento",
                        event.target.value || null,
                      )
                    }
                    className="form-input"
                  >
                    <option value="">No especificado</option>
                    <option value="CC">Cédula de ciudadanía (CC)</option>
                    <option value="CE">Cédula de extranjería (CE)</option>
                    <option value="TI">Tarjeta de identidad (TI)</option>
                    <option value="PAS">Pasaporte (PAS)</option>
                  </select>
                </div>
                <div>
                  <label htmlFor={`contacto-documento-${index}`} className="field-label">
                    Número de documento
                  </label>
                  <input
                    id={`contacto-documento-${index}`}
                    value={contacto.numeroDocumento ?? ""}
                    onChange={(event) =>
                      actualizarContacto(
                        index,
                        "numeroDocumento",
                        event.target.value || null,
                      )
                    }
                    className="form-input"
                  />
                </div>
                <div>
                  <label htmlFor={`contacto-telefono-${index}`} className="field-label">
                    Teléfono *
                  </label>
                  <input
                    id={`contacto-telefono-${index}`}
                    type="tel"
                    value={contacto.telefono}
                    onChange={(event) =>
                      actualizarContacto(index, "telefono", event.target.value)
                    }
                    className="form-input"
                    minLength={7}
                    required
                  />
                </div>
                <div>
                  <label htmlFor={`contacto-ocupacion-${index}`} className="field-label">
                    Ocupación
                  </label>
                  <input
                    id={`contacto-ocupacion-${index}`}
                    value={contacto.ocupacion ?? ""}
                    onChange={(event) =>
                      actualizarContacto(
                        index,
                        "ocupacion",
                        event.target.value || null,
                      )
                    }
                    className="form-input"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor={`contacto-direccion-${index}`} className="field-label">
                    Dirección
                  </label>
                  <input
                    id={`contacto-direccion-${index}`}
                    value={contacto.direccion ?? ""}
                    onChange={(event) =>
                      actualizarContacto(
                        index,
                        "direccion",
                        event.target.value || null,
                      )
                    }
                    className="form-input"
                  />
                </div>
              </div>
            </fieldset>
          ))}

          <button
            type="button"
            onClick={() =>
              setContactos((actuales) => [
                ...actuales,
                { ...contactoInicial, tipo: "EMERGENCIA" },
              ])
            }
            className="outline-btn"
          >
            + Agregar otro contacto
          </button>
        </section>

        <section className="card space-y-4 p-5 sm:p-6">
          <div>
            <h2 className="section-title">Documentos</h2>
            <p className="mt-1 text-sm text-muted">
              La foto de perfil y el documento de identidad son obligatorios.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="profilePicture" className="field-label">
                Foto de perfil *
              </label>
              <input
                id="profilePicture"
                type="file"
                accept="image/*"
                onChange={(event) =>
                  setProfilePicture(event.target.files?.[0] ?? null)
                }
                className="form-input"
                required
              />
            </div>
            <div>
              <label htmlFor="identityDocument" className="field-label">
                Documento de identidad *
              </label>
              <input
                id="identityDocument"
                type="file"
                accept="image/*,.pdf"
                onChange={(event) =>
                  setIdentityDocument(event.target.files?.[0] ?? null)
                }
                className="form-input"
                required
              />
            </div>
            {datos.reportaDiscapacidad && (
              <div>
                <label htmlFor="disabilityCertificate" className="field-label">
                  Certificado de discapacidad
                </label>
                <input
                  id="disabilityCertificate"
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(event) =>
                    setDisabilityCertificate(event.target.files?.[0] ?? null)
                  }
                  className="form-input"
                />
              </div>
            )}
          </div>
        </section>

        <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => navigate("/estudiantes")}
            className="outline-btn"
            disabled={isCreating}
          >
            Cancelar
          </button>
          <button type="submit" className="primary-btn" disabled={isCreating}>
            {isCreating ? "Guardando..." : "Pre-registrar estudiante"}
          </button>
        </div>
      </form>
    </div>
  );
}