export const PORTFOLIO_PROJECTS_QUERY_KEY = [
  "profile",
  "portfolio",
  "projects",
] as const;

export const MAX_PORTFOLIO_PROJECTS = 6;

export const PORTFOLIO_PROJECTS_MESSAGES = {
  title: "Portafolio",
  description: "Muestra tus repositorios destacados de GitHub y GitLab.",
  addProject: "Añadir proyecto",
  loading: "Cargando portafolio...",
  loadError: "No se pudieron cargar los proyectos del portafolio.",
  retry: "Reintentar",
  empty:
    "Aún no has destacado proyectos en tu portafolio. Conecta tus cuentas de GitHub o GitLab y añade hasta 6 proyectos destacados para mostrar tu trabajo.",
  noDescription: "Sin descripción disponible",
  publicBadge: "Público",
  ownerBadge: "Dueño",
  contributorBadge: "Colaborador",
  viewOnGithub: "Ver en GitHub",
  viewOnGitlab: "Ver en GitLab",
};

