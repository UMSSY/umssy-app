import { StreamableFile } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RadarIntegrationController } from '../controllers/radar-integration.controller.js';
import type { RadarIntegrationService } from '../services/radar-integration.service.js';

function setup() {
  const svc = {
    myRadar: vi.fn(),
    rescanCurrentCv: vi.fn(),
    retry: vi.fn(),
    queue: vi.fn(),
    decision: vi.fn(),
    reprocessCv: vi.fn(),
    downloadForAdmin: vi.fn(),
  };
  const controller = new RadarIntegrationController(svc as unknown as RadarIntegrationService);
  return { svc, controller };
}

describe('RadarIntegrationController (develop)', () => {
  beforeEach(() => vi.clearAllMocks());
  it('conserva los endpoints administrativos y de candidato del Epic', async () => {
    const { svc, controller } = setup();
    svc.downloadForAdmin.mockResolvedValue({ buffer: Buffer.from('pdf') });

    await controller.me('user');
    await controller.rescan('user');
    await controller.recalculate('user');
    await controller.queue('admin');
    await controller.decision('admin', 'cv', 'id', { decision: 'approved' });
    await controller.reprocessCv('admin', 'id');
    const file = await controller.download('admin', 'id');

    expect(svc.myRadar).toHaveBeenCalledWith('user');
    expect(svc.rescanCurrentCv).toHaveBeenCalledWith('user');
    expect(svc.retry).toHaveBeenCalledWith('user');
    expect(svc.queue).toHaveBeenCalledWith('admin');
    expect(svc.decision).toHaveBeenCalledWith(
      'admin',
      'cv',
      'id',
      'approved',
    );
    expect(svc.reprocessCv).toHaveBeenCalledWith('admin', 'id');
    expect(file).toBeInstanceOf(StreamableFile);
  });

});
