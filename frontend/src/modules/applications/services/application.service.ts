import { Application } from '../types/application.types';

export const ApplicationService = {
  async getMyApplications(): Promise<Application[]> {
    const response = await fetch('/api/applications/me');
    if (!response.ok) throw new Error('Error al cargar postulaciones');
    return response.json();
  },

  async withdrawApplication(id: string): Promise<void> {
    const response = await fetch(`/api/applications/${id}/withdraw`, {
      method: 'PATCH'
    });
    if (!response.ok) throw new Error('Error al retirar postulación');
  }
};