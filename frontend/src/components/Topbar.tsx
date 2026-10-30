import { useLocation } from 'react-router-dom';
import { LogOut, ChevronRight } from 'lucide-react';

export const Topbar = () => {
  const location = useLocation();
  const username = localStorage.getItem('username') || 'Elena Martin';

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  // Traducción limpia de rutas para el breadcrumb visual
  const getBreadcrumbTitle = () => {
    if (location.pathname.includes('registrar-coordinador')) return 'Gestión de Coordinadores';
    if (location.pathname.includes('registrar-docente')) return 'Gestión de Docentes';
    return 'Panel General';
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 px-8 flex items-center justify-between select-none">
      
      {/* Migas de pan (Breadcrumb) */}
      <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
        <span>Anglosapiens</span>
        <ChevronRight className="w-3 h-3 text-gray-400" />
        <span className="text-gray-900 font-semibold">{getBreadcrumbTitle()}</span>
      </div>

      {/* Perfil y Botón Superior */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3 px-3 py-1.5 border border-gray-200 rounded-lg">
          <div className="w-7 h-7 bg-slate-800 text-white rounded-md flex items-center justify-center font-bold text-[10px]">
            {username.substring(0, 2).toUpperCase()}
          </div>
          <div className="text-left">
            <p className="text-xs font-bold text-gray-900 leading-none">{username}</p>
            <p className="text-[10px] text-gray-500 mt-0.5">Coord. administrativo</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3.5 py-2 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg text-xs font-semibold transition-colors shadow-sm"
        >
          <LogOut className="w-3.5 h-3.5 text-red-600" />
          <span>Cerrar sesión</span>
        </button>
      </div>

    </header>
  );
};