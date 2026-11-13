import type { INestApplication, ExecutionContext } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../../common/guards/roles.guard.js';
import { EventProposalsController } from '../controllers/event-proposals.controller.js';
import { EventProposalsService } from '../services/event-proposals.service.js';

const create = vi.fn().mockResolvedValue({ id: 'proposal' });
let app: INestApplication;
beforeAll(async () => {
  const module = await Test.createTestingModule({
    controllers: [EventProposalsController],
    providers: [{ provide: EventProposalsService, useValue: { create } }],
  })
    .overrideGuard(JwtAuthGuard)
    .useValue({
      canActivate(context: ExecutionContext) {
        context.switchToHttp().getRequest().user = { id: 'user' };
        return true;
      },
    })
    .overrideGuard(RolesGuard)
    .useValue({ canActivate: () => true })
    .compile();
  app = module.createNestApplication();
  await app.init();
});
afterAll(async () => app?.close());

describe('proposal cover multipart size limit', () => {
  it('accepts 5 MB at the upload boundary and rejects 5 MB plus one byte before the service', async () => {
    await request(app.getHttpServer())
      .post('/event-proposals')
      .attach('cover', Buffer.alloc(5 * 1024 * 1024), {
        filename: 'cover.png',
        contentType: 'image/png',
      })
      .expect(201);
    expect(create).toHaveBeenCalledOnce();
    await request(app.getHttpServer())
      .post('/event-proposals')
      .attach('cover', Buffer.alloc(5 * 1024 * 1024 + 1), {
        filename: 'cover.png',
        contentType: 'image/png',
      })
      .expect(413);
    expect(create).toHaveBeenCalledOnce();
  });
});
