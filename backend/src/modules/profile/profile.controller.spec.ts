import { StreamableFile } from '@nestjs/common';
import { ProfileController } from './profile.controller.js';
import type { ProfileService } from './profile.service.js';

const USER_ID = '6f1c2b1e-4b7a-4c1e-9d3f-2a5b8c9d0e1f';
const PROFILE = { id: USER_ID, firstName: 'Valeria' };

function createServiceMock() {
  return {
    listCities: vi.fn().mockResolvedValue([]),
    getProfile: vi.fn().mockResolvedValue(PROFILE),
    updatePersonalInfo: vi.fn().mockResolvedValue(PROFILE),
    updatePresentation: vi.fn().mockResolvedValue(PROFILE),
    updatePhoto: vi.fn().mockResolvedValue(PROFILE),
    removePhoto: vi.fn().mockResolvedValue(PROFILE),
    getPhoto: vi.fn(),
  };
}

describe('ProfileController', () => {
  let service: ReturnType<typeof createServiceMock>;
  let controller: ProfileController;

  beforeEach(() => {
    service = createServiceMock();
    controller = new ProfileController(service as unknown as ProfileService);
  });

  it('delegates every endpoint to the service', async () => {
    const personalInfo = {
      firstName: 'Valeria',
      lastName: 'Quispe',
      cityId: USER_ID,
      phone: '70000000',
      personalEmail: 'valeria@correo.com',
    };
    const presentation = {
      headline: 'Desarrolladora',
      aboutMe: 'Soy egresada de Ingeniería de Sistemas.',
      interestedOpportunities: null,
    };
    const file = {
      buffer: Buffer.from([]),
      mimetype: 'image/png',
      size: 0,
      originalname: 'foto.png',
    };

    await controller.listCities();
    await controller.getMyProfile(USER_ID);
    await controller.updatePersonalInfo(USER_ID, personalInfo);
    await controller.updatePresentation(USER_ID, presentation);
    await controller.updatePhoto(USER_ID, file);
    await controller.removePhoto(USER_ID);

    expect(service.listCities).toHaveBeenCalled();
    expect(service.getProfile).toHaveBeenCalledWith(USER_ID);
    expect(service.updatePersonalInfo).toHaveBeenCalledWith(
      USER_ID,
      personalInfo,
    );
    expect(service.updatePresentation).toHaveBeenCalledWith(
      USER_ID,
      presentation,
    );
    expect(service.updatePhoto).toHaveBeenCalledWith(USER_ID, file);
    expect(service.removePhoto).toHaveBeenCalledWith(USER_ID);
  });

  it('streams the profile photo with its mime type', async () => {
    service.getPhoto.mockResolvedValue({
      data: new Uint8Array([1, 2, 3]),
      mimeType: 'image/png',
    });

    const result = await controller.getPhoto(USER_ID);

    expect(result).toBeInstanceOf(StreamableFile);
    expect(result.getHeaders().type).toBe('image/png');
  });
});
