import { Suspense } from "react";
import { NotificationsView } from "@/modules/notifications";

export default function NotificationsPage() {
  return (
    <Suspense fallback={null}>
      <NotificationsView />
    </Suspense>
  );
}