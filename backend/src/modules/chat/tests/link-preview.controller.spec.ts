import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { LinkPreviewController } from '../controllers/link-preview.controller.js';
import { LinkPreviewService } from '../services/link-preview.service.js';
import { BlockedLinkUrlException } from '../exceptions/blocked-link-url.exception.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../../common/guards/roles.guard.js';
import { ROLES_KEY } from '../../../common/constants/roles.constants.js';
import type { LinkPreviewResponse } from '../responses/link-preview.response.js';

describe('LinkPreviewController', () => {
  let controller: LinkPreviewController;
  let service: LinkPreviewService;

  const mockService = {
    getPreview: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [LinkPreviewController],
      providers: [
        {
          provide: LinkPreviewService,
          useValue: mockService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<LinkPreviewController>(LinkPreviewController);
    service = module.get<LinkPreviewService>(LinkPreviewService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(service).toBeDefined();
  });

  it('should require chat roles (titulado, estudiante, mentor, empresa)', () => {
    const roles = new Reflector().get<string[]>(ROLES_KEY, LinkPreviewController);
    expect(roles).toEqual(['titulado', 'estudiante', 'mentor', 'empresa']);
  });

  it('should call LinkPreviewService.getPreview with requested url', async () => {
    const mockResponse: LinkPreviewResponse = {
      url: 'https://example.com/article',
      domain: 'example.com',
      title: 'Sample Article',
      description: 'A brief description',
      imageUrl: 'https://example.com/banner.png',
      hasPreview: true,
    };

    mockService.getPreview.mockResolvedValueOnce(mockResponse);

    const result = await controller.getPreview({
      url: 'https://example.com/article',
    });

    expect(mockService.getPreview).toHaveBeenCalledWith(
      'https://example.com/article',
    );
    expect(result).toEqual(mockResponse);
  });

  it('should return preview with hasPreview=false when page has no metadata', async () => {
    const mockResponse: LinkPreviewResponse = {
      url: 'https://plain-site.com',
      domain: 'plain-site.com',
      title: null,
      description: null,
      imageUrl: null,
      hasPreview: false,
    };

    mockService.getPreview.mockResolvedValueOnce(mockResponse);

    const result = await controller.getPreview({
      url: 'https://plain-site.com',
    });

    expect(mockService.getPreview).toHaveBeenCalledWith('https://plain-site.com');
    expect(result.hasPreview).toBe(false);
  });

  it('should propagate exceptions thrown by the service', async () => {
    mockService.getPreview.mockRejectedValueOnce(
      new BlockedLinkUrlException('http://192.168.1.1', 'Private IP'),
    );

    await expect(
      controller.getPreview({ url: 'http://192.168.1.1' }),
    ).rejects.toThrow(BlockedLinkUrlException);
  });
});

