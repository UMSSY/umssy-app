import type { SimilarMentor } from '../types/similar-mentor.types';

// Layout fixtures only; never populate the API query cache with these records.
export const SIMILAR_MENTORS_FIXTURE: SimilarMentor[] = [
  {
    id: 'demo-similar-mentor-lucia',
    fullName: 'Lucía Fernández Vargas',
    roleLabel: 'Mentora',
    technicalAreas: ['Desarrollo web', 'Accesibilidad digital'],
    orientationTypes: [
      'Revisión de portafolio',
      'Preparación para entrevistas',
    ],
    isAvailable: true,
  },
  {
    id: 'demo-similar-mentor-diego',
    fullName: 'Diego Rodríguez Salinas',
    roleLabel: 'Mentor',
    technicalAreas: ['Ciencia de datos', 'Inteligencia artificial'],
    orientationTypes: ['Acompañamiento en proyectos de investigación'],
    isAvailable: false,
  },
  {
    id: 'demo-similar-mentor-valeria',
    fullName: 'Valeria Gutiérrez de la Fuente',
    roleLabel: 'Mentora',
    technicalAreas: [
      'Seguridad de la información',
      'Infraestructura en la nube',
    ],
    orientationTypes: [
      'Desarrollo de carrera',
      'Preparación para certificaciones',
    ],
    isAvailable: true,
  },
];
