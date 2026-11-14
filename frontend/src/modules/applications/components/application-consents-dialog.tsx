'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { applicationService } from '../services/application.service';
import type { Application } from '../types/application.types';
import type { ApplicationConsents } from '../types/application-consents.types';

function ConsentsForm({
  initial,
  onSaved,
}: {
  initial: ApplicationConsents;
  onSaved: () => void;
}) {
  const [draft, setDraft] = useState(initial);
  const client = useQueryClient();
  const mutation = useMutation({
    mutationFn: applicationService.updateConsents,
    onSuccess: async (saved) => {
      client.setQueryData(['application-consents', initial.id], saved);
      await Promise.all([
        client.invalidateQueries({ queryKey: ['radar-recruiter'] }),
        client.invalidateQueries({ queryKey: ['matching', 'applicants'] }),
      ]);
      onSaved();
    },
  });
  return (
    <div className="flex flex-col gap-4">
      {(
        [
          ['consent', 'Compartir radar'],
          ['consentCv', 'Compartir CV'],
          ['consentContact', 'Compartir correo y teléfono'],
        ] as const
      ).map(([field, label]) => (
        <label key={field} className="flex items-center gap-3 text-sm">
          <Checkbox
            checked={draft[field]}
            disabled={mutation.isPending}
            onCheckedChange={(value) =>
              setDraft((current) => ({ ...current, [field]: value === true }))
            }
          />
          {label}
        </label>
      ))}
      {mutation.isError && (
        <p role="alert" className="text-sm text-destructive">
          No se pudieron guardar los permisos. Intenta nuevamente.
        </p>
      )}
      <Button
        disabled={mutation.isPending}
        onClick={() => mutation.mutate(draft)}
      >
        {mutation.isPending ? 'Guardando...' : 'Guardar permisos'}
      </Button>
    </div>
  );
}

function ConsentsLoader({
  application,
  onSaved,
}: {
  application: Application;
  onSaved: () => void;
}) {
  const query = useQuery({
    queryKey: ['application-consents', application.id],
    queryFn: () => applicationService.getConsents(application.id),
    staleTime: 0,
  });
  return query.isFetching ? (
    <p role="status">Cargando permisos...</p>
  ) : query.isError ? (
    <div role="alert">
      <p>No se pudieron cargar los permisos.</p>
      <Button variant="outline" onClick={() => void query.refetch()}>
        Reintentar
      </Button>
    </div>
  ) : (
    query.data && (
      <ConsentsForm
        key={query.dataUpdatedAt}
        initial={query.data}
        onSaved={onSaved}
      />
    )
  );
}

export function ApplicationConsentsDialog({
  application,
}: {
  application: Application;
}) {
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  if (application.status === 'Retirada') return null;
  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => {
          setSaved(false);
          setOpen(true);
        }}
      >
        Gestionar permisos
      </Button>
      {saved && (
        <p role="status" className="text-sm text-text-secondary">
          Permisos actualizados.
        </p>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Permisos de la postulación</DialogTitle>
            <DialogDescription>
              {application.vacancyTitle}. Desactiva los permisos que quieras
              revocar y guarda los cambios.
            </DialogDescription>
          </DialogHeader>
          {open && (
            <ConsentsLoader
              application={application}
              onSaved={() => {
                setSaved(true);
                setOpen(false);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
