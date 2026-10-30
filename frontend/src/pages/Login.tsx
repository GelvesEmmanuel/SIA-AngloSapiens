import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../features/auth/auth.service';
import { Lock, User, AlertCircle, Loader2 } from 'lucide-react';

export const Login = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authService.login({ username, contrasena });
      
      if (response.exito) {
        const { token, usuario } = response.datos;

        // Guardamos las credenciales básicas en localStorage
        localStorage.setItem('token', token);
        localStorage.setItem('rol', usuario.rol);
        localStorage.setItem('username', usuario.username);

        // Validamos si requiere cambio obligatorio de contraseña (RQF-SEG-04)
        if (usuario.requiereCambioContrasena) {
          navigate('/cambiar-contrasena');
          return;
        }

        // Redirección basada en el rol del usuario
        if (usuario.rol === 'SUPER_ADMIN') {
          navigate('/admin/registrar-coordinador'); // O a su dashboard principal
        } else if (usuario.rol === 'COORDINADOR_ACADEMICO') {
          navigate('/coordinador/registrar-docente');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (err: any) {
      // Capturamos el mensaje de error que viene del backend Express
      setError(err.response?.data?.error || 'Ocurrió un error al iniciar sesión.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-slate-800 rounded-xl shadow-2xl p-8 border border-slate-700">
        
        {/* Cabecera */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white tracking-wide">SIA Académico</h1>
          <p className="text-sm text-slate-400 mt-2">Sistema de Información Académica</p>
        </div>

        {/* Mensaje de Error */}
        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-center gap-3 text-red-400 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Usuario
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <User className="w-5 h-5" />
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors text-sm"
                placeholder="Ingrese su usuario"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Contraseña
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-5 h-5" />
              </span>
              <input
                type="password"
                value={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors text-sm"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 text-sm shadow-lg shadow-indigo-600/20"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Iniciando sesión...</span>
              </>
            ) : (
              <span>Ingresar al Sistema</span>
            )}
          </button>
        </form>

      </div>
    </div>
  );
};