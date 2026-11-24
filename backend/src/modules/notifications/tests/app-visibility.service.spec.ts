import { describe, it, expect, beforeEach } from 'vitest';
import { AppVisibilityService } from '../services/app-visibility.service.js';

describe('AppVisibilityService', () => {
  let service: AppVisibilityService;

  beforeEach(() => {
    service = new AppVisibilityService();
  });

  it('considera no visible a un usuario sin conexiones', () => {
    expect(service.isVisible('user-1')).toBe(false);
  });

  it('marca visible al usuario cuando una conexión reporta visible', () => {
    service.setVisibility('user-1', 'socket-a', true);

    expect(service.isVisible('user-1')).toBe(true);
    expect(service.isVisible('user-2')).toBe(false);
  });

  it('deja de estar visible cuando la conexión reporta oculto', () => {
    service.setVisibility('user-1', 'socket-a', true);
    service.setVisibility('user-1', 'socket-a', false);

    expect(service.isVisible('user-1')).toBe(false);
  });

  it('sigue visible mientras quede otra conexión visible', () => {
    service.setVisibility('user-1', 'socket-a', true);
    service.setVisibility('user-1', 'socket-b', true);
    service.removeConnection('user-1', 'socket-a');

    expect(service.isVisible('user-1')).toBe(true);
  });

  it('deja de estar visible al desconectarse la última conexión', () => {
    service.setVisibility('user-1', 'socket-a', true);
    service.removeConnection('user-1', 'socket-a');

    expect(service.isVisible('user-1')).toBe(false);
  });
});
