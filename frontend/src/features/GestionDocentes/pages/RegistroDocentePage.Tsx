import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDocentes } from "../hooks/useDocents"; // Ajusta la ruta a tu hook
export function RegistrarDocentePage() {
  const navigate = useNavigate();
  const { ejecutarCrearDocente, isCreating, errorAccion } = useDocentes();
    // erorores del backend 
    // Estado para la tarjeta de éxito personalizada con las credenciales
  const [docenteCreadoExito, setDocenteCreadoExito] = useState<{
    nombre: string;
    numeroDocumento: string;
  } | null>(null);
  // Control de pasos: 1 = Datos Personales, 2 = Documentos y Archivos
  const [pasoActual, setPasoActual] = useState(1);

  // Estado para los datos de texto
  const [formData, setFormData] = useState({
    tipoDocumento: "CC",
    numeroDocumento: "",
    nombre: "",
    apellidos: "",
    fechaNacimiento: "", 
    correo: "",          
    telefono: "",
    formacionAcademica: "",
    experienciaLaboral: "", 
    reportaDiscapacidad: false,
  });

  // Estado para los archivos (usando las llaves exactas que espera tu Multer)
  const [archivos, setArchivos] = useState({
    profilePicture: null,
    identityDocument: null,
    cv: null,
    disabilityCertificate: null,
  });

  const [errorValidacion, setErrorValidacion] = useState("");

  
  // Manejador de cambios para inputs de texto
  const handleChangeText = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    
    // Verificamos si es un input tipo checkbox para usar 'checked' en lugar de 'value'
    const checked = type === "checkbox" ? (e.target as HTMLInputElement).checked : undefined;

    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };
  // Manejador para la selección de archivos
 const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    fieldName: keyof typeof archivos
  ) => {
    const file = e.target.files?.[0] || null;
    setArchivos({
      ...archivos,
      [fieldName]: file,
    });
  };

  // Validar y avanzar al paso 2
 const handleIrAPaso2 = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorValidacion("");

    // Validamos únicamente los campos verdaderamente obligatorios
    if (!formData.nombre || !formData.apellidos || !formData.numeroDocumento || !formData.fechaNacimiento) {
      setErrorValidacion("Por favor completa los campos obligatorios: Nombre, Apellidos, Número de Documento y Fecha de Nacimiento.");
      return;
    }

    setPasoActual(2);
  };

  // Envío final del formulario completo (FormData unificado)
  const handleSubmitRegistro = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorValidacion("");
    

    const dataForm = new FormData();

    // Añadimos los campos de texto
    Object.entries(formData).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        dataForm.append(key, String(value));
      }
    });

    // Añadimos los archivos si fueron seleccionados
    if (archivos.profilePicture) dataForm.append("profilePicture", archivos.profilePicture);
    if (archivos.identityDocument) dataForm.append("identityDocument", archivos.identityDocument);
    if (archivos.cv) dataForm.append("cv", archivos.cv);
    if (archivos.disabilityCertificate && formData.reportaDiscapacidad) {
      dataForm.append("disabilityCertificate", archivos.disabilityCertificate);
    }

    try {
      const resultado = await ejecutarCrearDocente(dataForm);

      if (resultado.success === true) {
        setDocenteCreadoExito({
          nombre: `${formData.nombre} ${formData.apellidos}`,
          numeroDocumento: formData.numeroDocumento,
        });

        setTimeout(() => {
          navigate("/docentes");
        }, 7000);
      }
    } catch {
      // El hook guarda y expone el mensaje del backend mediante errorAccion.
    }
  };

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 p-4 sm:p-6">
      {/* Encabezado */}
      <header className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <p className="eyebrow mb-1">Academia</p>
          <h1 className="page-title">Registrar Nuevo Docente</h1>
          <p className="text-sm text-muted">
            Paso {pasoActual} de 2: {pasoActual === 1 ? "Información personal y de contacto" : "Carga de soportes y documentos"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate("/docentes")}
          className="outline-btn text-xs"
        >
          ← Cancelar y Volver
        </button>
      </header>

      {/* Alerta de validaciones locales del cliente */}
      {errorValidacion && (
        <div className="rounded-lg border border-error/25 bg-error-soft p-4 mb-4">
          <p className="text-sm font-medium text-error">{errorValidacion}</p>
        </div>
      )}

      {/* Alerta específica para errores que devuelve el Backend */}
      {errorAccion && (
        <div className="my-4 rounded-lg border border-red-500/50 bg-red-50 p-4 text-red-700 shadow-sm">
          <p className="text-sm font-bold">⚠️ Atención del Servidor:</p>
          <p className="text-sm">{errorAccion}</p>
        </div>
      )}
      {/* Contenedor del Formulario */}
      <div className="card p-6 sm:p-8">
        {pasoActual === 1 ? (
          /* ========================================== */
          /* PASO 1: DATOS PERSONALES                   */
          /* ========================================== */
          <form onSubmit={handleIrAPaso2} className="space-y-4">
            <h3 className="text-base font-semibold text-heading mb-4">1. Datos Personales y de Identificación</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="field-label">Tipo de Documento</label>
                <select
                  name="tipoDocumento"
                  value={formData.tipoDocumento}
                  onChange={handleChangeText}
                  className="form-input"
                  required
                >
                  <option value="CC">Cédula de Ciudadanía (CC)</option>
                  <option value="CE">Cédula de Extranjería (CE)</option>
                  <option value="TI">Tarjeta de Identidad (TI)</option>
                  <option value="PAS">Pasaporte (PAS)</option>
                </select>
              </div>

              <div>
                <label className="field-label">Número de Documento *</label>
                <input
                  type="text"
                  name="numeroDocumento"
                  value={formData.numeroDocumento}
                  onChange={handleChangeText}
                  placeholder="Ej. 1090234567"
                  className="form-input"
                  required
                />
              </div>

              <div>
                <label className="field-label">Nombres *</label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChangeText}
                  placeholder="Ej. Carlos Andrés"
                  className="form-input"
                  required
                />
              </div>

              <div>
                <label className="field-label">Apellidos *</label>
                <input
                  type="text"
                  name="apellidos"
                  value={formData.apellidos}
                  onChange={handleChangeText}
                  placeholder="Ej. Pérez Rojas"
                  className="form-input"
                  required
                />
              </div>

              <div>
                <label className="field-label">Fecha de Nacimiento *</label>
                <input
                  type="date"
                  name="fechaNacimiento"
                  value={formData.fechaNacimiento}
                  onChange={handleChangeText}
                  className="form-input"
                  required
                />
              </div>

              <div>
                <label className="field-label">Correo Electrónico (Opcional)</label>
                <input
                  type="email"
                  name="correo"
                  value={formData.correo}
                  onChange={handleChangeText}
                  placeholder="docente@anglosapiens.edu"
                  className="form-input"
                />
              </div>

              <div>
                <label className="field-label">Teléfono / Celular</label>
                <input
                  type="text"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleChangeText}
                  placeholder="3001234567"
                  className="form-input"
                />
              </div>
            </div>

            <div className="pt-2">
              <label className="field-label">Formación Académica / Títulos</label>
              <input
                type="text"
                name="formacionAcademica"
                value={formData.formacionAcademica}
                onChange={handleChangeText}
                placeholder="Ej. Licenciado en Lenguas Extranjeras, Maestría en Educación"
                className="form-input"
              />
            </div>

            <div className="pt-2">
              <label className="field-label">Experiencia Laboral</label>
              <textarea
                name="experienciaLaboral"
                value={formData.experienciaLaboral}
                onChange={handleChangeText}
                placeholder="Breve descripción de la trayectoria o experiencia docente..."
                className="form-input"
                rows={3}
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="reportaDiscapacidad"
                name="reportaDiscapacidad"
                checked={formData.reportaDiscapacidad}
                onChange={handleChangeText}
                className="h-4 w-4 rounded border-border text-navy focus:ring-navy"
              />
              <label htmlFor="reportaDiscapacidad" className="text-sm font-medium text-body cursor-pointer">
                El docente reporta alguna condición de discapacidad
              </label>
            </div>

            <div className="flex justify-end pt-4 border-t border-border">
              <button type="submit" className="primary-btn">
                Siguiente: Adjuntar Soportes →
              </button>
            </div>
          </form>
        ) : (
          /* ========================================== */
          /* PASO 2: DOCUMENTOS Y ARCHIVOS              */
          /* ========================================== */
          <form onSubmit={handleSubmitRegistro} className="space-y-6">
            <h3 className="text-base font-semibold text-heading mb-4">2. Carga de Documentos y Soportes (PDF / Imagen)</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="card p-4 space-y-2 border border-border">
                <label className="field-label font-bold">Foto de Perfil</label>
                <p className="text-xs text-muted">Imagen reciente del docente (PNG o JPG).</p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, "profilePicture")}
                  className="form-input text-xs py-2"
                />
              </div>

              <div className="card p-4 space-y-2 border border-border">
                <label className="field-label font-bold">Documento de Identidad (Cédula)</label>
                <p className="text-xs text-muted">Cédula escaneada por ambas caras (PDF o Imagen).</p>
                <input
                  type="file"
                  accept=".pdf,image/*"
                  onChange={(e) => handleFileChange(e, "identityDocument")}
                  className="form-input text-xs py-2"
                />
              </div>

              <div className="card p-4 space-y-2 border border-border">
                <label className="field-label font-bold">Hoja de Vida (CV)</label>
                <p className="text-xs text-muted">Hoja de vida actualizada en formato PDF.</p>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => handleFileChange(e, "cv")}
                  className="form-input text-xs py-2"
                />
              </div>

              {formData.reportaDiscapacidad && (
                <div className="card p-4 space-y-2 border border-border bg-amber-50/30">
                  <label className="field-label font-bold text-amber-800">Certificado de Discapacidad</label>
                  <p className="text-xs text-muted">Soporte médico oficial emitido por entidad competente.</p>
                  <input
                    type="file"
                    accept=".pdf,image/*"
                    onChange={(e) => handleFileChange(e, "disabilityCertificate")}
                    className="form-input text-xs py-2"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-between pt-4 border-t border-border">
              <button
                type="button"
                onClick={() => setPasoActual(1)}
                className="outline-btn"
                disabled={isCreating}
              >
                ← Volver a Datos
              </button>

              <button
                type="submit"
                disabled={isCreating}
                className="primary-btn"
              >
                {isCreating ? "Registrando Docente..." : "✅ Finalizar y Guardar Docente"}
              </button>
            </div>
          </form>
        )}
      </div>
{/* 🚀 MODAL / TARJETA DE ÉXITO CON CREDENCIALES TEMPORALES */}
      {docenteCreadoExito && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="card max-w-md w-full p-6 space-y-4 bg-white shadow-2xl border border-emerald-500/30">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 text-xl font-bold">
                ✓
              </div>
              <div>
                <h3 className="text-lg font-bold text-heading">¡Docente Registrado con Éxito!</h3>
                <p className="text-xs text-muted">El expediente digital y las credenciales han sido generadas.</p>
              </div>
            </div>

            <div className="rounded-lg bg-surface-alt p-4 space-y-2 border border-border">
              <p className="text-xs text-muted uppercase tracking-wider font-semibold">Credenciales de Acceso Provisional:</p>
              <p className="text-sm text-body"><strong>Docente:</strong> {docenteCreadoExito.nombre}</p>
              <p className="text-sm text-body"><strong>Usuario / Cédula:</strong> {docenteCreadoExito.numeroDocumento}</p>
              <div className="rounded bg-emerald-50 p-2 border border-emerald-200">
                <p className="text-xs text-emerald-800 font-medium">
                  🔑 <strong>Contraseña Temporal:</strong> Su número de documento (<span className="font-mono font-bold">{docenteCreadoExito.numeroDocumento}</span>).
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => navigate("/docentes")}
                className="primary-btn text-xs w-full py-2.5"
              >
                Ir al Listado de Docentes Ahora
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}