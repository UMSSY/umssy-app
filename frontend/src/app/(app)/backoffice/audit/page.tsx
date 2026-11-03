import type { Metadata } from "next";
import { AuditLogView } from "@/modules/audit-log";

export const metadata: Metadata = {
  title: "Registro de auditoría",
};

export default function AuditLogPage() {
  return <AuditLogView />;
}
