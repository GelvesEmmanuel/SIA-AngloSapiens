import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export const DashboardLayout = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex overflow-hidden">
      
      {/* Sidebar fijo a la izquierda */}
      <Sidebar />

      {/* Contenedor derecho (Topbar + Contenido Dinámico) */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Topbar />
        
        {/* Área donde se inyectan las páginas de vistas protegidas */}
        <main className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </main>
      </div>

    </div>
  );
};