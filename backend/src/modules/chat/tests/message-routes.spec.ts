import 'reflect-metadata';
import { describe, expect, it } from 'vitest';
import { PATH_METADATA } from '@nestjs/common/constants.js';
import { ChatController } from '../controllers/chat.controller.js';
import { MessageController } from '../controllers/message.controller.js';
import { AttachmentController } from '../controllers/attachment.controller.js';

// Las dos lecturas conservan rutas distintas para sus contratos de paginación.
describe('rutas canónicas de conversaciones', () => {
  it('separa la lista y la página de mensajes bajo el mismo recurso', () => {
    expect(Reflect.getMetadata(PATH_METADATA, ChatController)).toBe(
      'chat/conversations',
    );
    expect(
      Reflect.getMetadata(PATH_METADATA, ChatController.prototype.getMessages),
    ).toBe(':conversationId/messages');
    expect(
      Reflect.getMetadata(PATH_METADATA, MessageController.prototype.getPage),
    ).toBe('chat/conversations/:conversationId/messages/page');
  });

  it('identifica la conversación al marcar su lectura', () => {
    expect(
      Reflect.getMetadata(PATH_METADATA, MessageController.prototype.markRead),
    ).toBe('chat/conversations/:conversationId/read-state');
  });

  it('mantiene una sola operación de subida y un recurso para el archivo', () => {
    expect(
      Reflect.getMetadata(
        PATH_METADATA,
        AttachmentController.prototype.uploadAndSend,
      ),
    ).toBe('attachments');
    expect(
      Reflect.getMetadata(
        PATH_METADATA,
        AttachmentController.prototype.download,
      ),
    ).toBe('attachments/:id/file');
    expect(
      Object.getOwnPropertyNames(AttachmentController.prototype),
    ).not.toContain('uploadAndSendAlias');
  });
});
