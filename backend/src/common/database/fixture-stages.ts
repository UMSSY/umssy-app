import { seedSkillsFixtures } from '../../modules/skills/seeds/skills-fixtures.seed.js';
import { seedRolesFixtures } from '../../modules/users/seeds/roles-fixtures.seed.js';
import { seedCitiesFixtures } from '../../modules/profile/seeds/cities-fixtures.seed.js';
import { seedCompaniesFixtures } from '../../modules/companies/seeds/companies-fixtures.seed.js';
import { seedUsersFixtures } from '../../modules/users/seeds/users-fixtures.seed.js';
import { seedUserRolesFixtures } from '../../modules/users/seeds/user-roles-fixtures.seed.js';
import { seedEducationsFixtures } from '../../modules/educations/seeds/educations-fixtures.seed.js';
import { seedWorkExperiencesFixtures } from '../../modules/work-experience/seeds/work-experiences-fixtures.seed.js';
import { seedUserSkillsFixtures } from '../../modules/skills/seeds/user-skills-fixtures.seed.js';
import { seedCertificationsFixtures } from '../../modules/certifications/seeds/certifications-fixtures.seed.js';
import { seedUserPresencesFixtures } from '../../modules/chat/seeds/user-presences-fixtures.seed.js';
import { seedMentorTechnicalAreasFixtures } from '../../modules/mentors/seeds/mentor-technical-areas-fixtures.seed.js';
import { seedMentorOrientationTypesFixtures } from '../../modules/mentors/seeds/mentor-orientation-types-fixtures.seed.js';
import { seedAvailabilityBlocksFixtures } from '../../modules/availability/seeds/availability-blocks-fixtures.seed.js';
import { seedBlockedDatesFixtures } from '../../modules/availability/seeds/blocked-dates-fixtures.seed.js';
import { seedAppointmentsFixtures } from '../../modules/availability/seeds/appointments-fixtures.seed.js';
import { seedAppointmentHistoriesFixtures } from '../../modules/availability/seeds/appointment-histories-fixtures.seed.js';
import { seedTimeProposalsFixtures } from '../../modules/availability/seeds/time-proposals-fixtures.seed.js';
import { seedEventsFixtures } from '../../modules/events/seeds/events-fixtures.seed.js';
import { seedEventRegistrationsFixtures } from '../../modules/event-registrations/seeds/event-registrations-fixtures.seed.js';
import { seedEventAttendancesFixtures } from '../../modules/event-registrations/seeds/event-attendances-fixtures.seed.js';
import { seedJobOffersFixtures } from '../../modules/job-offers/seeds/job-offers-fixtures.seed.js';
import { seedJobOfferSkillsFixtures } from '../../modules/job-offers/seeds/job-offer-skills-fixtures.seed.js';
import { seedFilesFixtures } from '../../modules/access-requests/seeds/files-fixtures.seed.js';
import { seedAccessRequestsFixtures } from '../../modules/access-requests/seeds/access-requests-fixtures.seed.js';
import { seedActivationOtpsFixtures } from '../../modules/access-requests/seeds/activation-otps-fixtures.seed.js';
import { seedConversationsFixtures } from '../../modules/chat/seeds/conversations-fixtures.seed.js';
import { seedConversationParticipantsFixtures } from '../../modules/chat/seeds/conversation-participants-fixtures.seed.js';
import { seedMessagesFixtures } from '../../modules/chat/seeds/messages-fixtures.seed.js';
import { seedAdminExportHistoriesFixtures } from '../../modules/reports/seeds/admin-export-histories-fixtures.seed.js';
import type { Prisma } from '../../prisma/client.js';
import type { FixtureContext } from './fixture-context.js';

export async function seedFixtureStages(
  tx: Prisma.TransactionClient,
  context: FixtureContext,
): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};
  counts['skills'] = await seedSkillsFixtures(tx, context);
  counts['roles'] = await seedRolesFixtures(tx, context);
  counts['cities'] = await seedCitiesFixtures(tx, context);
  counts['companies'] = await seedCompaniesFixtures(tx, context);
  counts['users'] = await seedUsersFixtures(tx, context);
  counts['user_roles'] = await seedUserRolesFixtures(tx, context);
  counts['educations'] = await seedEducationsFixtures(tx, context);
  counts['work_experiences'] = await seedWorkExperiencesFixtures(tx, context);
  counts['user_skills'] = await seedUserSkillsFixtures(tx, context);
  counts['certifications'] = await seedCertificationsFixtures(tx, context);
  counts['user_presences'] = await seedUserPresencesFixtures(tx, context);
  counts['mentor_technical_areas'] = await seedMentorTechnicalAreasFixtures(
    tx,
    context,
  );
  counts['mentor_orientation_types'] = await seedMentorOrientationTypesFixtures(
    tx,
    context,
  );
  counts['availability_blocks'] = await seedAvailabilityBlocksFixtures(
    tx,
    context,
  );
  counts['blocked_dates'] = await seedBlockedDatesFixtures(tx, context);
  counts['appointments'] = await seedAppointmentsFixtures(tx, context);
  counts['appointment_histories'] = await seedAppointmentHistoriesFixtures(
    tx,
    context,
  );
  counts['time_proposals'] = await seedTimeProposalsFixtures(tx, context);
  counts['events'] = await seedEventsFixtures(tx, context);
  counts['event_registrations'] = await seedEventRegistrationsFixtures(
    tx,
    context,
  );
  counts['event_attendances'] = await seedEventAttendancesFixtures(tx, context);
  counts['job_offers'] = await seedJobOffersFixtures(tx, context);
  counts['job_offer_skills'] = await seedJobOfferSkillsFixtures(tx, context);
  counts['files'] = await seedFilesFixtures(tx, context);
  counts['access_requests'] = await seedAccessRequestsFixtures(tx, context);
  counts['activation_otps'] = await seedActivationOtpsFixtures(tx, context);
  counts['conversations'] = await seedConversationsFixtures(tx, context);
  counts['conversation_participants'] =
    await seedConversationParticipantsFixtures(tx, context);
  counts['messages'] = await seedMessagesFixtures(tx, context);
  counts['admin_export_histories'] = await seedAdminExportHistoriesFixtures(
    tx,
    context,
  );
  return counts;
}
