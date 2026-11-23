'use client';

import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DiscardChangesDialog } from '../components/preview/discard-changes-dialog';
import { PageHeading } from '@/shared/components/layout';
import { Label } from '@/components/ui/label';
import { AlertCircle, Eye, X } from 'lucide-react';
import { Alert } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { buttonVariants } from '@/components/ui/button-variants';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';

import { useOrientationConfig } from '../hooks/use-orientation-config';
import { useMentorProfileDraft } from '../hooks/use-mentor-profile-draft';
import { useCurrentUserId } from '../hooks/use-current-user-id';
import { MentorProfilePreview } from '../components/preview/mentor-profile-preview';
import { useTechnicalAreas } from '@/modules/mentor-participation';
import {
  PROFILE_CHANGES_SAVED_MESSAGE,
  PROFILE_CHANGES_SAVE_ERROR_MESSAGE,
  PROFILE_SELECTION_REQUIRED_MESSAGE,
} from '../constants/profile-changes-messages.constants';

export function OrientationConfigView() {
  const {
    orientationTypes,
    savedIds,
    isLoading,
    isSaving,
    hasLoadError,
    isMentorActive,
    retry,
    save,
  } = useOrientationConfig();

  const {
    areas,
    savedIds: savedTechnicalAreaIds,
    isLoading: isTechnicalAreasLoading,
    hasLoadError: hasTechnicalAreasLoadError,
    hasAccessError: hasTechnicalAreasAccessError,
  } = useTechnicalAreas();

  const router = useRouter();
  const { currentUserId } = useCurrentUserId();

  const {
    orientationTypeIds: draftIds,
    technicalAreaIds: draftTechnicalAreaIds,
    setOrientationTypeIds: setSelectedIds,
    clearOrientationTypeIds,
    clearAllDrafts,
  } = useMentorProfileDraft();

  const selectedIds = draftIds ?? savedIds;

  const selectedTechnicalIds = draftTechnicalAreaIds ?? savedTechnicalAreaIds;

  const [isDiscardDialogOpen, setIsDiscardDialogOpen] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleCheckboxChange = (id: string) => {
    setErrorMessage(null);

    setSelectedIds((previous) =>
      (previous ?? savedIds).includes(id)
        ? (previous ?? savedIds).filter((item) => item !== id)
        : [...(previous ?? savedIds), id],
    );
  };

  const handleRequestSave = () => {
    if (selectedIds.length === 0) {
      setErrorMessage(PROFILE_SELECTION_REQUIRED_MESSAGE);
      return;
    }
    setIsConfirmDialogOpen(true);
  };

  const handleSave = async () => {
    if (selectedIds.length === 0) {
      setErrorMessage(PROFILE_SELECTION_REQUIRED_MESSAGE);
      setIsConfirmDialogOpen(false);
      return;
    }

    const idsToSave = [...selectedIds];

    try {
      await save(idsToSave);
      clearOrientationTypeIds();
      setErrorMessage(null);
      toast.success(PROFILE_CHANGES_SAVED_MESSAGE);
    } catch {
      setErrorMessage(PROFILE_CHANGES_SAVE_ERROR_MESSAGE);
    } finally {
      setIsConfirmDialogOpen(false);
    }
  };

  const hasChanges =
    selectedIds.length !== savedIds.length ||
    selectedIds.some((id) => !savedIds.includes(id));

  const isSaveDisabled =
    isSaving || hasLoadError || (!hasChanges && selectedIds.length > 0);

  const handleCancel = () => {
    if (hasChanges) {
      setIsDiscardDialogOpen(true);
      return;
    }
    router.push('/mentors/participation');
  };

  const handleConfirmDiscard = () => {
    clearAllDrafts();
    setErrorMessage(null);
    setIsDiscardDialogOpen(false);
    router.push('/mentors/participation');
  };

  const canOpenPreview =
    Boolean(currentUserId) &&
    isMentorActive &&
    !isLoading &&
    !hasLoadError &&
    !isTechnicalAreasLoading &&
    !hasTechnicalAreasLoadError &&
    !hasTechnicalAreasAccessError;

  if (isPreviewOpen && currentUserId && canOpenPreview) {
    return (
      <MentorProfilePreview
        mentorId={currentUserId}
        technicalAreas={areas.filter((area) =>
          selectedTechnicalIds.includes(area.id),
        )}
        orientationTypes={orientationTypes.filter((orientation) =>
          selectedIds.includes(orientation.id),
        )}
        onBack={() => setIsPreviewOpen(false)}
      />
    );
  }

  if (isLoading) {
    return (
      <main className="mx-auto min-h-full max-w-7xl bg-background">
        <Card
          className="mx-auto max-w-3xl gap-0 rounded-lg border border-border bg-white py-0 shadow-none ring-0"
          aria-busy="true"
        >
          <CardHeader className="gap-0 p-6 sm:p-8">
            <CardTitle
              role="heading"
              aria-level={1}
              className="font-tight text-3xl font-bold tracking-tight text-ink"
            >
              Editar tipos de orientación
            </CardTitle>
            <p role="status" className="mt-3 text-sm text-text-secondary">
              Cargando tu participación como mentor…
            </p>
          </CardHeader>
        </Card>
      </main>
    );
  }

  if (!isMentorActive) {
    return (
      <main className="mx-auto min-h-full max-w-7xl bg-background">
        <Card className="mx-auto max-w-3xl gap-0 rounded-lg border border-border bg-white py-0 shadow-none ring-0">
          <CardHeader className="gap-0 p-6 pb-0 sm:p-8 sm:pb-0">
            <CardTitle
              role="heading"
              aria-level={1}
              className="font-tight text-3xl font-bold tracking-tight text-ink"
            >
              Editar tipos de orientación
            </CardTitle>
            <p className="mt-3 text-sm text-text-secondary">
              Primero debes activar tu participación como mentor para editar los
              tipos de orientación que deseas brindar.
            </p>
          </CardHeader>
          <CardFooter className="mt-6 border-0 bg-transparent p-6 pt-0 sm:p-8 sm:pt-0">
            <Link
              href="/mentorship"
              className={buttonVariants({
                className:
                  'h-10 rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground hover:bg-brand-hover active:translate-y-0',
              })}
            >
              Activar participación como mentor
            </Link>
          </CardFooter>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-full w-full bg-background">
      <div className="flex w-full flex-col">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
          <PageHeading
            title="Editar tipos de orientación"
            description="Selecciona los tipos de orientación que deseas brindar."
          />

          <Card className="w-full max-w-none gap-6 rounded-lg border border-border bg-white py-0 shadow-none ring-0">
            <CardContent className="flex flex-col gap-6 px-4 pt-4 sm:px-8 sm:pt-8">
              {hasLoadError && (
                <Alert className="flex items-center justify-between gap-4 rounded-lg border border-danger/20 bg-interaction p-4 text-sm text-danger">
                  <span>No se pudieron cargar los tipos de orientación.</span>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setSelectedIds(null);
                      retry();
                    }}
                  >
                    Reintentar
                  </Button>
                </Alert>
              )}

              {!hasLoadError && errorMessage && (
                <Alert className="flex items-center gap-3 rounded-lg border border-danger/20 bg-interaction p-4 text-sm text-danger">
                  <AlertCircle size={20} className="shrink-0 text-accent" />
                  <span>{errorMessage}</span>
                </Alert>
              )}

              {!hasLoadError && (
                <div className="flex flex-col gap-3">
                  {orientationTypes.map((option) => {
                    const isSelected = selectedIds.includes(option.id);
                    const isSaved = savedIds.includes(option.id);

                    return (
                      <Label
                        key={option.id}
                        className={cn(
                          'group flex cursor-pointer items-center justify-between gap-3 rounded-lg border p-4 transition-colors',
                          !isSelected
                            ? 'border-transparent bg-surface-soft/50 hover:bg-interaction'
                            : isSaved
                              ? 'border-border bg-surface-soft/50'
                              : 'border-accent bg-interaction/50',
                        )}
                      >
                        <div className="flex min-w-0 flex-1 flex-col gap-1">
                          <span
                            id={`orientation-label-${option.id}`}
                            className="min-w-0 text-sm font-semibold break-words text-ink"
                          >
                            {option.name}
                          </span>
                          {option.description && (
                            <span className="text-sm text-text-secondary">
                              {option.description}
                            </span>
                          )}
                        </div>

                        <div className="flex shrink-0 items-center">
                          <Checkbox
                            value={option.id}
                            checked={isSelected}
                            disabled={isSaving}
                            onCheckedChange={() =>
                              handleCheckboxChange(option.id)
                            }
                            aria-labelledby={`orientation-label-${option.id}`}
                            className={cn(
                              'size-5 border-0 bg-border text-transparent data-checked:text-accent-foreground [&_[data-slot=checkbox-indicator]>svg]:size-4',
                              !isSelected
                                ? ''
                                : isSaved
                                  ? 'data-checked:bg-accent'
                                  : 'data-checked:bg-accent',
                            )}
                          />
                        </div>
                      </Label>
                    );
                  })}
                </div>
              )}
            </CardContent>

            <CardFooter className="mx-4 flex flex-wrap items-center justify-between gap-4 border-t border-border bg-transparent px-0 py-4 sm:mx-8 sm:pb-8">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isSaving}
                className="h-10 gap-2 rounded-lg px-6 text-sm font-semibold"
              >
                <X size={16} />
                Cancelar
              </Button>

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsPreviewOpen(true)}
                  disabled={!canOpenPreview}
                  className="h-10 gap-2 rounded-lg px-5"
                >
                  <Eye size={16} />
                  Vista previa
                </Button>

                <Button
                  type="button"
                  onClick={handleRequestSave}
                  disabled={isSaveDisabled}
                  className="h-10 rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-none hover:bg-brand-hover active:translate-y-0 disabled:pointer-events-auto disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSaving ? 'Guardando...' : 'Guardar cambios'}
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>

      <AlertDialog
        open={isConfirmDialogOpen}
        onOpenChange={(open) => {
          if (!isSaving) setIsConfirmDialogOpen(open);
        }}
      >
        <AlertDialogContent className="max-w-md gap-0 rounded-lg border border-border bg-surface p-8 text-ink shadow-none ring-0 data-[size=default]:max-w-md data-[size=default]:sm:max-w-md">
          <AlertDialogHeader className="place-items-start text-left">
            <AlertDialogTitle className="font-tight text-2xl font-bold text-ink">
              ¿Guardar cambios?
            </AlertDialogTitle>
            <AlertDialogDescription className="mt-2 text-base text-text-secondary">
              Se actualizarán los tipos de orientación que seleccionaste.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mx-0 mt-8 mb-0 flex-row justify-end gap-3 border-t-0 bg-transparent p-0">
            <AlertDialogCancel
              type="button"
              disabled={isSaving}
              className="h-10 border-border-strong bg-surface px-6 text-sm font-semibold text-ink hover:bg-surface-soft"
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              type="button"
              onClick={() => void handleSave()}
              disabled={isSaving}
              className="h-10 bg-accent px-6 text-sm font-semibold text-accent-foreground hover:bg-brand-hover"
            >
              {isSaving ? 'Guardando...' : 'Sí, guardar cambios'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <DiscardChangesDialog
        open={isDiscardDialogOpen}
        onCancel={() => setIsDiscardDialogOpen(false)}
        onConfirm={handleConfirmDiscard}
      />
    </main>
  );
}
