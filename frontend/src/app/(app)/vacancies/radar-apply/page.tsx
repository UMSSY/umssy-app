import { redirect } from 'next/navigation';

// Enlace histórico de Épica 3: la postulación se realiza en el catálogo real de vacantes.
export default function RadarApplyPage(){
  redirect('/vacancies');
}
