import { useState } from 'react';
import { coordinadorService } from '../../api/coordinador.service';
import type { RegistrarCoordinadorPayload } from '../../api/coordinador.service';
import { UserPlus, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export const RegistrarCoordinador = () => {
  const [formData, setFormData] = useState<RegistrarCoordinadorPayload>({
    primerNombre: '',
    segundoNombre: '',
    primerApellido: '',
    segundoApellido: '',
    documentoIdentidad: '',
    diaCumpleanos: 1,
    rol: 'COORD_ACADEMICO',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resultado, setResultado] = useState<any>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'diaCumpleanos' ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResultado(null);
    setLoading(true);

    try {
      const res = await coordinadorService.registrar(formData);
      if (res.exito) {
        setResultado(res.datos);
        // Reset del formulario
        setFormData({
          primerNombre: '',
          segundoNombre: '',
          primerApellido: '',
          segundoApellido: '',
          documentoIdentidad: '',
          diaCumpleanos: 1,
          rol: 'COORD_ACADEMICO',
        });
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ocurrió un error al registrar el coordinador.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-8 shadow-xl">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-700">
          <UserPlus className="w-8 h-8 text-indigo-400" />
          <div>
            <h1 className="text-xl font-bold text-white">Registrar Nuevo Coordinador</h1>
            <p className="text-sm text-slate-400">Acceso exclusivo para el Administrador General</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-center gap-3 text-red-400 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {resultado && (
          <div className="mb-6 bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-5 text-emerald-300">
            <div className="flex items-center gap-2 font-semibold mb-2 text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
              <span>¡Coordinador creado exitosamente!</span>
            </div>
            <div className="text-sm space-y-1 bg-slate-900/50 p-3 rounded-md border border-emerald-500/20 font-mono">
              <p><span className="text-slate-400">Usuario Generado:</span> <strong className="text-white">{resultado.username}</strong></p>
              <p><span className="text-slate-400">Rol:</span> {resultado.rol}</p>
              <p><span className="text-slate-400">Contraseña Temporal:</span> Número de documento ({formData.documentoIdentidad || 'Documento ingresado'})</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">Primer Nombre *</label>
              <input
                type="text"
                name="primerNombre"
                value={formData.primerNombre}
                onChange={handleChange}
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">Segundo Nombre</label>
              <input
                type="text"
                name="segundoNombre"
                value={formData.segundoNombre}
                onChange={handleChange}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">Primer Apellido *</label>
              <input
                type="text"
                name="primerApellido"
                value={formData.primerApellido}
                onChange={handleChange}
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">Segundo Apellido</label>
              <input
                type="text"
                name="segundoApellido"
                value={formData.segundoApellido}
                onChange={handleChange}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">N° Documento *</label>
              <input
                type="text"
                name="documentoIdentidad"
                value={formData.documentoIdentidad}
                onChange={handleChange}
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">Día Cumpleaños (1-31) *</label>
              <input
                type="number"
                min="1"
                max="31"
                name="diaCumpleanos"
                value={formData.diaCumpleanos}
                onChange={handleChange}
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">Tipo de Coordinador *</label>
              <select
                name="rol"
                value={formData.rol}
                onChange={handleChange}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:border-indigo-500"
              >
                <option value="COORD_ACADEMICO">Coordinador Académico</option>
                <option value="COORD_ADMINISTRATIVO">Coordinador Administrativo</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 text-sm shadow-lg shadow-indigo-600/20"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Registrar Coordinador</span>}
          </button>
        </form>
      </div>
    </div>
  );
};