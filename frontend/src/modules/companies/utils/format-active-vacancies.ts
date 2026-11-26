export function formatActiveVacancies(count: number): string {
  return count === 1 ? "1 vacante disponible" : `${count} vacantes disponibles`;
}
