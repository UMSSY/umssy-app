import { GUARDS_METADATA } from '@nestjs/common/constants.js';
import { ROLES_KEY } from '../../../common/constants/roles.constants.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../../common/guards/roles.guard.js';
import { HeatmapsController } from '../controllers/heatmaps.controller.js';
import { heatmapParamsSchema, heatmapQuerySchema } from '../requests/heatmap-request.schema.js';
import type { HeatmapsService } from '../services/heatmaps.service.js';

describe('HeatmapsController', () => {
  it('exige sesión con rol administrativo', () => {
    expect(Reflect.getMetadata(GUARDS_METADATA, HeatmapsController)).toEqual([JwtAuthGuard, RolesGuard]);
    expect(Reflect.getMetadata(ROLES_KEY, HeatmapsController)).toEqual(['administrativo']);
  });

  it('delega el cálculo al service', async () => {
    const service = { getHeatmap: vi.fn().mockResolvedValue({ baseCount: 3 }) };
    const controller = new HeatmapsController(service as unknown as HeatmapsService);

    await expect(controller.getHeatmap({ type: 'employability' }, { year: 2025 })).resolves.toEqual({ baseCount: 3 });
    expect(service.getHeatmap).toHaveBeenCalledWith('employability', { year: 2025 });
  });
});

describe('heatmap request schemas', () => {
  it('acepta solo los tipos de mapa de calor definidos', () => {
    expect(heatmapParamsSchema.safeParse({ type: 'employability' }).success).toBe(true);
    expect(heatmapParamsSchema.safeParse({ type: 'otro' }).success).toBe(false);
  });

  it('convierte los filtros numéricos y valida sus límites', () => {
    expect(heatmapQuerySchema.parse({ year: '2025', month: '3' })).toEqual({ year: 2025, month: 3 });
    expect(heatmapQuerySchema.safeParse({ month: '13' }).success).toBe(false);
    expect(heatmapQuerySchema.safeParse({ careerId: 'no-uuid' }).success).toBe(false);
  });

  it('exige enviar juntos el inicio y el fin del rango', () => {
    expect(heatmapQuerySchema.safeParse({ startTimestamp: '2025-01-01T00:00:00-04:00' }).success).toBe(false);
    expect(
      heatmapQuerySchema.safeParse({
        startTimestamp: '2025-01-01T00:00:00-04:00',
        endTimestamp: '2025-06-30T23:59:59-04:00',
      }).success,
    ).toBe(true);
  });
});
