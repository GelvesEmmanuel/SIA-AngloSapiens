import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Users, GraduationCap, LogOut } from 'lucide-react';

export const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const rol = localStorage.getItem('rol') || 'COORDINADOR_ADMINISTRATIVO';
  const username = localStorage.getItem('username') || 'Elena Martin';

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <aside className="w-72 bg-white border-r border-gray-200 flex flex-col justify-between h-screen select-none">
      
      {/* SECCIÓN SUPERIOR: Logo y Perfil Activo */}
      <div>
        {/* Logo / Marca */}
        <div className="p-5 border-b border-gray-100 flex items-center gap-3">
          <div className="w-9 h-9 bg-red-600 text-white font-bold rounded flex items-center justify-center text-lg">
            A
          </div>
          <div>
            <h1 className="font-bold text-gray-900 leading-tight">Anglosapiens</h1>
            <p className="text-[10px] text-gray-400 tracking-wider uppercase font-semibold">English Academy</p>
          </div>
        </div>

        {/* Tarjeta de Perfil Activo */}
        <div className="m-4 p-3.5 bg-slate-900 text-white rounded-lg shadow-sm">
          <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Perfil Activo</p>
          <p className="text-sm font-semibold mt-1">
            {rol === 'SUPER_ADMIN' ? 'Super Administrador' : rol.replace('_', ' ')}
          </p>
        </div>

        {/* Menú de Navegación */}
        <div className="px-4 py-2">
          <p className="text-[11px] uppercase tracking-wider text-gray-400 font-bold mb-2 px-3">Navegación</p>
          <nav className="space-y-1">
            <button
              onClick={() => navigate('/admin/dashboard')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                location.pathname.includes('/dashboard') 
                  ? 'bg-gray-100 text-gray-900 font-semibold' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Home className="w-4 h-4 text-gray-500" />
              <span>Resumen</span>
            </button>

            {rol === 'SUPER_ADMIN' && (
              <button
                onClick={() => navigate('/admin/registrar-coordinador')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname.includes('/registrar-coordinador') 
                    ? 'bg-gray-100 text-gray-900 font-semibold' 
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Users className="w-4 h-4 text-gray-500" />
                <span>Registrar Coordinador</span>
              </button>
            )}

            {(rol === 'COORDINADOR_ACADEMICO' || rol === 'SUPER_ADMIN') && (
              <button
                onClick={() => navigate('/coordinador/registrar-docente')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname.includes('/registrar-docente') 
                    ? 'bg-gray-100 text-gray-900 font-semibold' 
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <GraduationCap className="w-4 h-4 text-gray-500" />
                <span>Gestión de Docentes</span>
              </button>
            )}
          </nav>
        </div>
      </div>

      {/* SECCIÓN INFERIOR: Usuario y Botón de Salida (como en el boceto) */}
      <div className="p-4 border-t border-gray-200 flex items-center justify-between bg-gray-50/50">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-9 h-9 bg-slate-800 text-white rounded-lg flex items-center justify-center font-bold text-xs shrink-0">
            {username.substring(0, 2).toUpperCase()}
          </div>
          <div className="truncate">
            <p className="text-xs font-bold text-gray-900 truncate">{username}</p>
            <p className="text-[10px] text-gray-500 truncate">Coord. administrativo</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          title="Cerrar sesión"
          className="p-2 border border-gray-200 rounded-lg hover:bg-white text-gray-600 transition-colors shadow-sm"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>

    </aside>
  );
};