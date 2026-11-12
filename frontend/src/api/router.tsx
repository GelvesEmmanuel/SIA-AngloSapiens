import { Navigate, Route, Routes } from "react-router-dom";

import { RequireAuth } from "./guards/RequireAuth";
import { RequireRouteAccess } from "./guards/RequireRouteAccess";
import { GuestOnlyRoute } from "./guards/GuestOnlyRoute";

import LoginPage from "../features/auth/pages/LoginPage";
import ChangePasswordPage from "../features/auth/pages/CambiarContraseñapage";
import HomePage from "../features/home/HomePage";
import UsersPage from "../features/users/pages/UsersPage";
import { GestionDocentePage } from "../features/GestionDocentes/pages/GestionDocentePage";
import { RegistrarDocentePage } from "../features/GestionDocentes/pages/RegistroDOcentePage";
import { DashboardLayout } from "./layouts/DashboardLayout";
import DetalleDocentePage from "../features/GestionDocentes/pages/DetalleDocentePage";
import { GestionEstudiantesPage } from "../features/GestionEstudiantes/pages/GestionEstudiante";
import { RegistrarEstudiantePage } from "../features/GestionEstudiantes/pages/RegistrarEstudiante";
import { TermsAndSignaturePage } from "../features/GestionEstudiantes/pages/registrarEstudianteFirna";
import { DetalleEstudiantePage } from "../features/GestionEstudiantes/pages/DetalleEstudiantePage";
import { GestionCursosPage } from "../features/GestionCursos/pages/GestionCursosPage";
import { RegistrarCursoPage } from "../features/GestionCursos/pages/RegistrarCursoPage";
import { DetalleCursoPage } from "../features/GestionCursos/pages/DetalleCursoPage";
export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/inicio" replace />} />

      <Route
        path="/login"
        element={
          <GuestOnlyRoute>
            <LoginPage />
          </GuestOnlyRoute>
        }
      />
      <Route
        path="/usuarios"
        element={
          <RequireAuth>
            <RequireRouteAccess>
              <DashboardLayout />
            </RequireRouteAccess>
          </RequireAuth>
        }
      >
        <Route index element={<UsersPage />} />
      </Route>

      <Route
        path="/estudiantes"
        element={
          <RequireAuth>
            <RequireRouteAccess>
              <DashboardLayout />
            </RequireRouteAccess>
          </RequireAuth>
        }
      >
        <Route index element={<GestionEstudiantesPage />} />
      </Route>
      <Route
        path="/estudiantes/pre_registrar"
        element={
          <RequireAuth>
            <RequireRouteAccess>
              <DashboardLayout />
            </RequireRouteAccess>
          </RequireAuth>
        }
      >
        <Route index element={<RegistrarEstudiantePage />} />
      </Route>
      <Route
        path="/estudiantes/registrar"
        element={
          <RequireAuth>
            <RequireRouteAccess>
              <DashboardLayout />
            </RequireRouteAccess>
          </RequireAuth>
        }
      >
      <Route index element={<TermsAndSignaturePage />} />
      </Route>

      <Route
        path="/estudiantes/detalle"
        element={
          <RequireAuth>
            <RequireRouteAccess>
              <DashboardLayout />
            </RequireRouteAccess>
          </RequireAuth>
        }
      >
        <Route index element={<GestionEstudiantesPage />} />

        <Route path=":id" element={<DetalleEstudiantePage />} />
      </Route>

      <Route
        path="/docentes"
        element={
          <RequireAuth>
            <RequireRouteAccess>
              <DashboardLayout />
            </RequireRouteAccess>
          </RequireAuth>
        }
      >
        <Route index element={<GestionDocentePage />} />
      </Route>
      <Route
        path="/docentes/detalle"
        element={
          <RequireAuth>
            <RequireRouteAccess>
              <DashboardLayout />
            </RequireRouteAccess>
          </RequireAuth>
        }
      >
        <Route index element={<GestionDocentePage />} />

        <Route path=":id" element={<DetalleDocentePage />} />
      </Route>
      <Route
        path="/docentes/registrar"
        element={
          <RequireAuth>
            <RequireRouteAccess>
              <DashboardLayout />
            </RequireRouteAccess>
          </RequireAuth>
        }
      >
        <Route index element={<RegistrarDocentePage />} />
      </Route>
      <Route
        path="/cursos"
        element={
          <RequireAuth>
            <RequireRouteAccess>
              <DashboardLayout />
            </RequireRouteAccess>
          </RequireAuth>
        }
      >
        <Route index element={<GestionCursosPage />} />
        <Route path="registrar" element={<RegistrarCursoPage />} />
        <Route path=":id" element={<DetalleCursoPage />} />
      </Route>
      <Route
        path="/cambiar-contrasena"
        element={
          <RequireAuth allowPasswordChange>
            <ChangePasswordPage />
          </RequireAuth>
        }
      />

      <Route
        path="/inicio"
        element={
          <RequireAuth>
            <RequireRouteAccess>
              <DashboardLayout />
            </RequireRouteAccess>
          </RequireAuth>
        }
      >
        <Route index element={<HomePage />} />
      </Route>

      <Route path="*" element={<Navigate to="/inicio" replace />} />
    </Routes>
  );
}
