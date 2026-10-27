import type { AppLayoutProps } from "@/shared/types/app-layout-props.types";
import { AppRouteLayout } from "@/shared/components/layout";
import { APP_ROUTE_FALLBACKS } from "@/shared/config/route-fallback.config";

export default function AppLayout({ children }: AppLayoutProps) {
  return <AppRouteLayout fallbacks={APP_ROUTE_FALLBACKS}>{children}</AppRouteLayout>;
}
