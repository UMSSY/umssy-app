"use client";

import { useParticipationHistory } from "./use-participation-history";
import { useUpdateParticipationPreferences } from "./use-update-participation-preferences";
import { useCancelParticipationRequest } from "./use-cancel-participation-request";

import { useRef, useState } from "react";
import { useMentorshipCatalogs } from "@/modules/mentorship";
import type { PendingParticipationProps } from "../types/pending-participation-props.types";

export function usePendingParticipation({ request, onCancelled }: PendingParticipationProps) {
  const operationInFlight = useRef(false);
  function runOperation(operation: (onSettled: () => void) => void) {
    if (operationInFlight.current) return;
    operationInFlight.current = true;
    operation(() => { operationInFlight.current = false; });
  }

  const {
    technicalAreas,
    orientationTypes,
    isTechnicalAreasLoading,
    isOrientationTypesLoading,
  } = useMentorshipCatalogs();

  const [editOpen, setEditOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [openedAt, setOpenedAt] = useState(() => Date.now());
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [selectedOrientations, setSelectedOrientations] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const requestAreaIds = request.technicalAreaIds ?? [];
  const requestOrientationIds = request.orientationTypeIds ?? [];

  const resolveNames = (
    ids: string[],
    catalog: { id: string; name: string }[],
  ) =>
    ids.map(
      (id) => catalog.find((entry) => entry.id === id)?.name ?? id,
    );

  const areaNames = resolveNames(requestAreaIds, technicalAreas);
  const orientationNames = resolveNames(
    requestOrientationIds,
    orientationTypes,
  );

  const historyQuery = useParticipationHistory(request.userId, historyOpen);
  const updateMutation = useUpdateParticipationPreferences({ technicalAreaIds: selectedAreas, orientationTypeIds: selectedOrientations }, () => {
    setEditOpen(false);
    setSuccessMessage("Tus preferencias se actualizaron correctamente. Conservas tu fecha original en la cola FIFO.");
  });
  const cancelMutation = useCancelParticipationRequest(() => {
    setCancelOpen(false);
    onCancelled?.();
    setSuccessMessage("Solicitud cancelada correctamente");
  });

  function openEdit() {
    setSelectedAreas([...requestAreaIds]);
    setSelectedOrientations([...requestOrientationIds]);
    updateMutation.reset();
    setEditOpen(true);
  }

  function toggleId(
    id: string,
    selected: string[],
    setter: (value: string[]) => void,
  ) {
    setter(
      selected.includes(id)
        ? selected.filter((value) => value !== id)
        : [...selected, id],
    );
  }

  return { technicalAreas, orientationTypes, isTechnicalAreasLoading, isOrientationTypesLoading, editOpen, setEditOpen, cancelOpen, setCancelOpen, historyOpen, setHistoryOpen, detailsOpen, setDetailsOpen, openedAt, setOpenedAt, selectedAreas, setSelectedAreas, selectedOrientations, setSelectedOrientations, successMessage, areaNames, orientationNames, historyQuery, updateMutation, cancelMutation, openEdit, toggleId, runOperation };
}
