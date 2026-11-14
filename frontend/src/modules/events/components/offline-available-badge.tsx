import { CloudDownload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { OFFLINE_PASSES_TEXTS } from "../constants/offline-passes.constants";

export function OfflineAvailableBadge() {
  return (
    <Badge className="gap-1 border-availability-border bg-availability text-availability-foreground">
      <CloudDownload className="size-3" aria-hidden="true" />
      {OFFLINE_PASSES_TEXTS.availableOffline}
    </Badge>
  );
}
