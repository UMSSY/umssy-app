import { Injectable } from '@nestjs/common';
import { CV_VALIDATION_RULES } from '../constants/cv.constants.js';
import { CvNotFoundException } from '../exceptions/cv-not-found.exception.js';
import { ProfileNotFoundException } from '../../profile/exceptions/profile-not-found.exception.js';
import { CvMapper } from '../mappers/cv.mapper.js';
import { CvMetadataRepository } from '../repositories/cv-metadata.repository.js';
import type { ListCvsRequest } from '../requests/list-cvs.request.js';
import type { CvResponse } from '../responses/cv.response.js';
import type { CvFileDownload } from '../types/cv-file-download.type.js';
import { CvFileStorage } from '../types/cv-file-storage.type.js';
import type { CvMetadataRecord } from '../types/cv-metadata-record.type.js';
import type { MulterFile } from '../../../common/types/multer-file.type.js';
import type { PaginatedResult } from '../../../common/types/api-response.types.js';
import { FileValidationService } from '../../../common/services/file-validation.service.js';

@Injectable()
export class CvService {
  constructor(
    private readonly cvMetadataRepository: CvMetadataRepository,
    private readonly cvFileStorage: CvFileStorage,
    private readonly fileValidationService: FileValidationService,
    private readonly cvMapper: CvMapper,
  ) {}

  async list(userId: string, request: ListCvsRequest): Promise<PaginatedResult<CvResponse>> {
    const { page, limit } = request;
    const totalItems = await this.cvMetadataRepository.countByUserId(userId);

    if (totalItems === null) {
      throw new ProfileNotFoundException();
    }

    const offset = (page - 1) * limit;
    const records =
      offset < totalItems
        ? await this.cvMetadataRepository.findPageByUserId(userId, offset, limit)
        : [];

    return this.cvMapper.toPage(records, totalItems, page, limit);
  }

  async getFileById(userId: string, cvId: string): Promise<CvFileDownload> {
    const record = await this.cvMetadataRepository.findByIdForUser(userId, cvId);

    if (!record) {
      throw new CvNotFoundException();
    }

    return this.readDownload(userId, cvId, record);
  }

  async upload(userId: string, file: MulterFile | undefined): Promise<CvResponse | null> {
    await this.ensureProfileExists(userId);

    const validatedFile = this.fileValidationService.validate(
      file ? this.cvMapper.toUploadedFile(file) : undefined,
      CV_VALIDATION_RULES,
    );

    const cvId = await this.cvFileStorage.create(
      userId,
      validatedFile.buffer,
      this.cvMapper.toStoredFileName(file?.originalname),
    );

    const record = await this.cvMetadataRepository.findByIdForUser(userId, cvId);
    return record ? this.cvMapper.toResponse(record) : null;
  }

  async removeById(userId: string, cvId: string): Promise<void> {
    const isRemoved = await this.cvFileStorage.removeById(userId, cvId);

    if (!isRemoved) {
      throw new CvNotFoundException();
    }
  }

  private async readDownload(
    userId: string,
    cvId: string,
    record: CvMetadataRecord,
  ): Promise<CvFileDownload> {
    const content = await this.cvFileStorage.readById(userId, cvId);

    if (!content) {
      throw new CvNotFoundException();
    }

    return this.cvMapper.toFileDownload(content, record);
  }

  private async ensureProfileExists(userId: string): Promise<void> {
    if ((await this.cvMetadataRepository.countByUserId(userId)) === null) {
      throw new ProfileNotFoundException();
    }
  }
}
