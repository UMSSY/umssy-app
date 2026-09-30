import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from './database/prisma.service.js';
import type { Prisma } from '../../prisma/client.js';
import {
  PHOTO_ALLOWED_MIME_TYPES,
  PHOTO_MAX_SIZE_BYTES,
} from './dto/profile-rules.js';
import type { UpdatePersonalInfoDto } from './dto/update-personal-info.dto.js';
import type { UpdatePresentationDto } from './dto/update-presentation.dto.js';
import type {
  CityOption,
  ProfilePhoto,
  ProfileResponse,
  UploadedImageFile,
} from './interfaces/profile-response.interface.js';
import { detectImageMimeType } from './utils/image-mime-type.js';

const PROFILE_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  personalEmail: true,
  phone: true,
  headline: true,
  aboutMe: true,
  interestedOpportunities: true,
  updatedAt: true,
  city: { select: { id: true, title: true } },
} satisfies Prisma.UserSelect;

type ProfileRecord = Prisma.UserGetPayload<{ select: typeof PROFILE_SELECT }>;

const PROFILE_NOT_FOUND_MESSAGE = 'No se encontró el perfil del egresado.';

@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string): Promise<ProfileResponse> {
    const [profile, photoCount] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: PROFILE_SELECT,
      }),
      this.prisma.user.count({
        where: { id: userId, photoUrl: { not: null } },
      }),
    ]);

    if (!profile) {
      throw new NotFoundException(PROFILE_NOT_FOUND_MESSAGE);
    }

    return this.toResponse(profile, photoCount > 0);
  }

  async updatePersonalInfo(
    userId: string,
    dto: UpdatePersonalInfoDto,
  ): Promise<ProfileResponse> {
    await this.ensureUserExists(userId);

    const city = await this.prisma.city.findUnique({
      where: { id: dto.cityId },
      select: { id: true },
    });

    if (!city) {
      throw new BadRequestException(
        'La ciudad seleccionada no es válida. Elige una de la lista.',
      );
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        cityId: dto.cityId,
        phone: dto.phone,
        personalEmail: dto.personalEmail,
      },
    });

    return this.getProfile(userId);
  }

  async updatePresentation(
    userId: string,
    dto: UpdatePresentationDto,
  ): Promise<ProfileResponse> {
    await this.ensureUserExists(userId);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        headline: dto.headline,
        aboutMe: dto.aboutMe,
        interestedOpportunities: dto.interestedOpportunities,
      },
    });

    return this.getProfile(userId);
  }

  async updatePhoto(
    userId: string,
    file: UploadedImageFile | undefined,
  ): Promise<ProfileResponse> {
    this.validatePhoto(file);
    await this.ensureUserExists(userId);

    await this.prisma.user.update({
      where: { id: userId },
      data: { photoUrl: new Uint8Array(file.buffer) },
    });

    return this.getProfile(userId);
  }

  async removePhoto(userId: string): Promise<ProfileResponse> {
    await this.ensureUserExists(userId);

    await this.prisma.user.update({
      where: { id: userId },
      data: { photoUrl: null },
    });

    return this.getProfile(userId);
  }

  async getPhoto(userId: string): Promise<ProfilePhoto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { photoUrl: true },
    });

    const mimeType = user?.photoUrl ? detectImageMimeType(user.photoUrl) : null;

    if (!user?.photoUrl || !mimeType) {
      throw new NotFoundException('El egresado no tiene fotografía de perfil.');
    }

    return { data: user.photoUrl, mimeType };
  }

  listCities(): Promise<CityOption[]> {
    return this.prisma.city.findMany({
      select: { id: true, title: true },
      orderBy: { title: 'asc' },
    });
  }

  private validatePhoto(
    file: UploadedImageFile | undefined,
  ): asserts file is UploadedImageFile {
    if (!file || file.size === 0) {
      throw new BadRequestException('Selecciona una fotografía para subir.');
    }

    const allowedTypes: readonly string[] = PHOTO_ALLOWED_MIME_TYPES;
    const detectedType = detectImageMimeType(file.buffer);

    if (!detectedType || !allowedTypes.includes(detectedType)) {
      throw new BadRequestException(
        'La fotografía debe ser una imagen JPG, PNG o WEBP.',
      );
    }

    if (file.size > PHOTO_MAX_SIZE_BYTES) {
      throw new BadRequestException('La fotografía no puede superar los 2 MB.');
    }
  }

  private async ensureUserExists(userId: string): Promise<void> {
    const count = await this.prisma.user.count({ where: { id: userId } });

    if (count === 0) {
      throw new NotFoundException(PROFILE_NOT_FOUND_MESSAGE);
    }
  }

  private toResponse(
    profile: ProfileRecord,
    hasPhoto: boolean,
  ): ProfileResponse {
    const updatedAt = profile.updatedAt.toISOString();

    return {
      id: profile.id,
      firstName: profile.firstName,
      lastName: profile.lastName,
      institutionalEmail: profile.email,
      personalEmail: profile.personalEmail,
      phone: profile.phone,
      city: profile.city,
      headline: profile.headline,
      aboutMe: profile.aboutMe,
      interestedOpportunities: profile.interestedOpportunities,
      photoPath: hasPhoto
        ? `/profile/${profile.id}/photo?v=${profile.updatedAt.getTime()}`
        : null,
      updatedAt,
    };
  }
}
