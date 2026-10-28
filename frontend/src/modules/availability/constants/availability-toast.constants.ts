export const AVAILABILITY_TOAST_TEXT = {
  blockSaved: "Bloque guardado correctamente.",
  blockUpdated: "Bloque actualizado correctamente.",
  blockDeleted: "Bloque eliminado correctamente.",
  noBlocksCreated: "No se creó ningún bloque.",
  skippedDatesLabel: "Fechas omitidas:",
  blocksCreated: (count: number): string =>
    count === 1 ? "Se creó 1 bloque." : `Se crearon ${count} bloques.`,
} as const;
