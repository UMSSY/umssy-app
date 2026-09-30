import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { PrismaService } from './database/prisma.service.js';
import { ProfileService } from './profile.service.js';
import type { UploadedImageFile } from './interfaces/profile-response.interface.js';

const USER_ID = '6f1c2b1e-4b7a-4c1e-9d3f-2a5b8c9d0e1f';
const CITY_ID = '0b8f6a52-1f0e-4c7a-8d9b-3e2f1a0c9b8d';
const UPDATED_AT = new Date('2026-09-20T10:00:00.000Z');

const PNG_BYTES = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00,
]);

function buildProfileRecord() {
  return {
    id: USER_ID,
    firstName: 'Valeria',
    lastName: 'Quispe',
    email: 'valeria.quispe@est.umss.edu',
    personalEmail: 'valeria@correo.com',
    phone: '+591 70000000',
    headline: 'Desarrolladora web junior',
    aboutMe: 'Soy egresada de Ingeniería de Sistemas.',
    interestedOpportunities: 'Desarrollo frontend',
    updatedAt: UPDATED_AT,
    city: { id: CITY_ID, title: 'Cochabamba' },
  };
}

function createPrismaMock() {
  return {
    user: {
      findUnique: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
    },
    city: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
  };
}

function buildFile(overrides: Partial<UploadedImageFile> = {}) {
  return {
    buffer: PNG_BYTES,
    mimetype: 'image/png',
    size: PNG_BYTES.length,
    originalname: 'foto.png',
    ...overrides,
  };
}

describe('ProfileService', () => {
  let prisma: ReturnType<typeof createPrismaMock>;
  let service: ProfileService;

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new ProfileService(prisma as unknown as PrismaService);
  });

  describe('getProfile', () => {
    it('maps the stored user to the profile response', async () => {
      prisma.user.findUnique.mockResolvedValue(buildProfileRecord());
      prisma.user.count.mockResolvedValue(1);

      const profile = await service.getProfile(USER_ID);

      expect(profile).toEqual({
        id: USER_ID,
        firstName: 'Valeria',
        lastName: 'Quispe',
        institutionalEmail: 'valeria.quispe@est.umss.edu',
        personalEmail: 'valeria@correo.com',
        phone: '+591 70000000',
        city: { id: CITY_ID, title: 'Cochabamba' },
        headline: 'Desarrolladora web junior',
        aboutMe: 'Soy egresada de Ingeniería de Sistemas.',
        interestedOpportunities: 'Desarrollo frontend',
        photoPath: `/profile/${USER_ID}/photo?v=${UPDATED_AT.getTime()}`,
        updatedAt: UPDATED_AT.toISOString(),
      });
    });

    it('returns a null photo path when the user has no photo', async () => {
      prisma.user.findUnique.mockResolvedValue(buildProfileRecord());
      prisma.user.count.mockResolvedValue(0);

      const profile = await service.getProfile(USER_ID);

      expect(profile.photoPath).toBeNull();
    });

    it('throws NotFound when the user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.count.mockResolvedValue(0);

      await expect(service.getProfile(USER_ID)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('updatePersonalInfo', () => {
    const dto = {
      firstName: 'Valeria',
      lastName: 'Quispe Rojas',
      cityId: CITY_ID,
      phone: '+591 71234567',
      personalEmail: 'valeria@correo.com',
    };

    it('updates the personal data and returns the fresh profile', async () => {
      prisma.user.count.mockResolvedValueOnce(1).mockResolvedValueOnce(0);
      prisma.city.findUnique.mockResolvedValue({ id: CITY_ID });
      prisma.user.findUnique.mockResolvedValue(buildProfileRecord());

      const profile = await service.updatePersonalInfo(USER_ID, dto);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: USER_ID },
        data: dto,
      });
      expect(profile.id).toBe(USER_ID);
    });

    it('rejects a city that does not exist', async () => {
      prisma.user.count.mockResolvedValue(1);
      prisma.city.findUnique.mockResolvedValue(null);

      await expect(
        service.updatePersonalInfo(USER_ID, dto),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('throws NotFound when the user does not exist', async () => {
      prisma.user.count.mockResolvedValue(0);

      await expect(
        service.updatePersonalInfo(USER_ID, dto),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('updatePresentation', () => {
    it('stores headline, about me and opportunities', async () => {
      prisma.user.count.mockResolvedValue(1);
      prisma.user.findUnique.mockResolvedValue(buildProfileRecord());
      const dto = {
        headline: 'Desarrolladora web junior',
        aboutMe: 'Soy egresada de Ingeniería de Sistemas.',
        interestedOpportunities: null,
      };

      await service.updatePresentation(USER_ID, dto);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: USER_ID },
        data: dto,
      });
    });
  });

  describe('updatePhoto', () => {
    it('stores a valid image', async () => {
      prisma.user.count.mockResolvedValue(1);
      prisma.user.findUnique.mockResolvedValue(buildProfileRecord());

      await service.updatePhoto(USER_ID, buildFile());

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: USER_ID },
        data: { photoUrl: new Uint8Array(PNG_BYTES) },
      });
    });

    it('rejects a missing file', async () => {
      await expect(
        service.updatePhoto(USER_ID, undefined),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects a file whose content is not an image', async () => {
      const file = buildFile({ buffer: Buffer.from('%PDF-1.7'), size: 8 });

      await expect(service.updatePhoto(USER_ID, file)).rejects.toThrow(
        'La fotografía debe ser una imagen JPG, PNG o WEBP.',
      );
    });

    it('rejects an image larger than 2 MB', async () => {
      const file = buildFile({ size: 3 * 1024 * 1024 });

      await expect(service.updatePhoto(USER_ID, file)).rejects.toThrow(
        'La fotografía no puede superar los 2 MB.',
      );
    });
  });

  describe('removePhoto', () => {
    it('clears the stored photo', async () => {
      prisma.user.count.mockResolvedValue(1);
      prisma.user.findUnique.mockResolvedValue(buildProfileRecord());

      await service.removePhoto(USER_ID);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: USER_ID },
        data: { photoUrl: null },
      });
    });
  });

  describe('getPhoto', () => {
    it('returns the photo bytes with the detected mime type', async () => {
      prisma.user.findUnique.mockResolvedValue({ photoUrl: PNG_BYTES });

      const photo = await service.getPhoto(USER_ID);

      expect(photo).toEqual({ data: PNG_BYTES, mimeType: 'image/png' });
    });

    it('throws NotFound when the user has no photo', async () => {
      prisma.user.findUnique.mockResolvedValue({ photoUrl: null });

      await expect(service.getPhoto(USER_ID)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('listCities', () => {
    it('returns the cities ordered by title', async () => {
      const cities = [{ id: CITY_ID, title: 'Cochabamba' }];
      prisma.city.findMany.mockResolvedValue(cities);

      await expect(service.listCities()).resolves.toEqual(cities);
      expect(prisma.city.findMany).toHaveBeenCalledWith({
        select: { id: true, title: true },
        orderBy: { title: 'asc' },
      });
    });
  });
});
