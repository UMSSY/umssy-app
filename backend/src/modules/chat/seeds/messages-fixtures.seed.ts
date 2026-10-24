import { FIXTURE_CONVERSATIONS } from '../constants/seed-fixture-chat.constants.js';
import type { Prisma } from '../../../prisma/client.js';
import type { FixtureContext } from '../../../common/database/fixture-context.js';

const MESSAGE_TEMPLATES = [
  {
    content: 'Hola, me gustaría conversar sobre el proyecto ficticio.',
    status: 'READ',
  },
  {
    content: 'Claro, revisemos los objetivos y las tecnologías del prototipo.',
    status: 'READ',
  },
  {
    content: 'Adjunto mis dudas sobre el diseño de la API de práctica.',
    status: 'READ',
  },
  {
    content: 'Podemos empezar por el modelo de datos y los casos de uso.',
    status: 'READ',
  },
  {
    content: 'Gracias, prepararé ejemplos para la próxima sesión.',
    status: 'DELIVERED',
  },
  {
    content: 'Perfecto, confirma el horario disponible en el calendario.',
    status: 'DELIVERED',
  },
  {
    content: 'Ya revisé las alternativas y me sirve la primera opción.',
    status: 'SENT',
  },
  {
    content: 'Queda coordinado el encuentro ficticio. ¡Gracias!',
    status: 'SENDING',
  },
];
export async function seedMessagesFixtures(
  tx: Prisma.TransactionClient,
  context: FixtureContext,
): Promise<number> {
  const data: Prisma.MessageCreateManyInput[] = FIXTURE_CONVERSATIONS.flatMap(
    (plan, conversationIndex) =>
      MESSAGE_TEMPLATES.map((template, messageIndex) => {
        const minutes = -120 + messageIndex * 10;
        return {
          id: context.getId(plan.messageKeys[messageIndex]),
          conversationId: context.getId(plan.key),
          senderId: context.getId(plan.senderKeys[messageIndex % 2]),
          content: `[Conversación ficticia ${String(conversationIndex + 1).padStart(2, '0')}] ${template.content}`,
          statusId: context.getReference('message_statuses', template.status),
          sentAt: context.getDate('anchor', minutes, false),
          deliveredAt: ['READ', 'DELIVERED'].includes(template.status)
            ? context.getDate('anchor', minutes + 1, false)
            : null,
          readAt:
            template.status === 'READ'
              ? context.getDate('anchor', minutes + 2, false)
              : null,
          createdAt: context.getDate('anchor', minutes, false),
          updatedAt: context.anchor,
        };
      }),
  );
  await tx.message.createMany({ data, skipDuplicates: true });
  for (const conversationId of new Set(data.map((row) => row.conversationId))) {
    const last = await tx.message.findFirst({
      where: { conversationId },
      orderBy: [{ sentAt: 'desc' }, { id: 'desc' }],
    });
    if (last)
      await tx.conversation.update({
        where: { id: conversationId },
        data: { lastMessageId: last.id, lastMessageAt: last.sentAt },
      });
  }
  return data.length;
}
