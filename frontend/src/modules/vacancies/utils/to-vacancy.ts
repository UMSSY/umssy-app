import type { PublishedJobOffer, Vacancy } from "../types/vacancy.types";

export function toVacancy(offer: PublishedJobOffer): Vacancy {
  return {
    id: offer.id,
    title: offer.title,
    companyName: offer.company.name,
    description: offer.description,
    requirements: offer.skills.map((skill) => skill.name),
    salary: offer.salaryRange,
    modality: offer.modality,
    contractType: offer.contractType,
    languages: offer.languages,
    positionsAvailable: offer.positionsAvailable,
    locationUrl: offer.locationUrl,
  };
}
