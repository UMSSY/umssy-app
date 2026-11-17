import type { Metadata } from "next";
import { RequestAccessView } from "@/modules/access-requests";

export const metadata: Metadata = {
  title: "Solicitud de acceso",
};

export default function RequestAccessPage() {
  return <RequestAccessView />;
}
