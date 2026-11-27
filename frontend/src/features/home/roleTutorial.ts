// archivo para renderizar los tutoriales de cada rol , esto con el finqde que cada persona sepa un poco de como funciona el sistema 

import type { UserRole } from "../auth/auth.types"



export type TutorialStep = {
  title: string;
  description: string;
  contenido: string;
};

export type RoleTutorial = {
  label: string;
  description: string;
  tutorialTitle: string;
  tutorialIntro: string;
  tutorialSteps: TutorialStep[];
  recommendation: string;
  advertencia?: string;
};

export const roleTutorials: Record<UserRole, RoleTutorial> = {
  SUPER_ADMIN: {
    label: "Superadministrador",
    description:
      "Desde este perfil puedes supervisar la administración general, gestionar usuarios y consultar auditorías, además de acceder a las herramientas académicas disponibles.",

    tutorialTitle: "Guía de uso para el superadministrador",

    tutorialIntro:
      "Como Superadministrador, tienes acceso a las herramientas de administración, control de acceso y supervisión del SIA Académico. A continuación, encontrarás una guía detallada de cada módulo y su funcionamiento.",

    tutorialSteps: [
      {
        title: "1. Administración de usuarios y credenciales",
        description:
          "Gestiona las cuentas de acceso al sistema, registra coordinadores y administra los estados y contraseñas de los usuarios.",
        contenido:
          "Este módulo te permite crear cuentas de coordinación (COORD_ACADEMICO y COORD_ADMINISTRATIVO) y administrar el ciclo de vida de cualquier usuario del sistema. Puedes ACTIVAR o INACTIVAR cuentas: si inactivas a un usuario, se bloquea su inicio de sesión y se invalidan sus sesiones activas mediante la versión de token. También puedes restablecer la contraseña cuando un usuario la olvide, regresándola a su clave temporal (el documento de identidad) y ajustando la exigencia de cambio de contraseña según corresponda.",
      },
      {
        title: "2. Supervisión académica y administrativa",
        description:
          "Consulta y supervisa la información de estudiantes, docentes, cursos, grupos, matrículas, períodos académicos y aulas de clase.",
        contenido:
          "Este módulo te ofrece visibilidad transversal sobre las entidades del sistema para registrar, consultar, actualizar o cambiar estados cuando sea necesario, manteniendo coherencia entre los módulos académicos y administrativos.",
      },
      {
        title: "3. Auditoría del sistema",
        description:
          "Consulta los registros de auditoría para rastrear las operaciones realizadas en el sistema y quién las ejecutó.",
        contenido:
          "Este módulo permite auditar las acciones críticas registradas en el sistema (como creaciones, actualizaciones o eliminaciones). Puedes filtrar por tabla afectada para revisar las operaciones ejecutadas y ver el ID del usuario responsable, brindando trazabilidad completa ante cualquier cambio o incidencia.",
      },
      {
        title: "4. Gestión general",
        description:
          "Utiliza los módulos habilitados para supervisar el funcionamiento general de la academia.",
        contenido:
          "Desde este espacio puedes verificar el estado operativo de los módulos y asegurar que los flujos administrativos y académicos se cumplan conforme a las reglas del sistema.",
      },
    ],

    recommendation:
      "Verifica periódicamente la actividad de los usuarios, revisa los registros de auditoría cuando haya cambios sensibles y mantén actualizada la información administrativa.",
    advertencia:
      "Evita realizar operaciones de gestión administrativa y académica si no es estrictamente necesario; para ello ya existen los coordinadores encargados directamente de esas áreas.",
  },

  COORD_ACADEMICO: {
    label: "Coordinación académica",
    description:
      "Desde este perfil puedes gestionar cursos y habilidades, períodos académicos, aulas y grupos, y consultar el historial académico de los estudiantes.",

    tutorialTitle: "Guía de uso para coordinación académica",

    tutorialIntro:
      "Este perfil está orientado a estructurar la oferta formativa, administrar los espacios y grupos de clase y hacer seguimiento al historial académico de los estudiantes.",

    tutorialSteps: [
      {
        title: "1. Gestión de cursos y habilidades (70 %)",
        description:
          "Crea cursos, define las habilidades evaluables y administra su información y estado.",
        contenido:
          "En este módulo puedes crear un curso y añadir las habilidades que se calificarán en él, teniendo en cuenta que el conjunto de habilidades corresponde al 70 % de la calificación final. Además, puedes editar los datos de los cursos existentes y cambiar su estado entre activo e inactivo según la oferta vigente.",
      },
      {
        title: "2. Gestión de períodos académicos y aulas",
        description:
          "Administra los períodos académicos y crea las aulas necesarias para el desarrollo de las clases.",
        contenido:
          "Aquí puedes gestionar y editar los períodos académicos, cambiar su estado conforme avance el calendario institucional y crear las aulas que luego se asignarán a los grupos de estudio.",
      },
      {
        title: "3. Gestión de grupos (instancia real del curso)",
        description:
          "Crea y administra los grupos reales de cada curso con su docente, período, aula, horario y estado.",
        contenido:
          "El grupo es la instancia real del curso. Al crearlo debes añadir o asignar el docente, elegir el período académico, seleccionar el curso al que pertenece, definir la capacidad del aula, los días de clase y el horario. Durante su operación, puedes cambiar al docente del grupo si se requiere y actualizar sus estados entre PROGRAMADO, EN_CURSO y FINALIZADO.",
      },
      {
        title: "4. Consulta de historial académico",
        description:
          "Revisa el historial académico de los estudiantes para dar seguimiento a su trayectoria.",
        contenido:
          "Este módulo te permite consultar el historial académico de los estudiantes, verificando sus registros, cursos cursados y desempeño dentro de la academia.",
      },
    ],

    recommendation:
      "Define primero los períodos académicos, aulas y cursos con sus habilidades al 70 % antes de crear los grupos, y actualiza el estado de los grupos (PROGRAMADO, EN_CURSO, FINALIZADO) según corresponda.",
  },

  COORD_ADMINISTRATIVO: {
    label: "Coordinación administrativa",
    description:
      "Desde este perfil puedes gestionar el prerregistro y registro de estudiantes, el módulo de docentes y las matrículas en grupos activos.",

    tutorialTitle: "Guía de uso para coordinación administrativa",

    tutorialIntro:
      "Este perfil gestiona la vinculación administrativa de estudiantes y docentes, así como la matrícula formal en grupos con cupos disponibles.",

    tutorialSteps: [
      {
        title: "1. Prerregistro y registro de estudiantes",
        description:
          "Prerregistra estudiantes con sus datos y documentos, y formaliza su registro con términos y firma digital.",
        contenido:
          "Primero puedes prerregistrar a un estudiante registrando sus datos y adjuntando sus documentos. Luego, cuando se aceptan los términos y condiciones y se digita la firma digitalmente, se realiza el registro oficial: en ese momento el sistema indica que se creó el usuario del estudiante y que su clave inicial es su documento de identidad. También puedes editar los datos del estudiante, ver sus documentos y cambiar su estado.",
      },
      {
        title: "2. Módulo de docentes",
        description:
          "Registra docentes con sus datos y documentos, edita su información, cambia su estado y consúltalos.",
        contenido:
          "En este módulo puedes registrar un docente escribiendo sus datos y cargando sus documentos, editar su información cuando sea necesario, cambiar su estado activándolo o inactivándolo, y consultar el listado de docentes registrados.",
      },
      {
        title: "3. Módulo de matrículas",
        description:
          "Crea matrículas en grupos activos con cupos, registra información de pago informativa, cambia estados y cambia de grupo.",
        contenido:
          "Aquí creas una matrícula realizando el registro oficial del estudiante a un grupo que se encuentre activo y con cupos disponibles, digitando además información de pago de carácter informativo. Puedes cambiar los estados de las matrículas aplicando las validaciones pertinentes del sistema y cambiar al estudiante de grupo si es necesario.",
      },
    ],

    recommendation:
      "Verifica que los documentos y datos estén completos antes de confirmar el registro oficial del estudiante, y revisa la disponibilidad de cupos y estados del grupo al crear o modificar matrículas.",
  },

  DOCENTE: {
    label: "Docente",
    description:
      "Desde tu módulo de gestión académica puedes consultar tus grupos activos y estudiantes, registrar asistencias e inasistencias, y calcular y publicar notas finales.",

    tutorialTitle: "Guía de uso para docentes",

    tutorialIntro:
      "Como docente, cuentas con el módulo de Gestión Académica para operar tus grupos activos, llevar el control de asistencia y gestionar las calificaciones de tus estudiantes.",

    tutorialSteps: [
      {
        title: "1. Grupos activos y estudiantes del grupo",
        description:
          "Consulta los grupos activos que tienes asignados y revisa los estudiantes que pertenecen a cada grupo.",
        contenido:
          "Dentro de Gestión Académica puedes consultar los grupos activos que tienes a cargo y ver el listado de estudiantes de cada grupo para organizar tus clases y seguimientos.",
      },
      {
        title: "2. Registro y consulta de asistencias e inasistencias",
        description:
          "Guarda primero la sesión de clase, marca únicamente a quien no asistió con motivo opcional y consulta inasistencias.",
        contenido:
          "Para registrar asistencias, primero debes guardar la sesión de clase y luego marcar únicamente al estudiante que no asistió, colocando el motivo de forma opcional. Además, puedes consultar las inasistencias totales por grupo y por estudiante.",
      },
      {
        title: "3. Registro, cálculo y publicación de notas finales",
        description:
          "Registra y guarda notas de habilidades (70 %) y examen final (30 %), calcula la nota final y publícala al estudiante.",
        contenido:
          "Primero registras las notas que equivalen al 70 % (habilidades) y las vas guardando; luego registras la nota del examen final, la guardas y puedes calcular la nota final, que equivale al 70 % de las habilidades más el 30 % del examen. Finalmente, el docente puede dar en publicar la nota al estudiante para que este pueda verla desde su perfil.",
      },
    ],

    recommendation:
      "Guarda cada sesión de clase al finalizarla, marca solo las inasistencias con su motivo opcional y publica las notas únicamente cuando hayas verificado el cálculo del 70 % de habilidades y 30 % de examen final.",
  },

  ESTUDIANTE: {
    label: "Estudiante",
    description:
      "Desde este perfil puedes consultar el curso y grupo en el que estás matriculado, ver tus notas solo si el docente las publicó y revisar tu historial académico.",

    tutorialTitle: "Guía de uso para estudiantes",

    tutorialIntro:
      "Bienvenido al SIA Académico. Desde tu perfil puedes consultar tu matrícula actual, las calificaciones publicadas por tus docentes y todo tu historial académico.",

    tutorialSteps: [
      {
        title: "1. Curso y grupo matriculado",
        description:
          "Consulta el curso y el grupo al cual te encuentras matriculado.",
        contenido:
          "En esta sección puedes ver el curso y el grupo en el que estás matriculado actualmente, junto con la información asociada a tu inscripción.",
      },
      {
        title: "2. Consulta de notas publicadas",
        description:
          "Visualiza tus calificaciones únicamente cuando el docente las haya publicado.",
        contenido:
          "Puedes ver tus notas solo si el docente las publicó desde el módulo docente. Si aún no han sido publicadas, no estarán disponibles para tu consulta.",
      },
      {
        title: "3. Historial académico",
        description:
          "Revisa tu historial académico completo con todas las matrículas y períodos en los que has estado registrado.",
        contenido:
          "En tu historial académico puedes consultar todas las matrículas y períodos académicos en los cuales has estado registrado, permitiéndote ver tu recorrido completo en el sistema.",
      },
    ],

    recommendation:
      "Revisa periódicamente tu perfil para consultar las notas que tus docentes vayan publicando y verificar tus matrículas e historial académico.",
  },
};