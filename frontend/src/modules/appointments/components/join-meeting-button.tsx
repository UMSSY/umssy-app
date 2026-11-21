"use client";

import { useState } from "react";
import { Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { JOIN_MEETING_TEXT } from "../constants/appointments.constants";
import type { JoinMeetingButtonProps } from "../types/join-meeting-button-props.types";

export function JoinMeetingButton({ meetingUrl }: JoinMeetingButtonProps) {
  const [showError, setShowError] = useState(false);

  return (
    <div className="flex w-full flex-col gap-2 sm:w-auto">
      {meetingUrl ? (
        <a href={meetingUrl} target="_blank" rel="noopener noreferrer" className={buttonVariants()}>
          <Video aria-hidden="true" className="size-4" />
          {JOIN_MEETING_TEXT.join}
        </a>
      ) : (
        <Button type="button" onClick={() => setShowError(true)}>
          <Video aria-hidden="true" className="size-4" />
          {JOIN_MEETING_TEXT.join}
        </Button>
      )}
      {showError ? (
        <p role="alert" className="text-sm text-destructive">
          {JOIN_MEETING_TEXT.unavailable}
        </p>
      ) : null}
    </div>
  );
}
