# SIA AngloSapiens

Sistema académico para administrar usuarios, estudiantes, docentes, cursos, grupos, matrículas, asistencia y calificaciones.

## Tecnologías

- **Backend:** Node.js, Express, TypeScript, Drizzle ORM y PostgreSQL/Supabase.
- **Frontend:** React, TypeScript, Vite, Tailwind CSS y Axios.
- **Gestor de paquetes:** pnpm.

## Requisitos

- Node.js 22 o superior.
- pnpm 11 o superior.
- Una instancia de PostgreSQL o Supabase.

## Configuración

### Backend

Crear `anglo-api/.env` con:

```env
DATABASE_URL=postgresql://usuario:contraseña@host:puerto/base_de_datos
PORT=3000
JWT_SECRET=una_clave_segura
```

Instalar y ejecutar:

```powershell
cd anglo-api
pnpm install
pnpm dev
```

El backend queda disponible, de forma predeterminada, en `http://localhost:3000`.

### Frontend

Crear `frontend/.env` con:

```env
VITE_BACKEND_URL=http://localhost:3000
```

Instalar y ejecutar:

```powershell
cd frontend
pnpm install
pnpm dev
```

Abrir la URL que indique Vite, normalmente `http://localhost:5173`.

## Comandos disponibles

Desde `anglo-api/`:

```powershell
pnpm dev
pnpm build
pnpm start
```

Desde `frontend/`:

```powershell
pnpm dev
pnpm build
pnpm lint
pnpm preview
```

## Documentación

- [Arquitectura del sistema](Documentacion/arquitectura%20del%20sistema.md)
- [Estructura del proyecto](Documentacion/estructura-proyecto.txt)
- [Esquema de base de datos](Documentacion/BD_ANGLO.sql)