import type { MentorTransaction } from '../types/mentor-transaction.types.js';
import type { MentorActivationResult } from '../types/mentor-activation-result.types.js';

export async function assignMentorParticipation(
  tx: MentorTransaction,
  userId: string,
  roleId: string,
  technicalAreaIds: string[],
  orientationTypeIds: string[],
): Promise<MentorActivationResult> {
  await tx.userRole.create({ data: { userId, roleId, deletedAt: null } });
  await tx.mentorTechnicalArea.deleteMany({ where: { mentorId: userId } });
  await tx.mentorOrientationType.deleteMany({ where: { mentorId: userId } });
  await tx.mentorTechnicalArea.createMany({
    data: technicalAreaIds.map((technicalAreaId) => ({
      mentorId: userId,
      technicalAreaId,
    })),
  });
  await tx.mentorOrientationType.createMany({
    data: orientationTypeIds.map((orientationTypeId) => ({
      mentorId: userId,
      orientationTypeId,
    })),
  });
  await tx.user.update({
    where: { id: userId },
    data: { isAvailableForMentoring: true },
  });
  return { id: userId };
}
