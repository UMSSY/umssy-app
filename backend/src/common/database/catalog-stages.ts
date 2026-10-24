import { seedTechnicalAreasCatalog } from '../../modules/technical-areas/seeds/technical-areas-catalog.seed.js';
import { seedOrientationTypesCatalog } from '../../modules/orientation-types/seeds/orientation-types-catalog.seed.js';
import { seedAppointmentStatusesCatalog } from '../../modules/availability/seeds/appointment-statuses-catalog.seed.js';
import { seedProposalStatusesCatalog } from '../../modules/availability/seeds/proposal-statuses-catalog.seed.js';
import { seedEventCategoriesCatalog } from '../../modules/event-categories/seeds/event-categories-catalog.seed.js';
import { seedEventModalitiesCatalog } from '../../modules/events/seeds/event-modalities-catalog.seed.js';
import { seedEventOriginsCatalog } from '../../modules/events/seeds/event-origins-catalog.seed.js';
import { seedEventStatusesCatalog } from '../../modules/events/seeds/event-statuses-catalog.seed.js';
import { seedRegistrationStatusesCatalog } from '../../modules/event-registrations/seeds/registration-statuses-catalog.seed.js';
import { seedJobOfferModalitiesCatalog } from '../../modules/job-offers/seeds/job-offer-modalities-catalog.seed.js';
import { seedJobOfferContractTypesCatalog } from '../../modules/job-offers/seeds/job-offer-contract-types-catalog.seed.js';
import { seedJobOfferStatusesCatalog } from '../../modules/job-offers/seeds/job-offer-statuses-catalog.seed.js';
import { seedAccessRequestStatusesCatalog } from '../../modules/access-requests/seeds/access-request-statuses-catalog.seed.js';
import { seedAccessRequestDocumentTypesCatalog } from '../../modules/access-requests/seeds/access-request-document-types-catalog.seed.js';
import { seedCareersCatalog } from '../../modules/access-requests/seeds/careers-catalog.seed.js';
import { seedMessageStatusesCatalog } from '../../modules/chat/seeds/message-statuses-catalog.seed.js';
import type { Prisma } from '../../prisma/client.js';

export async function seedCatalogStages(
  tx: Prisma.TransactionClient,
): Promise<void> {
  await seedTechnicalAreasCatalog(tx);
  await seedOrientationTypesCatalog(tx);
  await seedAppointmentStatusesCatalog(tx);
  await seedProposalStatusesCatalog(tx);
  await seedEventCategoriesCatalog(tx);
  await seedEventModalitiesCatalog(tx);
  await seedEventOriginsCatalog(tx);
  await seedEventStatusesCatalog(tx);
  await seedRegistrationStatusesCatalog(tx);
  await seedJobOfferModalitiesCatalog(tx);
  await seedJobOfferContractTypesCatalog(tx);
  await seedJobOfferStatusesCatalog(tx);
  await seedAccessRequestStatusesCatalog(tx);
  await seedAccessRequestDocumentTypesCatalog(tx);
  await seedCareersCatalog(tx);
  await seedMessageStatusesCatalog(tx);
}
