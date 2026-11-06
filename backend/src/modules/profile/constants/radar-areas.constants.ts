export const RADAR_AREAS = [
  {
    id: 'desarrollo',
    name: 'Desarrollo de Software',
    description: 'Frontend, backend, mobile y arquitectura de software',
  },
  {
    id: 'cloud-devops',
    name: 'Cloud & DevOps',
    description: 'Infraestructura en la nube, CI/CD, contenedores y automatización',
  },
  {
    id: 'data-ai',
    name: 'Datos & IA',
    description: 'Bases de datos, analítica, pipelines de datos e inteligencia artificial',
  },
  {
    id: 'qa',
    name: 'QA & Testing',
    description: 'Aseguramiento de la calidad, pruebas automatizadas y manuales',
  },
  {
    id: 'ciberseguridad',
    name: 'Ciberseguridad',
    description: 'Seguridad informática, pentesting, auditoría y protección de datos',
  },
  {
    id: 'gobernanza-ti',
    name: 'Gobernanza TI',
    description: 'Gestión de proyectos, metodologías ágiles, ITIL y liderazgo técnico',
  },
] as const;

export const RADAR_AREA_IDS: readonly string[] = RADAR_AREAS.map((a) => a.id);
