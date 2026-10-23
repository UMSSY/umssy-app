import type { Prisma } from '../../prisma/client.js';
import type { FixtureContext } from './fixture-context.js';
export async function loadFixtureReferences(
  tx: Prisma.TransactionClient,
  context: FixtureContext,
): Promise<void> {
  for (const row of await tx.appointmentStatus.findMany())
    context.setReference('appointment_statuses', row.title, row.id);
  for (const row of await tx.proposalStatus.findMany())
    context.setReference('proposal_statuses', row.title, row.id);
  for (const row of await tx.eventModality.findMany())
    context.setReference('event_modalities', row.title, row.id);
  for (const row of await tx.eventOrigin.findMany())
    context.setReference('event_origins', row.title, row.id);
  for (const row of await tx.eventStatus.findMany())
    context.setReference('event_statuses', row.title, row.id);
  for (const row of await tx.registrationStatus.findMany())
    context.setReference('registration_statuses', row.title, row.id);
  for (const row of await tx.city.findMany())
    context.setReference('cities', row.title, row.id);
  for (const row of await tx.company.findMany())
    context.setReference('companies', row.title, row.id);
  for (const row of await tx.role.findMany())
    context.setReference('roles', row.name, row.id);
  for (const row of await tx.skill.findMany())
    context.setReference('skills', row.name, row.id);
  for (const row of await tx.technicalArea.findMany())
    context.setReference('technical_areas', row.name, row.id);
  for (const row of await tx.orientationType.findMany())
    context.setReference('orientation_types', row.name, row.id);
  for (const row of await tx.eventCategory.findMany())
    context.setReference('event_categories', row.name, row.id);
  for (const row of await tx.jobOfferModality.findMany())
    context.setReference('job_offer_modalities', row.title, row.id);
  for (const row of await tx.jobOfferContractType.findMany())
    context.setReference('job_offer_contract_types', row.title, row.id);
  for (const row of await tx.jobOfferStatus.findMany())
    context.setReference('job_offer_statuses', row.title, row.id);
  for (const row of await tx.accessRequestStatus.findMany())
    context.setReference('access_request_statuses', row.title, row.id);
  for (const row of await tx.accessRequestDocumentType.findMany())
    context.setReference('access_request_document_types', row.title, row.id);
  for (const row of await tx.career.findMany())
    context.setReference('careers', row.title, row.id);
  for (const row of await tx.messageStatus.findMany())
    context.setReference('message_statuses', row.title, row.id);
}
