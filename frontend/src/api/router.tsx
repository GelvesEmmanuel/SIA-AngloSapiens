import { Navigate, Route, Routes } from "react-router-dom";

import { RequireAuth } from "./guards/RequireAuth";
import { GuestOnlyRoute } from "./guards/GuestOnlyRoute";

import LoginPage from "../features/auth/pages/LoginPage";
import ChangePasswordPage from "../features/auth/pages/CambiarContraseñapage";
import HomePage from "../features/home/HomePage";
import UsersPage from "../features/users/pages/UsersPage";
import { DashboardLayout } from "./layouts/DashboardLayout";

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
            <DashboardLayout />
          </RequireAuth>
        }
      >
        <Route index element={<UsersPage />} />
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
            <DashboardLayout />
          </RequireAuth>
        }
      >
        <Route index element={<HomePage />} />
      </Route>

      <Route path="*" element={<Navigate to="/inicio" replace />} />
    </Routes>
  );
}
