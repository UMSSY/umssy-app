import type { Metadata } from "next";
import { OfflinePassesRouteView } from "@/modules/events";

export const metadata: Metadata = { title: "Pases guardados · UMSSY" };

export default function OfflinePassesPage() {
  return <OfflinePassesRouteView />;
}
