export const MODALITIES = ["Presencial", "Remoto", "Híbrido"] as const;
export const CONTRACT_TYPES = ["Tiempo completo", "Medio tiempo", "Pasantía"] as const;
export const INTERNSHIP_CONTRACT_TYPE = "Pasantía";
export const SALARY_TO_BE_AGREED = "A convenir";
export const NOT_SPECIFIED_TEXT = "No especificado";
export const FIELD_FOCUS_CLASS = "focus-visible:border-ink focus-visible:ring-ink/20";

export const MAX_TITLE_CHARS = 60;
export const MAX_LANGUAGES_CHARS = 100;
export const MAX_DESCRIPTION_CHARS = 3000;
export const MAX_VACANCIES = 500;
export const MAX_SALARY_DIGITS = 9;
export const MAX_SKILLS = 10;
export const DESCRIPTION_PREVIEW_CHARS = 125;

export const TITLE_ALLOWED_REGEX = /^[a-zA-Z0-9\sÁÉÍÓÚÜÑáéíóúüñ]+$/;
export const TITLE_DISALLOWED_CHARS_REGEX = /[^a-zA-Z0-9\sÁÉÍÓÚÜÑáéíóúüñ]/g;
export const GOOGLE_MAPS_LINK_REGEX =
  /^https:\/\/(?:maps\.app\.goo\.gl\/[\w-]+|goo\.gl\/maps\/[\w-]+|(?:www\.)?google\.com(?:\.[a-z]{2})?\/maps\/place\/[^/\s?#]+\/@-?\d+(?:\.\d+)?,-?\d+(?:\.\d+)?,\d+(?:\.\d+)?[zm])(?:[/?#]\S*)?$/;

export const EDITING_KEYS = ["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab", "Home", "End"];

export const VACANCY_MESSAGES = {
  required: "Este campo es obligatorio",
  invalidMapsLink: "Ingresa un enlace válido de Google Maps",
  minVacancies: "Debe ser al menos 1",
  maxVacancies: "El número máximo de vacantes por publicación es 500",
  salaryMustBePositive: "El salario debe ser mayor a 0",
  salaryRangeInvalid: "El salario mínimo no puede ser mayor al salario máximo",
  salaryIncomplete: "Completa el rango salarial o deja un solo monto",
  skillsRequired: "Debes seleccionar al menos una habilidad requerida",
  skillsLimit: "Alcanzaste el máximo de 10 habilidades por oferta",
} as const;

export const PUBLISH_MESSAGES = {
  network: "Sin conexión a internet. Revisa tu conexión e inténtalo de nuevo.",
  server: "No se pudo completar la publicación. Inténtalo más tarde.",
  validation: "Algunos datos de la vacante no son válidos. Revísalos e inténtalo de nuevo.",
  company: "No encontramos la empresa asociada a tu sesión.",
  session: "Tu sesión no es válida. Inicia sesión nuevamente.",
  noCompany: "No hay una empresa asociada a tu sesión. Inicia sesión como empresa.",
  incompleteForm: "Faltan datos en los pasos anteriores. Vuelve atrás y complétalos.",
} as const;

export const SKILLS_CATALOG_MESSAGES = {
  loading: "Cargando habilidades...",
  error: "No se pudo cargar el catálogo de habilidades.",
  retry: "Reintentar",
} as const;

export const SKILL_SEARCH_TEXT = {
  trigger: "+ Añadir habilidad",
  title: "Buscar habilidad",
  description: "Busca una tecnología y selecciónala de los resultados.",
  label: "Buscar tecnología",
  placeholder: "Escribe una tecnología",
  noResults: "No se encontraron coincidencias en el catálogo.",
  alreadySelected: "Ya seleccionada",
  cancel: "Cancelar",
  confirm: "Añadir habilidad",
} as const;

export const DISCARD_DIALOG_TEXT = {
  title: "¿Descartar los cambios?",
  description: "Se perderán los datos de la vacante que no fueron publicados.",
  cancel: "Seguir editando",
  confirm: "Descartar",
} as const;

export const LEAVE_DIALOG_TEXT = {
  title: "¿Salir sin publicar?",
  description: "Los datos de la vacante que no fueron publicados se perderán si sales de esta página.",
  cancel: "Quedarme",
  confirm: "Salir",
} as const;

export const EDIT_DISCARD_DIALOG_TEXT = {
  title: "¿Descartar los cambios?",
  description: "Los cambios no guardados se perderán y la vacante conservará sus datos originales.",
  cancel: "Seguir editando",
  confirm: "Descartar",
} as const;

export const EDIT_LEAVE_DIALOG_TEXT = {
  title: "¿Salir sin guardar?",
  description: "Los cambios no guardados se perderán si abandonas la pantalla.",
  cancel: "Quedarme",
  confirm: "Salir",
} as const;

export const EDIT_MESSAGES = {
  success: "Vacante actualizada correctamente",
  error: "No se pudo guardar la edición. Inténtelo más tarde",
} as const;

export const RECRUITERS_HOME_ROUTE = "/recruiters";

export const PUBLISHED_STATUS = "Publicada";

export const CLOSED_STATUS = "Cerrada";
export const DELETED_STATUS = "Eliminada";
export const HISTORY_STATUSES: readonly string[] = [PUBLISHED_STATUS, CLOSED_STATUS, DELETED_STATUS];

export const NEW_JOB_OFFER_ROUTE = "/recruiters/job-offers/new";

export const STATUS_LABELS: Record<string, string> = {
  [PUBLISHED_STATUS]: "Activa",
  [CLOSED_STATUS]: "Cerrada",
  [DELETED_STATUS]: "Eliminada",
};

export const STATUS_BADGE_CLASSES: Record<string, string> = {
  [PUBLISHED_STATUS]: "bg-green-100 text-green-800",
  [CLOSED_STATUS]: "bg-muted text-text-secondary",
  [DELETED_STATUS]: "bg-destructive/10 text-destructive",
};

export const STATUS_FILTER_OPTIONS = [
  { value: "", label: "Todas" },
  { value: PUBLISHED_STATUS, label: "Activas" },
  { value: CLOSED_STATUS, label: "Cerradas" },
  { value: DELETED_STATUS, label: "Eliminadas" },
] as const;

export const HISTORY_SKELETON_ROWS = 3;

export const VACANCY_LIST_TEXT = {
  published: {
    ariaLabel: "Mis vacantes publicadas",
    loading: "Cargando vacantes...",
    loadError: "No se pudieron cargar tus vacantes.",
    empty: "Aún no tienes vacantes publicadas",
    noMatches: "Ninguna vacante coincide con los filtros.",
    noSearchMatches: "No se encontraron vacantes que coincidan con la búsqueda",
  },
  history: {
    ariaLabel: "Historial de vacantes",
    loading: "Cargando historial de vacantes...",
    loadError: "Error al cargar el historial. Inténtelo más tarde.",
    empty: "Aún no tienes vacantes en tu historial",
    noMatches: "Ninguna vacante coincide con los filtros.",
    noSearchMatches: "No se encontraron vacantes que coincidan con la búsqueda",
  },
} as const;

export const JOB_OFFERS_PAGE_SIZE = 10;

export const TOAST_OPTIONS = { position: "top-center", duration: 5000 } as const;

export const DELETE_JOB_OFFER_TEXT = {
  title: "¿Estás seguro de eliminar esta vacante?",
  description: "dejará de ser visible para los candidatos y pasará al historial como eliminada.",
  cancel: "Cancelar",
  confirm: "Eliminar",
  busy: "Eliminando...",
  success: "Vacante eliminada correctamente",
  error: "No se pudo eliminar la vacante. Intente nuevamente",
} as const;

export const REOPEN_JOB_OFFER_TEXT = {
  title: "¿Estás seguro de reabrir esta vacante?",
  description: "se publicará de nuevo con la fecha de hoy y los mismos datos, y volverá a recibir postulaciones.",
  cancel: "Cancelar",
  confirm: "Reabrir",
  busy: "Reabriendo...",
  success: "Vacante reabierta correctamente",
  error: "No se pudo reabrir la vacante. Intente nuevamente",
  notReopenable: "La vacante ya no está cerrada, por eso no se puede reabrir.",
} as const;

export const DEFAULT_COMPANY_ID = "a0000000-0000-4000-8000-000000000001";
export const DEFAULT_COMPANY_NAME = "TechBolivia S.R.L.";
export const COMPANY_ROLE_TAG = "empresa";
