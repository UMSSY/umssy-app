import type { PublishedJobOffer, Vacancy } from "../types/vacancy.types";

export function toVacancy(offer: PublishedJobOffer): Vacancy {
  return {
    id: offer.id,
    cargo: offer.title,
    empresa: offer.company.name,
    descripcion: offer.description,
    requisitos: offer.skills.map((skill) => skill.name),
    salario: offer.salaryRange,
    modalidad: offer.modality,
    tipoContrato: offer.contractType,
    idiomas: offer.languages,
    vacantes: offer.positionsAvailable,
    ubicacionUrl: offer.locationUrl,
  };
}
