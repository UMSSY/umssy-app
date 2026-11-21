import type { AppLayoutProps } from "@/shared/types/app-layout-props.types";
import { AppRouteLayout } from "@/shared/components/layout";
import { APP_ROUTE_FALLBACKS } from "@/shared/config/route-fallback.config";
import { OfflinePreparationProvider } from "@/modules/events";

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <OfflinePreparationProvider>
      <AppRouteLayout fallbacks={APP_ROUTE_FALLBACKS}>{children}</AppRouteLayout>
    </OfflinePreparationProvider>
  );
}
