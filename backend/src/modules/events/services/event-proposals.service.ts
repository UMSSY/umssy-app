import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import { FileValidationService } from '../../../common/services/file-validation.service.js';
import type { MulterFile } from '../../../common/types/multer-file.type.js';
import { CreateProposalSchema } from '../requests/create-proposal.request.js';
import type { Event } from '../../../prisma/client.js';

@Injectable()
export class EventProposalsService {
  constructor(private readonly prisma: PrismaService, private readonly files: FileValidationService) {}

  async create(userId: string, body: unknown, file: MulterFile | undefined, key: string | undefined) {
    if (!key || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(key)) throw new BadRequestException('Se requiere una clave de idempotencia UUID.');
    const parsed = CreateProposalSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException({ message: 'Revisa los campos de la propuesta.', errors: Object.fromEntries(parsed.error.issues.map((issue) => [String(issue.path[0]), issue.message])) });
    const values = parsed.data;
    const cover = this.files.validate(file ? { originalName: file.originalname, mimeType: file.mimetype, size: file.size, buffer: file.buffer } : undefined, { allowedTypes: ['jpg', 'png'], maxSizeBytes: 5 * 1024 * 1024 });
    const hash = createHash('sha256').update(JSON.stringify(values)).update(cover.buffer).digest('hex');
    const existing = await this.prisma.event.findUnique({ where: { createdById_proposalKey: { createdById: userId, proposalKey: key } } });
    if (existing) return this.replay(existing, hash);
    try {
      return await this.prisma.$transaction(async (tx) => {
        const author = await tx.user.findFirst({ where: { id: userId, isActive: true, roles: { some: { deletedAt: null, role: { name: 'titulado' } } } }, select: { firstName: true, lastName: true } });
        if (!author) throw new ForbiddenException('Solo un titulado activo puede proponer talleres.');
        if (!await tx.eventCategory.findUnique({ where: { id: values.categoryId }, select: { id: true } })) throw new BadRequestException({ errors: { categoryId: 'Selecciona una categoría disponible.' } });
        const status = await tx.eventStatus.upsert({ where: { title: 'En votación' }, update: {}, create: { title: 'En votación' } });
        const origin = await tx.eventOrigin.upsert({ where: { title: 'Comunidad' }, update: {}, create: { title: 'Comunidad' } });
        const title = values.modality === 'virtual' ? 'Virtual' : 'Presencial';
        const modality = await tx.eventModality.upsert({ where: { title }, update: {}, create: { title } });
        const event = await tx.event.create({ data: {
          title: values.title, description: values.description, categoryId: values.categoryId,
          eventDate: new Date(values.eventDate + 'T00:00:00Z'),
          startTime: new Date('1970-01-01T' + values.startTime + ':00Z'), endTime: new Date('1970-01-01T' + values.endTime + ':00Z'),
          capacity: values.capacity, location: values.location, modalityId: modality.id, originId: origin.id, statusId: status.id,
          createdById: userId, instructorName: (author.firstName + ' ' + author.lastName).trim(),
          supportThreshold: Math.max(8, Math.ceil(values.capacity / 2)), votingDeadline: new Date(Date.now() + 10 * 86400000),
          coverData: new Uint8Array(cover.buffer), coverMimeType: cover.detectedMimeType, proposalKey: key, proposalHash: hash,
        } });
        return this.response(event);
      });
    } catch (error) {
      // A concurrent retry can win the unique constraint. Return its committed result.
      if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002') {
        const winner = await this.prisma.event.findUnique({ where: { createdById_proposalKey: { createdById: userId, proposalKey: key } } });
        if (winner) return this.replay(winner, hash);
      }
      throw error;
    }
  }
  async cover(id: string) {
    const event = await this.prisma.event.findFirst({ where: { id, status: { title: { in: ['Publicado', 'En votación'] } } }, select: { coverData: true, coverMimeType: true } });
    if (!event?.coverData || !event.coverMimeType) throw new NotFoundException('Portada no disponible.');
    return { content: Buffer.from(event.coverData), mimeType: event.coverMimeType };
  }
  private replay(event: Event, hash: string) {
    if (event.proposalHash !== hash) throw new ConflictException('La clave de envío ya corresponde a otra propuesta.');
    return this.response(event);
  }
  private response(event: Event) {
    return { id: event.id, status: 'voting' as const, supportThreshold: event.supportThreshold, votingDeadline: event.votingDeadline?.toISOString(), coverUrl: '/events/' + event.id + '/cover' };
  }
}
