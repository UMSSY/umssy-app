"use client";

import { useEffect, useState } from "react";
import { availabilityApi } from "../services/availability.api";
import type { AvailabilityBlock, AvailabilityFilters, CreateAvailabilityBlockInput } from "../types/availability";

export function useAvailability(filters?: AvailabilityFilters) {
  const from = filters?.from;
  const to = filters?.to;
  const [reloadCount, setReloadCount] = useState(0);
  const requestKey = `${from ?? ""}|${to ?? ""}|${reloadCount}`;
  const [currentRequestKey, setCurrentRequestKey] = useState(requestKey);
  const [blocks, setBlocks] = useState<AvailabilityBlock[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);

  if (currentRequestKey !== requestKey) {
    setCurrentRequestKey(requestKey);
    setIsLoading(true);
    setFetchError(null);
  }

  useEffect(() => {
    let cancelled = false;
    availabilityApi
      .getAvailabilityBlocks({ from, to })
      .then((data) => {
        if (!cancelled) setBlocks(data);
      })
      .catch(() => {
        if (!cancelled) setFetchError("Error al obtener los bloques de disponibilidad");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [from, to, reloadCount]);

  const refetch = () => setReloadCount((count) => count + 1);

  const updateBlock = async (id: string, input: Partial<CreateAvailabilityBlockInput>): Promise<AvailabilityBlock | null> => {
    setMutationError(null);
    try {
      const updatedBlock = await availabilityApi.updateAvailabilityBlock(id, input);
      setBlocks((prev) => prev.map((block) => (block.id === id ? updatedBlock : block)));
      return updatedBlock;
    } catch {
      setMutationError("Error al actualizar el bloque de disponibilidad");
      return null;
    }
  };

  const deleteBlock = async (id: string): Promise<boolean> => {
    setMutationError(null);
    try {
      await availabilityApi.deleteAvailabilityBlock(id);
      setBlocks((prev) => prev.filter((block) => block.id !== id));
      return true;
    } catch {
      setMutationError("Error al eliminar el bloque de disponibilidad");
      return false;
    }
  };

  return {
    blocks,
    isLoading,
    error: fetchError,
    mutationError,
    refetch,
    updateBlock,
    deleteBlock,
  };
}
