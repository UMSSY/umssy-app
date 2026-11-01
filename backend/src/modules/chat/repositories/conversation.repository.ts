import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service.js';

const CONTACT_USER_SELECT = {
  select: {
    id: true,
    firstName: true,
    lastName: true,
    photoUrl: true,
    email: true,
    headline: true,
    roles: {
      where: { deletedAt: null },
      select: {
        role: {
          select: { name: true },
        },
      },
    },
    educations: {
      orderBy: { startDate: 'desc' as const },
      take: 1,
      select: { degree: true, institution: true },
    },
    userSkills: {
      select: {
        skill: {
          select: { name: true },
        },
      },
    },
  },
};

@Injectable()
export class ConversationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(conversationId: string) {
    return this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });
  }

  async findByOrderedPair(userAId: string, userBId: string) {
    return this.prisma.conversation.findUnique({
      where: { userAId_userBId: { userAId, userBId } },
      include: {
        userA: CONTACT_USER_SELECT,
        userB: CONTACT_USER_SELECT,
        messages: {
          orderBy: { sentAt: 'desc' },
          take: 1,
          include: { status: { select: { title: true } } },
        },
      },
    });
  }

  async createWithParticipants(
    userAId: string,
    userBId: string,
    lastReadAt: Date,
  ) {
    return this.prisma.conversation.create({
      data: {
        userAId,
        userBId,
        participants: {
          createMany: {
            data: [
              { userId: userAId, lastReadAt },
              { userId: userBId, lastReadAt },
            ],
          },
        },
      },
      include: {
        userA: CONTACT_USER_SELECT,
        userB: CONTACT_USER_SELECT,
        messages: {
          orderBy: { sentAt: 'desc' },
          take: 1,
          include: { status: { select: { title: true } } },
        },
      },
    });
  }

  async upsertByEventId(eventId: string, userId: string, now: Date) {
    return this.prisma.$transaction(async tx => {
      const conversation = await tx.conversation.upsert({
        where: { eventId },
        update: {},
        create: {
          eventId,
          userAId: null,
          userBId: null,
          updatedAt: now,
          createdAt: now,
        },
        select: { id: true, userAId: true, userBId: true },
      });

      await tx.conversationParticipant.upsert({
        where: { conversationId_userId: { conversationId: conversation.id, userId } },
        update: { lastReadAt: now },
        create: { conversationId: conversation.id, userId, lastReadAt: now },
      });

      return conversation.id;
    });
  }

  async touchLastMessage(
    conversationId: string,
    lastMessageId: string,
    lastMessageAt: Date,
  ) {
    return this.prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageId, lastMessageAt },
    });
  }

  async findUserConversations(userId: string) {
    return this.prisma.conversation.findMany({
      where: {
        AND: [
          {
            OR: [
              { userAId: userId },
              { userBId: userId },
            ],
          },
          {
            eventId: null,
          },
        ],
      },
      include: {
        userA: CONTACT_USER_SELECT,
        userB: CONTACT_USER_SELECT,
        event: { select: { id: true, title: true } },
        messages: {
          orderBy: { sentAt: 'desc' },
          take: 1,
          include: { status: { select: { title: true } } },
        },
      },
      orderBy: [
        { lastMessageAt: { sort: 'desc', nulls: 'last' } },
        { updatedAt: 'desc' },
      ],
    });
  }
}
