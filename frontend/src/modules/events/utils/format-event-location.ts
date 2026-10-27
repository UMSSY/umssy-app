export function formatEventLocation(location: string | null | undefined): string {
  const value = location?.trim();
  if (!value) return 'Por confirmar';
  if (/^https?:\/\//i.test(value)) return value;

  // Quita la institución redundante solo cuando ya hay un lugar y una ubicación.
  return value.replace(/^(.+,.+),\s*UMSS$/i, '$1').trim();
}
