import { ForbiddenException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import { ChatRolePolicyService } from '../services/chat-role-policy.service.js';
import { ConversationService } from '../services/conversation.service.js';
import { MessageService } from '../services/message.service.js';
import { AttachmentService } from '../services/attachment.service.js';
import { ChatGateway } from '../gateways/chat.gateway.js';
import { UserBlockedException } from '../exceptions/index.js';


const USER_A = '00000000-0000-4000-8000-000000000001';
const USER_B = '00000000-0000-4000-8000-000000000002';
const CONVERSATION_ID = '00000000-0000-4000-8000-000000000003';

function setup(rolesA: string[], rolesB: string[]) {
  const now = new Date('2026-10-30T12:00:00Z');

  const users = [
    {
      id: USER_A,
      isActive: true,
      roles: rolesA.map((name) => ({ role: { name } })),
    },
    {
      id: USER_B,
      isActive: true,
      roles: rolesB.map((name) => ({ role: { name } })),
    },
  ];

  const prisma = {
    user: {
      findMany: vi.fn().mockResolvedValue(users),
    },
  };

  const policy = new ChatRolePolicyService(
    prisma as unknown as ConstructorParameters<typeof ChatRolePolicyService>[0],
  );

  const conversation = {
    id: CONVERSATION_ID,
    userAId: USER_A,
    userBId: USER_B,
    eventId: null,
    event: null,
    updatedAt: now,
    userA: {
      id: USER_A,
      firstName: 'Ana',
      lastName: 'Perez',
      photoUrl: null,
    },
    userB: {
      id: USER_B,
      firstName: 'Luis',
      lastName: 'Lopez',
      photoUrl: null,
    },
    messages: [],
  };

  const conversations = {
    findById: vi.fn().mockResolvedValue(conversation),
    findByOrderedPair: vi.fn().mockResolvedValue(null),
    createWithParticipants: vi.fn().mockResolvedValue(conversation),
    touchLastMessage: vi.fn().mockResolvedValue(undefined),
  };

  const participants = {
    findByConversationAndUser: vi.fn().mockResolvedValue({
      lastReadAt: now,
    }),
    countUnread: vi.fn().mockResolvedValue(0),
    markRead: vi.fn().mockResolvedValue(undefined),
  };

  const lookup = {
    findById: vi.fn().mockResolvedValue({
      id: USER_B,
      isActive: true,
    }),
  };

  const presence = {
    mapOnlineStatus: vi.fn().mockResolvedValue(new Map()),
  };

  const connections = {
    findAcceptedRequest: vi.fn().mockResolvedValue({ id: 'accepted' }),
  };

  const blocks = {
    isBlockedBetween: vi.fn().mockResolvedValue(false),
    findBlockedIdsBy: vi.fn().mockResolvedValue(new Set<string>()),
  };

  const messages = {
    create: vi.fn().mockResolvedValue({
      id: 'message-1',
      conversationId: CONVERSATION_ID,
      senderId: USER_A,
      content: 'Hola',
      sentAt: now,
      createdAt: now,
    }),
  };

  const statuses = {
    getSentId: vi.fn().mockResolvedValue('sent-status'),
  };

  const attachments = {
    findAttachmentTypeByTitle: vi.fn().mockResolvedValue({
      id: 'image-type',
    }),
    create: vi.fn().mockResolvedValue({ id: 'attachment-1' }),
  };

  const mapper = {
    toUploadedFile: vi.fn().mockReturnValue({}),
    toResponse: vi.fn().mockReturnValue({ id: 'attachment-1' }),
  };

  const fileValidation = {
    detectMimeType: vi.fn().mockReturnValue('image/png'),
    validate: vi.fn().mockReturnValue({
      originalName: 'imagen.png',
      detectedMimeType: 'image/png',
      size: 3,
      buffer: Buffer.from([1, 2, 3]),
    }),
  };

  const conversationService = new ConversationService(
    ...([
      conversations,
      participants,
      lookup,
      presence,
      connections,
      blocks,
      policy,
    ] as unknown as ConstructorParameters<typeof ConversationService>),
  );

  const messageService = new MessageService(
    ...([
      messages,
      conversations,
      participants,
      statuses,
      blocks,
      policy,
    ] as unknown as ConstructorParameters<typeof MessageService>),
  );

  const attachmentService = new AttachmentService(
    ...([
      attachments,
      mapper,
      conversations,
      participants,
      messages,
      statuses,
      fileValidation,
      blocks,
      policy,
    ] as unknown as ConstructorParameters<typeof AttachmentService>),
  );

  const file = {
    originalname: 'imagen.png',
    mimetype: 'image/png',
    size: 3,
    buffer: Buffer.from([1, 2, 3]),
  } as NonNullable<Parameters<AttachmentService['uploadAndSend']>[1]>;

  return {
    users,
    prisma,
    policy,
    conversation,
    conversations,
    connections,
    blocks,
    messages,
    attachments,
    conversationService,
    messageService,
    attachmentService,
    file,
  };
}

describe('HU8 tarea 3: roles permitidos', () => {
  it.each([
    ['estudiante', 'estudiante'],
    ['estudiante', 'titulado'],
    ['titulado', 'estudiante'],
    ['titulado', 'titulado'],
  ])('permite %s con %s', async (roleA, roleB) => {
    const context = setup([roleA], [roleB]);

    await expect(
      context.policy.assertCanCommunicate(USER_A, USER_B),
    ).resolves.toBeUndefined();

    await expect(
      context.conversationService.getOrCreate(USER_A, USER_B),
    ).resolves.toMatchObject({ id: CONVERSATION_ID });

    await expect(
      context.messageService.send({
        conversationId: CONVERSATION_ID,
        senderId: USER_A,
        content: 'Hola',
      }),
    ).resolves.toMatchObject({ id: 'message-1' });

    await expect(
      context.attachmentService.uploadAndSend(USER_A, context.file, {
        conversationId: CONVERSATION_ID,
      }),
    ).resolves.toMatchObject({ isAttachment: true });
  });

  it('consulta los roles vigentes desde la base de datos', async () => {
    const context = setup(['estudiante'], ['titulado']);

    await context.policy.assertCanCommunicate(USER_A, USER_B);

    expect(context.prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: { in: [USER_A, USER_B] } },
        select: expect.objectContaining({
          roles: expect.objectContaining({
            where: { deletedAt: null },
          }),
        }),
      }),
    );
  });

  const forbiddenCases: Array<[string, string[], string[]]> = [
    ['reclutador como emisor', ['empresa'], ['estudiante']],
    ['reclutador como destinatario', ['estudiante'], ['empresa']],
    ['mentor como emisor', ['mentor'], ['titulado']],
    ['mentor como destinatario', ['titulado'], ['mentor']],
    ['otro rol', ['administrativo'], ['estudiante']],
    ['sin roles', [], ['titulado']],
    ['rol mixto con reclutador', ['estudiante', 'empresa'], ['titulado']],
  ];

  it.each(forbiddenCases)(
    'rechaza %s antes de guardar datos',
    async (_description, rolesA, rolesB) => {
      const context = setup(rolesA, rolesB);

      await expect(
        context.conversationService.getOrCreate(USER_A, USER_B),
      ).rejects.toBeInstanceOf(ForbiddenException);

      expect(
        context.conversations.createWithParticipants,
      ).not.toHaveBeenCalled();

      await expect(
        context.messageService.send({
          conversationId: CONVERSATION_ID,
          senderId: USER_A,
          content: 'Hola',
        }),
      ).rejects.toBeInstanceOf(ForbiddenException);

      await expect(
        context.attachmentService.uploadAndSend(USER_A, context.file, {
          conversationId: CONVERSATION_ID,
        }),
      ).rejects.toBeInstanceOf(ForbiddenException);

      expect(context.messages.create).not.toHaveBeenCalled();
      expect(context.attachments.create).not.toHaveBeenCalled();
      expect(context.conversations.touchLastMessage).not.toHaveBeenCalled();
    },
  );

  it('rechaza abrir una conversacion existente con reclutador', async () => {
    const context = setup(['estudiante'], ['empresa']);
    context.conversations.findByOrderedPair.mockResolvedValue(
      context.conversation,
    );

    await expect(
      context.conversationService.getOrCreate(USER_A, USER_B),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(context.conversations.createWithParticipants).not.toHaveBeenCalled();
  });

  it('vuelve a consultar roles si cambian durante la sesion', async () => {
    const context = setup(['estudiante'], ['titulado']);

    await context.policy.assertCanCommunicate(USER_A, USER_B);

    context.users[1].roles = [{ role: { name: 'empresa' } }];

    await expect(
      context.messageService.send({
        conversationId: CONVERSATION_ID,
        senderId: USER_A,
        content: 'Hola',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(context.messages.create).not.toHaveBeenCalled();
  });

  it('conserva la solicitud de conexion aceptada de HU9', async () => {
    const context = setup(['estudiante'], ['titulado']);
    context.connections.findAcceptedRequest.mockResolvedValue(null);

    await expect(
      context.conversationService.getOrCreate(USER_A, USER_B),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(context.connections.findAcceptedRequest).toHaveBeenCalledWith(
      USER_A,
      USER_B,
    );

    expect(context.conversations.createWithParticipants).not.toHaveBeenCalled();
  });

  it('conserva el bloqueo de HU13 aunque los roles sean permitidos', async () => {
    const context = setup(['estudiante'], ['titulado']);
    context.blocks.isBlockedBetween.mockResolvedValue(true);

    await expect(
      context.conversationService.getOrCreate(USER_A, USER_B),
    ).rejects.toBeInstanceOf(UserBlockedException);

    await expect(
      context.messageService.send({
        conversationId: CONVERSATION_ID,
        senderId: USER_A,
        content: 'Hola',
      }),
    ).rejects.toBeInstanceOf(UserBlockedException);

    await expect(
      context.attachmentService.uploadAndSend(USER_A, context.file, {
        conversationId: CONVERSATION_ID,
      }),
    ).rejects.toBeInstanceOf(UserBlockedException);

    expect(context.conversations.createWithParticipants).not.toHaveBeenCalled();
    expect(context.messages.create).not.toHaveBeenCalled();
    expect(context.attachments.create).not.toHaveBeenCalled();
  });

  it('no emite por socket un mensaje rechazado por roles', async () => {
    const context = setup(['estudiante'], ['empresa']);

    const gateway = new ChatGateway(
      ...([
        {},
        {},
        {},
        {},
        context.messageService,
        {},
      ] as unknown as ConstructorParameters<typeof ChatGateway>),
    );

    const emit = vi.fn();
    const to = vi.fn().mockReturnValue({ emit });

    gateway.server = {
      to,
    } as unknown as ChatGateway['server'];

    const client = {
      data: { user: { id: USER_A } },
    } as Parameters<ChatGateway['handleEventRoomJoin']>[0];

    const result = await gateway.handleEventRoomJoin(client, {
      conversationId: CONVERSATION_ID,
      content: 'Hola',
    });

    expect(result.ok).toBe(false);
    expect(context.messages.create).not.toHaveBeenCalled();
    expect(to).not.toHaveBeenCalled();
    expect(emit).not.toHaveBeenCalled();
  });
});
