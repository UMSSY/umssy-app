import { describe, expect, it, beforeEach } from 'vitest';
import { ChatVisibilityService } from '../services/chat-visibility.service.js';

describe('ChatVisibilityService', () => {
  let service: ChatVisibilityService;

  beforeEach(() => {
    service = new ChatVisibilityService();
  });

  it('debe indicar que la conversación no está abierta si el usuario no tiene sockets registrados', () => {
    expect(service.isConversationOpen('user-1', 'conv-1')).toBe(false);
  });

  it('debe registrar y confirmar cuando una conversación está abierta y enfocada', () => {
    service.setConversationVisibility('user-1', 'socket-1', 'conv-1', true);
    expect(service.isConversationOpen('user-1', 'conv-1')).toBe(true);
    expect(service.isConversationOpen('user-1', 'conv-2')).toBe(false);
  });

  it('debe retornar false si la conversación está seleccionada pero no enfocada (isFocused=false)', () => {
    service.setConversationVisibility('user-1', 'socket-1', 'conv-1', false);
    expect(service.isConversationOpen('user-1', 'conv-1')).toBe(false);
  });

  it('debe retornar true si al menos uno de múltiples sockets del usuario tiene la conversación abierta', () => {
    service.setConversationVisibility('user-1', 'socket-1', 'conv-1', false);
    service.setConversationVisibility('user-1', 'socket-2', 'conv-1', true);
    expect(service.isConversationOpen('user-1', 'conv-1')).toBe(true);
  });

  it('debe remover sockets desconectados correctamente', () => {
    service.setConversationVisibility('user-1', 'socket-1', 'conv-1', true);
    expect(service.isConversationOpen('user-1', 'conv-1')).toBe(true);

    service.removeSocket('user-1', 'socket-1');
    expect(service.isConversationOpen('user-1', 'conv-1')).toBe(false);
  });
});
