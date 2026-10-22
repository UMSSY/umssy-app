import { WORKSHOP_COVERS } from "../constants/workshop-covers.constants";

export function getWorkshopCover(eventId: string): string {
  // Mantiene una portada estable por taller entre el servidor y el navegador.
  let hash = 0;
  for (const character of eventId) hash = (Math.imul(hash, 31) + character.charCodeAt(0)) >>> 0;
  return WORKSHOP_COVERS[hash % WORKSHOP_COVERS.length];
}
