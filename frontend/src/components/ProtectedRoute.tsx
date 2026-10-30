import { Navigate, Outlet } from 'react-router-dom';

interface ProtectedRouteProps {
  allowedRoles?: string[];
}

export const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('rol');

  // 1. Si no hay token de autenticación, redirige al login inmediatamente
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // 2. Si se especificaron roles permitidos y el usuario no cuenta con ninguno de ellos, redirige
  if (allowedRoles && userRole && !allowedRoles.includes(userRole)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // 3. Si todo es correcto, permite el acceso renderizando las rutas hijas (<Outlet />)
  return <Outlet />;
};