// archivo para renderizar lso tutoriales d ecada rol , esto con el finqde que cada persoan sepa un poco de como funciona el sistema 

import type { UserRole } from "../auth/auth.types"

type TutorialStep = {
  title: string;
  description: string;
};

type RoleTutorial = {
  label: string;
  description: string;
  tutorialTitle: string;
  tutorialIntro: string;
  tutorialSteps: TutorialStep[];
  recommendation: string;
};

export const roleTutorials: Record<UserRole, RoleTutorial> = {
  SUPER_ADMIN: {
    label: "Superadministrador",
    description:
      "Desde este perfil puedes supervisar la administración general, gestionar usuarios y consultar auditorías, además de acceder a las herramientas académicas disponibles.",

    tutorialTitle: "Guía de uso para el superadministrador",

    tutorialIntro:
      "Como superadministrador, tienes acceso a las herramientas de administración y supervisión del SIA Académico. A continuación, encontrarás una guía para orientarte en el sistema.",

    tutorialSteps: [
      {
        title: "1. Administración de usuarios",
        description:
          "Gestiona las cuentas de acceso al sistema, registra coordinadores y administra los usuarios según las opciones disponibles."
      },
      {
        title: "2. Supervisión académica",
        description:
          "Consulta la información relacionada con estudiantes, docentes, cursos, grupos y matrículas."
      },
      {
        title: "3. Auditoría del sistema",
        description:
          "Consulta los registros de auditoría para realizar seguimiento a las operaciones efectuadas por los usuarios."
      },
      {
        title: "4. Gestión general",
        description:
          "Utiliza los módulos habilitados para supervisar el funcionamiento administrativo y académico de la academia."
      }
    ],

    recommendation:
      "Verifica periódicamente la actividad de los usuarios y mantén actualizada la información administrativa."
  },

  COORD_ACADEMICO: {
    label: "Coordinación académica",
    description:
      "Desde este perfil puedes organizar cursos, grupos y periodos, y dar seguimiento a estudiantes, docentes y actividades académicas.",

    tutorialTitle: "Guía de uso para coordinación académica",

    tutorialIntro:
      "Este perfil está orientado a la organización y seguimiento de los procesos académicos de la academia.",

    tutorialSteps: [
      {
        title: "1. Gestión de cursos",
        description:
          "Consulta y administra los cursos disponibles dentro de la oferta académica de la institución."
      },
      {
        title: "2. Creación de grupos",
        description:
          "Organiza los grupos asociados a los cursos, definiendo su información y características correspondientes."
      },
      {
        title: "3. Asignación de docentes",
        description:
          "Asigna los docentes responsables de orientar los grupos académicos."
      },
      {
        title: "4. Seguimiento académico",
        description:
          "Realiza seguimiento a los grupos, estudiantes y resultados académicos."
      }
    ],

    recommendation:
      "Mantén organizada la información de los cursos y grupos para facilitar el seguimiento de las actividades académicas."
  },

  COORD_ADMINISTRATIVO: {
    label: "Coordinación administrativa",
    description:
      "Desde este perfil puedes apoyar la gestión de estudiantes, docentes, matrículas y aulas, y consultar la información académica habilitada.",

    tutorialTitle: "Guía de uso para coordinación administrativa",

    tutorialIntro:
      "Este perfil permite apoyar los procesos administrativos relacionados con la gestión de personas y matrículas.",

    tutorialSteps: [
      {
        title: "1. Registro de estudiantes",
        description:
          "Registra nuevos estudiantes y administra su información personal dentro del sistema."
      },
      {
        title: "2. Registro de docentes",
        description:
          "Registra los docentes y completa la información requerida para su vinculación."
      },
      {
        title: "3. Gestión de matrículas",
        description:
          "Realiza los procesos de matrícula para vincular estudiantes con los grupos disponibles."
      },
      {
        title: "4. Consulta de información",
        description:
          "Consulta los datos administrativos y académicos habilitados para tu perfil."
      }
    ],

    recommendation:
      "Verifica cuidadosamente los datos de estudiantes y docentes antes de completar cada registro."
  },

  DOCENTE: {
    label: "Docente",
    description:
      "Desde este perfil puedes consultar tus grupos y acompañar el progreso de tus estudiantes mediante el registro y seguimiento de asistencias y calificaciones.",

    tutorialTitle: "Guía de uso para docentes",

    tutorialIntro:
      "Como docente, tu función principal es realizar el seguimiento académico de los estudiantes pertenecientes a los grupos que tienes asignados.",

    tutorialSteps: [
      {
        title: "1. Consulta de grupos",
        description:
          "Ingresa al módulo de grupos para consultar los grupos académicos que tienes asignados."
      },
      {
        title: "2. Consulta de estudiantes",
        description:
          "Revisa el listado de estudiantes matriculados en cada uno de tus grupos."
      },
      {
        title: "3. Registro de asistencias",
        description:
          "Registra la asistencia de los estudiantes y mantén actualizado el seguimiento de sus clases."
      },
      {
        title: "4. Registro de calificaciones",
        description:
          "Registra las notas finales de los estudiantes de acuerdo con los criterios académicos establecidos."
      }
    ],

    recommendation:
      "Procura mantener actualizados los registros de asistencia y calificaciones de tus grupos."
  },

  ESTUDIANTE: {
    label: "Estudiante",
    description:
      "Desde este perfil puedes consultar tus cursos, asistencias, calificaciones e historial académico para dar seguimiento a tu progreso.",

    tutorialTitle: "Guía de uso para estudiantes",

    tutorialIntro:
      "Bienvenido al SIA Académico. Desde tu perfil puedes consultar la información relacionada con tu proceso de formación en la academia.",

    tutorialSteps: [
      {
        title: "1. Consulta de cursos",
        description:
          "Consulta los cursos y grupos en los que te encuentras matriculado."
      },
      {
        title: "2. Consulta de asistencias",
        description:
          "Revisa tu registro de asistencia para conocer tu participación en las clases."
      },
      {
        title: "3. Consulta de calificaciones",
        description:
          "Consulta las notas finales registradas por tus docentes."
      },
      {
        title: "4. Historial académico",
        description:
          "Revisa tu historial académico para conocer los cursos que has realizado y tu progreso formativo."
      }
    ],

    recommendation:
      "Consulta periódicamente tus asistencias y calificaciones para mantenerte informado sobre tu progreso académico."
  }
};
