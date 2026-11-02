"use client";

import { useState } from "react";
import { useLeaveGuard } from "@/modules/job-offers";
import { useMentorProfile } from "@/modules/mentorship";
import { useBlockSelection } from "../../hooks/use-block-selection";
import { useCreateAppointment } from "../../hooks/use-create-appointment";
import type { AppointmentRequestValues } from "../../types/appointment-request-values.types";
import type { AvailabilityBlock } from "../../types/availability-block.types";
import type { BlockSelectionProps } from "../../types/block-selection-props.types";
import { WeekGrid } from "../week-grid/week-grid";
import { BlockSelectionPanel } from "./block-selection-panel";
import { LeaveRequestDialog } from "./leave-request-dialog";
import { RequestAppointmentForm } from "./request-appointment-form";

export function BlockSelection({
  mentorId,
  blocks,
  weekRange,
  fetchFreeBlocks,
  stickyOffset,
}: BlockSelectionProps) {
  const {
    selectedBlock,
    unavailableBlock,
    unavailableBlockIds,
    isChecking,
    error,
    selectBlock,
    markUnavailable,
    clearSelection,
  } = useBlockSelection(fetchFreeBlocks);
  const mentorProfile = useMentorProfile(mentorId);
  const [isFormDirty, setIsFormDirty] = useState(false);
  const { createAppointment, isSubmitting } = useCreateAppointment((block) => {
    setIsFormDirty(false);
    markUnavailable(block);
  });
  const leaveGuard = useLeaveGuard(isFormDirty && selectedBlock !== null);

  const selectableBlocks = blocks.filter((block) => !unavailableBlockIds.includes(block.id));

  const handleSelectBlock = (block: AvailabilityBlock) => {
    setIsFormDirty(false);
    selectBlock(block);
  };

  const handleSubmit = async (values: AppointmentRequestValues) => {
    if (!selectedBlock) return;
    const created = await createAppointment({ block: selectedBlock, values });
    if (created) {
      setIsFormDirty(false);
      clearSelection();
    }
  };

  return (
    <>
      <div className="grid gap-4 min-[1200px]:grid-cols-[minmax(0,1fr)_18rem]">
        <WeekGrid
          blocks={selectableBlocks}
          weekRange={weekRange}
          variant="selectable"
          selectedBlockId={selectedBlock?.id}
          onSelectBlock={handleSelectBlock}
          stickyOffset={stickyOffset}
        />
        <BlockSelectionPanel
          selectedBlock={selectedBlock}
          unavailableBlock={unavailableBlock}
          isChecking={isChecking}
          error={error}
        >
          <RequestAppointmentForm
            key={selectedBlock?.id}
            orientationTypes={mentorProfile.data?.orientationTypes ?? []}
            isLoadingTopics={mentorProfile.isPending}
            isSubmitting={isSubmitting}
            onSubmit={handleSubmit}
            onDirtyChange={setIsFormDirty}
          />
        </BlockSelectionPanel>
      </div>
      <LeaveRequestDialog
        open={leaveGuard.isLeaveDialogOpen}
        onConfirm={leaveGuard.confirmLeave}
        onCancel={leaveGuard.cancelLeave}
      />
    </>
  );
}
