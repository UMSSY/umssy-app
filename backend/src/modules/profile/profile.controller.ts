import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  ParseUUIDPipe,
  Patch,
  Put,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  type ApiBodyOptions,
  ApiConsumes,
  ApiHeader,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { z } from 'zod';
import {
  CurrentUserId,
  USER_ID_HEADER,
} from './dev/current-user-id.decorator.js';
import { ZodValidationPipe } from './pipes/zod-validation.pipe.js';
import { PHOTO_MAX_SIZE_BYTES } from './dto/profile-rules.js';
import {
  updatePersonalInfoSchema,
  type UpdatePersonalInfoDto,
} from './dto/update-personal-info.dto.js';
import {
  updatePresentationSchema,
  type UpdatePresentationDto,
} from './dto/update-presentation.dto.js';
import type {
  CityOption,
  ProfileResponse,
  UploadedImageFile,
} from './interfaces/profile-response.interface.js';
import { ProfileService } from './profile.service.js';

function jsonBody(schema: z.ZodType): ApiBodyOptions {
  return { schema: z.toJSONSchema(schema, { io: 'input' }) } as ApiBodyOptions;
}

@ApiTags('profile')
@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get('cities')
  @ApiOperation({ summary: 'Lists the cities available for the profile' })
  listCities(): Promise<CityOption[]> {
    return this.profileService.listCities();
  }

  @Get('me')
  @ApiHeader({ name: USER_ID_HEADER, required: true })
  @ApiOperation({
    summary: 'Returns the personal and contact data of the user',
  })
  getMyProfile(@CurrentUserId() userId: string): Promise<ProfileResponse> {
    return this.profileService.getProfile(userId);
  }

  @Patch('me/personal-info')
  @ApiHeader({ name: USER_ID_HEADER, required: true })
  @ApiBody(jsonBody(updatePersonalInfoSchema))
  @ApiOperation({ summary: 'Updates name, city, phone and personal email' })
  updatePersonalInfo(
    @CurrentUserId() userId: string,
    @Body(new ZodValidationPipe(updatePersonalInfoSchema))
    dto: UpdatePersonalInfoDto,
  ): Promise<ProfileResponse> {
    return this.profileService.updatePersonalInfo(userId, dto);
  }

  @Patch('me/presentation')
  @ApiHeader({ name: USER_ID_HEADER, required: true })
  @ApiBody(jsonBody(updatePresentationSchema))
  @ApiOperation({ summary: 'Updates headline, about me and opportunities' })
  updatePresentation(
    @CurrentUserId() userId: string,
    @Body(new ZodValidationPipe(updatePresentationSchema))
    dto: UpdatePresentationDto,
  ): Promise<ProfileResponse> {
    return this.profileService.updatePresentation(userId, dto);
  }

  @Put('me/photo')
  @ApiHeader({ name: USER_ID_HEADER, required: true })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { photo: { type: 'string', format: 'binary' } },
      required: ['photo'],
    },
  })
  @ApiOperation({ summary: 'Uploads or replaces the profile photo' })
  @UseInterceptors(
    FileInterceptor('photo', { limits: { fileSize: PHOTO_MAX_SIZE_BYTES } }),
  )
  updatePhoto(
    @CurrentUserId() userId: string,
    @UploadedFile() file: UploadedImageFile | undefined,
  ): Promise<ProfileResponse> {
    return this.profileService.updatePhoto(userId, file);
  }

  @Delete('me/photo')
  @ApiHeader({ name: USER_ID_HEADER, required: true })
  @ApiOperation({ summary: 'Removes the profile photo' })
  removePhoto(@CurrentUserId() userId: string): Promise<ProfileResponse> {
    return this.profileService.removePhoto(userId);
  }

  @Get(':userId/photo')
  @Header('Cache-Control', 'public, max-age=86400')
  @ApiOperation({ summary: 'Returns the profile photo of a user' })
  async getPhoto(
    @Param('userId', new ParseUUIDPipe()) userId: string,
  ): Promise<StreamableFile> {
    const photo = await this.profileService.getPhoto(userId);
    return new StreamableFile(photo.data, { type: photo.mimeType });
  }
}
