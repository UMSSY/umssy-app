type MentorFiltersSummaryProps = {
  search: string;
  area: string;
  orientation: string;
  available: boolean;
  totalItems: number;
};

export function MentorFiltersSummary({
  search,
  area,
  orientation,
  available,
  totalItems,
}: MentorFiltersSummaryProps) {
  const filters: string[] = [];
  const normalizedSearch = search.trim();

  if (normalizedSearch) {
    filters.push(`Búsqueda: “${normalizedSearch}”`);
  }

  if (area) {
    filters.push(`Área: ${area}`);
  }

  if (orientation) {
    filters.push(`Orientación: ${orientation}`);
  }

  if (available) {
    filters.push("Solo disponibles");
  }

  const resultText =
    totalItems === 1
      ? "1 mentor encontrado"
      : `${totalItems} mentores encontrados`;

  return (
    <p
      role="status"
      className="text-sm text-text-secondary"
    >
      {filters.length > 0
        ? `${filters.join(" · ")} — ${resultText}`
        : resultText}
    </p>
  );
}
