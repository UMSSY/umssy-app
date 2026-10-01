import type { ReactNode } from "react";
import { Shell } from "@/shared/components/layout";

export default function AppLayout({ children }: { children: ReactNode }) {
  return <Shell>{children}</Shell>;
}