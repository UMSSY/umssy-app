import type { Metadata } from 'next';
import { Suspense } from 'react';
import { LoaderCircle } from 'lucide-react';
import { CompanyAccountActivationView } from '@/modules/access-requests/views/company-account-activation-view';

export const metadata: Metadata = {
  title: 'Activación Institucional de Empresa | UMSSY',
};

export default function ActivacionEmpresaPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-background">
          <LoaderCircle className="size-8 animate-spin text-primary" />
        </div>
      }
    >
      <CompanyAccountActivationView />
    </Suspense>
  );
}
