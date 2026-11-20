import { Suspense } from 'react';
import { RadarProfileView } from '@/modules/radar-chart';

export default function RadarProfilePage() {
  return (
    <Suspense fallback={<p role="status">Cargando radar...</p>}>
      <RadarProfileView />
    </Suspense>
  );
}
