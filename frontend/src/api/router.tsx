import { Navigate, Route, Routes } from "react-router-dom";

import { RequireAuth } from "./guards/RequireAuth";
import { RequireRouteAccess } from "./guards/RequireRouteAccess";
import { RequirePermission } from "./guards/RequirePermission";
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
import { GestionGruposPage } from "../features/GestionGrupos/pages/GestionGruposPage";
import { RegistrarGrupoPage } from "../features/GestionGrupos/pages/RegistrarGrupoPage";
import { DetalleGrupoPage } from "../features/GestionGrupos/pages/DetalleGrupoPage";
import { GestionPeriodosPage } from "../features/GestionPeriodos/pages/GestionPeriodosPage";
import { GestionAulasPage } from "../features/GestionAulas/pages/GestionAulasPage";
import { GestionMatriculasPage } from "../features/GestionMatriculas/pages/GestionMatriculasPage";
import { RegistrarMatriculaPage } from "../features/GestionMatriculas/pages/RegistrarMatriculaPage";
import { DetalleMatriculaPage } from "../features/GestionMatriculas/pages/DetalleMatriculaPage";
import { GestionAcademicaLayout } from "../features/GestionAcademica/pages/GestionAcademicaLayout";
import { GestionAcademicaInicioPage } from "../features/GestionAcademica/pages/GestionAcademicaInicioPage";
import { FuncionalidadAcademicaPage } from "../features/GestionAcademica/pages/FuncionalidadAcademicaPage";
import { RegistroAsistenciaPage } from "../features/GestionAcademica/pages/RegistroAsistenciaPage";
import { HistorialAsistenciasGrupo } from "../features/GestionAcademica/pages/HistorialAsistenciasGrupo";
import { ConteoInasistenciasGrupoPage } from "../features/GestionAcademica/pages/ConteoInasistenciasGrupoPage";
import { RegistroNotasPage } from "../features/GestionAcademica/pages/RegistroNotasPage";
import { MisCalificacionesPage } from "../features/GestionAcademica/pages/MisCalificacionesPage";
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
        path="/grupos"
        element={
          <RequireAuth>
            <RequireRouteAccess>
              <DashboardLayout />
            </RequireRouteAccess>
          </RequireAuth>
        }
      >
        <Route index element={<GestionGruposPage />} />
        <Route path="registrar" element={<RegistrarGrupoPage />} />
        <Route path=":id" element={<DetalleGrupoPage />} />
      </Route>
      <Route
        path="/matriculas"
        element={
          <RequireAuth>
            <RequireRouteAccess>
              <DashboardLayout />
            </RequireRouteAccess>
          </RequireAuth>
        }
      >
        <Route index element={<GestionMatriculasPage />} />
        <Route path="registrar" element={<RegistrarMatriculaPage />} />
        <Route path=":id" element={<DetalleMatriculaPage />} />
      </Route>
      <Route
        path="/gestion-academica"
        element={
          <RequireAuth>
            <RequireRouteAccess>
              <DashboardLayout />
            </RequireRouteAccess>
          </RequireAuth>
        }
      >
        <Route element={<GestionAcademicaLayout />}>
          <Route index element={<GestionAcademicaInicioPage />} />
          <Route element={<RequirePermission permission="groups:read_students" />}>
            <Route
              path="grupos/:id"
              element={<DetalleGrupoPage returnPath="/gestion-academica" />}
            />
            <Route
              path="grupos/:id/historial-inasistencias"
              element={<HistorialAsistenciasGrupo />}
            />
            <Route
              path="grupos/:id/conteo-inasistencias"
              element={<ConteoInasistenciasGrupoPage />}
            />
          </Route>
          <Route
            path="calificaciones"
            element={<MisCalificacionesPage />}
          />
          <Route
            path="historial"
            element={
              <FuncionalidadAcademicaPage
                titulo="Historial académico"
                descripcion="Aquí podrás revisar el historial de cursos y periodos académicos completados."
              />
            }
          />
          <Route
            element={<RequirePermission permission="grades:create" />}
          >
            <Route path="notas" element={<RegistroNotasPage />} />
          </Route>
          <Route element={<RequirePermission permission="attendance:create" />}>
            <Route path="asistencias" element={<RegistroAsistenciaPage />} />
          </Route>
        </Route>
      </Route>
      <Route
        path="/periodos"
        element={
          <RequireAuth>
            <RequireRouteAccess>
              <DashboardLayout />
            </RequireRouteAccess>
          </RequireAuth>
        }
      >
        <Route index element={<GestionPeriodosPage />} />
      </Route>
      <Route
        path="/aulas"
        element={
          <RequireAuth>
            <RequireRouteAccess>
              <DashboardLayout />
            </RequireRouteAccess>
          </RequireAuth>
        }
      >
        <Route index element={<GestionAulasPage />} />
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
