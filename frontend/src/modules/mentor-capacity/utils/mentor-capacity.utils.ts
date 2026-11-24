export const BOLIVIA_TIME_ZONE = 'America/La_Paz';

export function formatMentorCapacityDate(value: string) {
  return new Intl.DateTimeFormat('es', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: BOLIVIA_TIME_ZONE,
  }).format(new Date(value));
}

export function validatePercentage(value: string): string | null {
  if (!/^[0-9]+$/.test(value)) {
    return 'Ingresa un porcentaje entero entre 1 y 100.';
  }
  const percentage = Number(value);
  return percentage < 1 || percentage > 100
    ? 'El porcentaje debe estar entre 1 y 100.'
    : null;
}

export function percentageForCapacity(
  value: string,
  approvedGraduates?: number,
): { percentage?: number; error?: string } {
  if (!/^[0-9]+$/.test(value)) {
    return { error: 'Ingresa una cantidad entera de cupos.' };
  }
  const requestedCapacity = Number(value);
  if (!approvedGraduates || requestedCapacity < 1) {
    return {
      error: 'La cantidad debe ser al menos 1 y requiere titulados aprobados.',
    };
  }
  if (requestedCapacity > approvedGraduates) {
    return {
      error: 'La cantidad de cupos no puede superar los titulados aprobados.',
    };
  }

  const target = (requestedCapacity * 100) / approvedGraduates;
  const matchingPercentages = Array.from(
    { length: 100 },
    (_, index) => index + 1,
  ).filter(
    (percentage) =>
      Math.ceil((approvedGraduates * percentage) / 100) === requestedCapacity,
  );
  if (matchingPercentages.length === 0) {
    return {
      error:
        'No hay un porcentaje entero que produzca exactamente esa cantidad de cupos.',
    };
  }

  return {
    percentage: matchingPercentages.reduce((closest, current) =>
      Math.abs(current - target) < Math.abs(closest - target)
        ? current
        : closest,
    ),
  };
}
