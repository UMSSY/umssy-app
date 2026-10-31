import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service.js';

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
        userA: { select: { id: true, firstName: true, lastName: true, photoUrl: true } },
        userB: { select: { id: true, firstName: true, lastName: true, photoUrl: true } },
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
        userA: { select: { id: true, firstName: true, lastName: true, photoUrl: true } },
        userB: { select: { id: true, firstName: true, lastName: true, photoUrl: true } },
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
      // Conversación grupal: unique sobre eventId, userAId/userBId opcionales
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

      // Participante: misma clave única (conversationId, userId), por lo que es idempotente
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
        userA: { select: { id: true, firstName: true, lastName: true, photoUrl: true } },
        userB: { select: { id: true, firstName: true, lastName: true, photoUrl: true } },
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
