import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RefreshTokenService } from '../services/refresh-token.service.js';
import {
  PasswordChangedException,
  RefreshInvalidException,
  SessionExpiredException,
  SessionRevokedException,
} from '../exceptions/index.js';
import { hashRefreshToken } from '../utils/refresh-token.util.js';

const HOUR = 3_600_000;
const MINUTE = 60_000;
const NOW = new Date('2026-11-14T12:00:00.000Z');

function storedToken(overrides: Record<string, unknown> = {}) {
  return {
    id: 'rt-1',
    userId: 'user-1',
    familyId: 'family-1',
    roleTag: 'titulado',
    tokenHash: hashRefreshToken('raw-token'),
    expiresAt: new Date(NOW.getTime() + 10 * MINUTE),
    absoluteExpiresAt: new Date(NOW.getTime() + 5 * HOUR),
    usedAt: null,
    revokedAt: null,
    revokedReason: null,
    userAgent: null,
    createdAt: new Date(NOW.getTime() - 5 * MINUTE),
    ...overrides,
  };
}

describe('RefreshTokenService', () => {
  const repository = {
    create: vi.fn(),
    findByHash: vi.fn(),
    rotate: vi.fn(),
    revokeFamily: vi.fn(),
  };
  const jwtService = { decode: vi.fn(), sign: vi.fn() };
  const sessionService = { getAuthenticatedUser: vi.fn() };
  let service: RefreshTokenService;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    repository.create.mockResolvedValue(undefined);
    repository.rotate.mockResolvedValue(true);
    repository.revokeFamily.mockResolvedValue({ count: 1 });
    jwtService.sign.mockReturnValue('new-access');
    sessionService.getAuthenticatedUser.mockResolvedValue({
      id: 'user-1',
      email: 'user@umss.edu.bo',
      roles: ['titulado', 'mentor'],
    });
    service = new RefreshTokenService(
      repository as any,
      jwtService as any,
      sessionService as any,
    );
  });

  describe('startFromLogin', () => {
    it('stores only the hash and caps the family at 8 hours', async () => {
      jwtService.decode.mockReturnValue({ sub: 'user-1', roleTag: 'titulado' });

      const issued = await service.startFromLogin('access', 'Mozilla/5.0');

      const saved = repository.create.mock.calls[0]?.[0];
      expect(saved.tokenHash).toBe(hashRefreshToken(issued.refreshToken));
      expect(saved.tokenHash).not.toBe(issued.refreshToken);
      expect(saved.userId).toBe('user-1');
      expect(saved.roleTag).toBe('titulado');
      expect(saved.userAgent).toBe('Mozilla/5.0');
      expect(saved.absoluteExpiresAt).toEqual(new Date(NOW.getTime() + 8 * HOUR));
      expect(saved.expiresAt).toEqual(new Date(NOW.getTime() + 15 * MINUTE));
      expect(issued.refreshMaxAgeMs).toBe(15 * MINUTE);
    });

    it('rejects an access token without subject or role', async () => {
      jwtService.decode.mockReturnValue({ sub: 'user-1' });

      await expect(service.startFromLogin('access')).rejects.toThrow();
      expect(repository.create).not.toHaveBeenCalled();
    });
  });

  describe('rotate', () => {
    it('rejects a missing cookie as REFRESH_INVALID', async () => {
      await expect(service.rotate(undefined)).rejects.toBeInstanceOf(
        RefreshInvalidException,
      );
      expect(repository.findByHash).not.toHaveBeenCalled();
    });

    it('rejects an unknown token as REFRESH_INVALID', async () => {
      repository.findByHash.mockResolvedValue(null);

      await expect(service.rotate('unknown')).rejects.toBeInstanceOf(
        RefreshInvalidException,
      );
    });

    it('looks the token up by its hash', async () => {
      repository.findByHash.mockResolvedValue(null);

      await service.rotate('raw-token').catch(() => undefined);

      expect(repository.findByHash).toHaveBeenCalledWith(
        hashRefreshToken('raw-token'),
      );
    });

    it('rotates a valid token keeping the family and the absolute cap', async () => {
      const current = storedToken();
      repository.findByHash.mockResolvedValue(current);

      const session = await service.rotate('raw-token', 'Mozilla/5.0');

      expect(repository.rotate).toHaveBeenCalledWith(
        'rt-1',
        expect.objectContaining({
          userId: 'user-1',
          familyId: 'family-1',
          roleTag: 'titulado',
          absoluteExpiresAt: current.absoluteExpiresAt,
          expiresAt: new Date(NOW.getTime() + 15 * MINUTE),
        }),
      );
      expect(jwtService.sign).toHaveBeenCalledWith(
        { sub: 'user-1', roleTag: 'titulado', roles: ['titulado', 'mentor'] },
        { expiresIn: 900 },
      );
      expect(session.accessToken).toBe('new-access');
      expect(session.refreshToken).not.toBe('raw-token');
      expect(session.roleTag).toBe('titulado');
    });

    it('shortens the new token near the absolute cap', async () => {
      repository.findByHash.mockResolvedValue(
        storedToken({ absoluteExpiresAt: new Date(NOW.getTime() + 4 * MINUTE) }),
      );

      const session = await service.rotate('raw-token');

      expect(session.refreshMaxAgeMs).toBe(4 * MINUTE);
      expect(jwtService.sign).toHaveBeenCalledWith(expect.anything(), {
        expiresIn: 240,
      });
    });

    it('revokes the whole family when a used token comes back', async () => {
      repository.findByHash.mockResolvedValue(
        storedToken({ usedAt: new Date(NOW.getTime() - MINUTE) }),
      );

      await expect(service.rotate('raw-token')).rejects.toBeInstanceOf(
        SessionRevokedException,
      );
      expect(repository.revokeFamily).toHaveBeenCalledWith(
        'family-1',
        'reuse_detected',
      );
      expect(repository.rotate).not.toHaveBeenCalled();
    });

    it('treats a lost race on the atomic update as reuse', async () => {
      repository.findByHash.mockResolvedValue(storedToken());
      repository.rotate.mockResolvedValue(false);

      await expect(service.rotate('raw-token')).rejects.toBeInstanceOf(
        SessionRevokedException,
      );
      expect(repository.revokeFamily).toHaveBeenCalledWith(
        'family-1',
        'reuse_detected',
      );
      expect(jwtService.sign).not.toHaveBeenCalled();
    });

    it('answers SESSION_REVOKED for a revoked family', async () => {
      repository.findByHash.mockResolvedValue(
        storedToken({ revokedAt: NOW, revokedReason: 'logout' }),
      );

      await expect(service.rotate('raw-token')).rejects.toBeInstanceOf(
        SessionRevokedException,
      );
      expect(repository.revokeFamily).not.toHaveBeenCalled();
    });

    it('answers PASSWORD_CHANGED when the revocation came from a password change', async () => {
      repository.findByHash.mockResolvedValue(
        storedToken({ revokedAt: NOW, revokedReason: 'password_changed' }),
      );

      await expect(service.rotate('raw-token')).rejects.toBeInstanceOf(
        PasswordChangedException,
      );
    });

    it('answers SESSION_EXPIRED after the idle window', async () => {
      repository.findByHash.mockResolvedValue(
        storedToken({ expiresAt: new Date(NOW.getTime() - MINUTE) }),
      );

      await expect(service.rotate('raw-token')).rejects.toBeInstanceOf(
        SessionExpiredException,
      );
      expect(repository.rotate).not.toHaveBeenCalled();
    });

    it('answers SESSION_EXPIRED after the 8 hour cap', async () => {
      repository.findByHash.mockResolvedValue(
        storedToken({ absoluteExpiresAt: new Date(NOW.getTime() - MINUTE) }),
      );

      await expect(service.rotate('raw-token')).rejects.toBeInstanceOf(
        SessionExpiredException,
      );
    });

    it('revokes the family when the user is no longer active', async () => {
      repository.findByHash.mockResolvedValue(storedToken());
      sessionService.getAuthenticatedUser.mockRejectedValue(new Error('inactive'));

      await expect(service.rotate('raw-token')).rejects.toBeInstanceOf(
        SessionRevokedException,
      );
      expect(repository.revokeFamily).toHaveBeenCalledWith(
        'family-1',
        'user_inactive',
      );
    });

    it('revokes the family when the session role was removed from the user', async () => {
      repository.findByHash.mockResolvedValue(
        storedToken({ roleTag: 'administrador' }),
      );

      await expect(service.rotate('raw-token')).rejects.toBeInstanceOf(
        SessionRevokedException,
      );
      expect(repository.revokeFamily).toHaveBeenCalledWith(
        'family-1',
        'role_removed',
      );
    });
  });

  describe('revokeByToken', () => {
    it('revokes the family of a known token as logout', async () => {
      repository.findByHash.mockResolvedValue(storedToken());

      await service.revokeByToken('raw-token');

      expect(repository.revokeFamily).toHaveBeenCalledWith('family-1', 'logout');
    });

    it('does nothing without a cookie or with an unknown token', async () => {
      await service.revokeByToken(undefined);
      repository.findByHash.mockResolvedValue(null);
      await service.revokeByToken('unknown');

      expect(repository.revokeFamily).not.toHaveBeenCalled();
    });
  });
});
