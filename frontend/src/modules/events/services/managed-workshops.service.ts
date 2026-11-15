import type { ManagedWorkshop } from '../types/managed-workshop.types';
import { MOCK_MANAGED_WORKSHOPS } from '../testing/managed-workshops.mock';

export const managedWorkshopsService = {
  async getMine(): Promise<ManagedWorkshop[]> {
    if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_MOCK_MANAGED_WORKSHOPS === 'true') {
      return MOCK_MANAGED_WORKSHOPS;
    }
    // Aquí se conectará la consulta real de talleres autorizados, aún pendiente en backend.
    // El listado público no identifica al creador y no puede usarse como sustituto.
    throw new Error('La consulta de Mis talleres aún no está disponible.');
  },
};
