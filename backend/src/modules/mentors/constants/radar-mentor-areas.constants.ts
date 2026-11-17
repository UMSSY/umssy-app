const RADAR_MENTOR_AREAS: Record<string, string[]> = {
  Desarrollo: [
    'Desarrollo',
    'Desarrollo de Software',
    'Backend',
    'Desarrollo Web',
  ],
  'Cloud/DevOps': ['Cloud/DevOps', 'Cloud & DevOps', 'Cloud'],
  'Data/AI': ['Data/AI', 'Datos & IA', 'Datos'],
  QA: ['QA', 'QA & Testing'],
  Ciberseguridad: ['Ciberseguridad'],
  'Gobernanza TI': ['Gobernanza TI'],
};
export function resolveMentorAreas(area: string): string[] {
  return RADAR_MENTOR_AREAS[area] ?? [area];
}
