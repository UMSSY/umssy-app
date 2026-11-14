import type { ManagedWorkshop } from '../types/managed-workshop.types';

// SIMULADO: datos visibles solo con NEXT_PUBLIC_MOCK_MANAGED_WORKSHOPS=true.
// Sustituir en managed-workshops.service.ts cuando backend entregue la consulta autorizada.
export const MOCK_MANAGED_WORKSHOPS: ManagedWorkshop[] = [
  { id: 'mock-workshop-1', title: 'Manejo de IA en conjunto (MCP)', eventDate: '2027-06-24', startTime: '14:00', endTime: '17:00', location: 'Aula D-101' },
  { id: 'mock-workshop-2', title: 'Desarrollo de PWA con Service Worker', eventDate: '2027-06-26', startTime: '09:00', endTime: '12:00', location: 'Laboratorio L-2' },
  { id: 'mock-workshop-3', title: 'Fundamentos de React', eventDate: '2025-06-10', startTime: '09:00', endTime: '11:00', location: 'Aula 101' },
];
