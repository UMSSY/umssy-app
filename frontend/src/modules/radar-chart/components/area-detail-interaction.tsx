'use client';

import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { AREA_DETAILS } from '../data/area-details.data';
import type { AreaId } from '../types/area-id.types';
import { AreaDetailPanel } from './area-detail-panel';

import type { AreaDetailInteractionProps } from '../types/area-detail-interaction-props.types';

export function AreaDetailInteraction({
  initialArea = null,
  selectedArea,
  onAreaSelect,
}: AreaDetailInteractionProps) {
  const [internalAreaId, setInternalAreaId] = useState<AreaId | null>(
    initialArea,
  );

  const selectedAreaId = selectedArea ?? internalAreaId;

  const handleSelectArea = (areaId: AreaId) => {
    setInternalAreaId(areaId);
    onAreaSelect?.(areaId);
  };

  const handleClose = () => {
    setInternalAreaId(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {Object.values(AREA_DETAILS).map((area) => (
          <Button
            variant="ghost"
            key={area.id}
            type="button"
            onClick={() => handleSelectArea(area.id)}
            className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted"
          >
            {area.name}
          </Button>
        ))}
      </div>

      {selectedAreaId ? (
        <AreaDetailPanel
          area={AREA_DETAILS[selectedAreaId]}
          onClose={handleClose}
        />
      ) : (
        <p className="text-sm text-muted-foreground">
          Selecciona un área para ver su detalle.
        </p>
      )}
    </div>
  );
}
