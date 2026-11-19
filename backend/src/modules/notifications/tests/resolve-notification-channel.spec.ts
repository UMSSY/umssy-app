import { describe, it, expect } from 'vitest';
import { resolveNotificationChannel } from '../utils/resolve-notification-channel.js';

describe('resolveNotificationChannel', () => {
  it('usuario sin registro -> email (por defecto)', () => {
    expect(resolveNotificationChannel(undefined)).toBe('email');
    expect(resolveNotificationChannel(null)).toBe('email');
  });

  it('pushEnabled=true, emailEnabled=false -> push', () => {
    expect(resolveNotificationChannel({ pushEnabled: true, emailEnabled: false })).toBe('push');
  });

  it('pushEnabled=false, emailEnabled=true -> email', () => {
    expect(resolveNotificationChannel({ pushEnabled: false, emailEnabled: true })).toBe('email');
  });

  it('pushEnabled=false, emailEnabled=false -> in_app', () => {
    expect(resolveNotificationChannel({ pushEnabled: false, emailEnabled: false })).toBe('in_app');
  });

  it('fila antigua con ambos en true -> push (único canal)', () => {
    expect(resolveNotificationChannel({ pushEnabled: true, emailEnabled: true })).toBe('push');
  });
});