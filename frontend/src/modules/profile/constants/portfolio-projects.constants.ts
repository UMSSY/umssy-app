export const PORTFOLIO_PROJECTS_QUERY_KEY = [
  "profile",
  "portfolio",
  "projects",
] as const;

export const PORTFOLIO_REPOSITORIES_QUERY_KEY = [
  "profile",
  "portfolio",
  "repositories",
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
  syncButton: "Sincronizar",
  syncing: "Sincronizando...",
  syncSuccess: "Proyectos sincronizados exitosamente.",
  syncError: "No se pudieron sincronizar los proyectos del portafolio.",
};

export const PORTFOLIO_SELECTION_MESSAGES = {
  dialogTitle: "Seleccionar proyectos de portafolio",
  dialogSubtitle: "Elige hasta 6 proyectos para exhibir en tu perfil.",
  filterAll: "Todos",
  filterGithub: "GitHub",
  filterGitlab: "GitLab",
  searchPlaceholder: "Buscar repositorio...",
  selectedCountBadge: (count: number, max = MAX_PORTFOLIO_PROJECTS) =>
    `${count} / ${max} seleccionados`,
  maxLimitReached:
    "Has alcanzado el límite máximo de 6 proyectos seleccionados.",
  authorizedPublicOnly: "Solo repositorios públicos autorizados",
  cancel: "Cancelar",
  saveButton: (count: number) => `Guardar proyectos (${count})`,
  saving: "Guardando...",
  loadingRepos: "Cargando repositorios disponibles...",
  loadReposError:
    "No se pudieron obtener los repositorios de tus cuentas conectadas.",
  retry: "Reintentar",
  emptyRepos:
    "No se encontraron repositorios en tus cuentas conectadas. Conecta tu cuenta de GitHub o GitLab para verlos aquí.",
  noSearchResults:
    "No se encontraron repositorios que coincidan con la búsqueda.",
  saveError: "Ocurrió un error al guardar los proyectos. Inténtalo de nuevo.",
  viewRepo: "Ver",
  publicBadge: "Público",
  ownerBadge: "Dueño",
  contributorBadge: "Colaborador",
  noDescription: "Sin descripción disponible",
};

