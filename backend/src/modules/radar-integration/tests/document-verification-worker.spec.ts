import { Logger } from '@nestjs/common';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DocumentVerificationService } from '../services/document-verification.service.js';
import type { VerificationJob } from '../types/verification-job.types.js';

function setup(overrides: Partial<VerificationJob> = {}) {
  const job: VerificationJob = {
    id: 'version',
    userId: 'owner',
    sourceId: 'source',
    sourceType: 'cv',
    filename: 'cv.pdf',
    mime: 'application/pdf',
    content: Buffer.from('pdf'),
    status: 'reading',
    lease: 'lease',
    duplicate: false,
    ...overrides,
  };
  const store = {
    claim: vi.fn().mockResolvedValue(job),
    finish: vi.fn().mockResolvedValue(true),
    markSynced: vi.fn(),
  };
  const ocr = {
    extract: vi
      .fn()
      .mockResolvedValue({
        text: 'Curriculum Ana Rojas experiencia Docker',
        confidence: 0.95,
      }),
  };
  const detection = { detect: vi.fn().mockReturnValue([]) };
  const validation = {
    validateSources: vi.fn().mockReturnValue({ rejected: [] }),
    validateDetected: vi
      .fn()
      .mockReturnValue({
        accepted: [{ id: 'docker' }, { id: 'no-area' }, { id: 'outside' }],
      }),
  };
  const skills = {
    findCatalog: vi.fn().mockResolvedValue([
      { id: 'docker', name: 'Docker', areaId: 'cloud-devops' },
      { id: 'no-area', name: 'Sin área', areaId: null },
      { id: 'outside', name: 'Área desconocida', areaId: 'unknown' },
      { id: 'unaccepted', name: 'No detectada', areaId: 'desarrollo' },
    ]),
  };
  const nlp = { refreshAfterChange: vi.fn() };
  const radar = {
    recalculate: vi.fn().mockResolvedValue({
      version: 3,
      skills: [
        { id: 'docker', evidenceRefs: [{ id: 'source', type: 'cv' }] },
        { id: 'other-source', evidenceRefs: [{ id: 'other', type: 'cv' }] },
        {
          id: 'other-type',
          evidenceRefs: [{ id: 'source', type: 'certification' }],
        },
      ],
    }),
  };
  const users = {
    findRecruitmentProfile: vi
      .fn()
      .mockResolvedValue({ firstName: 'Ana', lastName: 'Rojas' }),
  };
  const certificates = { findById: vi.fn().mockResolvedValue(null) };
  const service = new DocumentVerificationService(
    ...([
      store,
      ocr,
      detection,
      validation,
      skills,
      nlp,
      radar,
      users,
      certificates,
    ] as unknown as ConstructorParameters<typeof DocumentVerificationService>),
  );
  return {
    service,
    job,
    store,
    ocr,
    detection,
    validation,
    skills,
    nlp,
    radar,
    users,
    certificates,
  };
}

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('Document verification worker', () => {
  it('publishes only accepted catalog skills and records only evidence from this exact source', async () => {
    const { service, store, job, nlp } = setup();
    await service.processNext();
    expect(store.finish).toHaveBeenCalledWith(
      job,
      expect.objectContaining({
        status: 'approved',
        skills: [{ id: 'docker', name: 'Docker', areaId: 'cloud-devops' }],
      }),
    );
    expect(nlp.refreshAfterChange).toHaveBeenCalledWith('owner');
    expect(store.markSynced).toHaveBeenCalledWith(job, 3, ['docker']);
  });

  it('does not publish a replaced version when the lease is no longer current', async () => {
    const { service, store, radar, nlp } = setup();
    store.finish.mockResolvedValue(false);
    await service.processNext();
    expect(nlp.refreshAfterChange).not.toHaveBeenCalled();
    expect(radar.recalculate).not.toHaveBeenCalled();
    expect(store.markSynced).not.toHaveBeenCalled();
  });

  it('does nothing without a claimed job and resumes synchronization without rereading a completed job', async () => {
    const { service, store, ocr, radar, job } = setup({ status: 'approved' });
    store.claim.mockResolvedValueOnce(null);
    await service.processNext();
    expect(radar.recalculate).not.toHaveBeenCalled();
    radar.recalculate.mockResolvedValue(null);
    await service.processNext();
    expect(ocr.extract).not.toHaveBeenCalled();
    expect(store.finish).not.toHaveBeenCalled();
    expect(store.markSynced).toHaveBeenCalledWith(job, null, []);
  });

  it('routes failed OCR to review instead of automatically approving unreadable data', async () => {
    const { service, store, ocr, detection } = setup();
    ocr.extract.mockRejectedValue(new Error('OCR unavailable'));
    await service.processNext();
    expect(store.finish).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        status: 'review',
        confidence: null,
        skills: [],
      }),
    );
    expect(detection.detect).not.toHaveBeenCalled();
  });

  it('does not run detection when the source exceeds the NLP input constraints', async () => {
    const { service, store, validation, detection } = setup();
    validation.validateSources.mockReturnValue({
      rejected: [{ id: 'source' }],
    });
    await service.processNext();
    expect(store.finish).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        status: 'review',
        reason: expect.stringContaining('Se omitió la detección'),
        skills: [],
      }),
    );
    expect(detection.detect).not.toHaveBeenCalled();
  });

  it('accepts the issuer only from a certificate belonging to the current owner', async () => {
    const { service, store, certificates, ocr } = setup({
      sourceType: 'certification',
    });
    ocr.extract.mockResolvedValue({
      text: 'Certificado UMSS Ana Rojas Docker',
      confidence: 0.95,
    });
    certificates.findById.mockResolvedValue({
      userId: 'other-owner',
      issuingOrganization: 'UMSS',
    });
    await service.processNext();
    expect(store.finish).toHaveBeenLastCalledWith(
      expect.anything(),
      expect.objectContaining({ status: 'review' }),
    );
    certificates.findById.mockResolvedValue({
      userId: 'owner',
      issuingOrganization: 'UMSS',
    });
    await service.processNext();
    expect(store.finish).toHaveBeenLastCalledWith(
      expect.anything(),
      expect.objectContaining({ status: 'approved' }),
    );
  });

  it('does not approve a document when its owner profile is missing', async () => {
    const { service, store, users } = setup();
    users.findRecruitmentProfile.mockResolvedValue(null);
    await service.processNext();
    expect(store.finish).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ status: 'review' }),
    );
  });

  it('prevents overlapping local jobs and waits for the in-flight job when shutting down', async () => {
    vi.useFakeTimers();
    const { service } = setup();
    let finish: () => void = () => {};
    const pending = new Promise<void>((resolve) => {
      finish = resolve;
    });
    const process = vi.spyOn(service, 'processNext').mockReturnValue(pending);
    service.onApplicationBootstrap();
    await vi.advanceTimersByTimeAsync(4500);
    expect(process).toHaveBeenCalledTimes(1);
    let isStopped = false;
    const stopping = service.onModuleDestroy().then(() => {
      isStopped = true;
    });
    await Promise.resolve();
    expect(isStopped).toBe(false);
    finish();
    await stopping;
    await vi.advanceTimersByTimeAsync(3000);
    expect(isStopped).toBe(true);
    expect(process).toHaveBeenCalledTimes(1);
  });

  it('logs a failed job and continues processing on the next interval', async () => {
    vi.useFakeTimers();
    const { service } = setup();
    const log = vi
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => {});
    const process = vi
      .spyOn(service, 'processNext')
      .mockRejectedValueOnce(new Error('temporary failure'))
      .mockResolvedValue(undefined);
    service.onApplicationBootstrap();
    await vi.advanceTimersByTimeAsync(3000);
    expect(log).toHaveBeenCalled();
    expect(process).toHaveBeenCalledTimes(2);
    await service.onModuleDestroy();
  });
});
