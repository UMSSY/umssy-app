"use client";

import { useRouter } from "next/navigation";
import { getEventRoomPath } from "@/modules/chat";
import { MyPassesView } from "./my-passes-view";

export function MyPassesRouteView() {
  const router = useRouter();

  return (
    <MyPassesView
      onOpenWorkshopChat={(registrationId) =>
        router.push(getEventRoomPath(registrationId))
      }
    />
  );
}
