'use client';

import { Button } from '@/components/ui/button';
import { ProfilePageLayout } from '@/modules/profile';
import { DocumentsCvContent } from '../components/documents-cv-content';
import { VerificationDashboard } from '../components/verification-dashboard';
import { useDocumentVerifications } from '../hooks/use-document-verifications';

export function DocumentsCvView() {
  const history = useDocumentVerifications();

  return (
    <ProfilePageLayout
      title="Documentos y CV"
      description="Gestiona tus CV y consulta su verificación automática para el radar de afinidad."
    >
      <DocumentsCvContent />

      <section
        aria-label="Verificación automática de documentos"
        className="mt-8 space-y-4"
      >
        {history.isError && !history.data ? (
          <p role="alert">
            El historial de verificaciones no está disponible.{' '}
            <Button variant="ghost" onClick={() => void history.refetch()}>
              Reintentar verificación
            </Button>
          </p>
        ) : history.data ? (
          <VerificationDashboard
            rows={history.data}
            refresh={history.refetch}
          />
        ) : (
          <p aria-busy="true">Cargando verificaciones…</p>
        )}
      </section>
    </ProfilePageLayout>
  );
}

export function LegacyDocumentsCvView() {
  return (
    <ProfilePageLayout
      title="Documentos y CV"
      description="Sube tu CV para tenerlo disponible en el perfil y mantenerlo actualizado"
    >
      <DocumentsCvContent />
    </ProfilePageLayout>
  );
}
