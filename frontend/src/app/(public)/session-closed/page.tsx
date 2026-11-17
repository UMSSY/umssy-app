import type { Metadata } from "next";
import { SessionClosedView } from "@/modules/auth";

export const metadata: Metadata = {
  title: "Tu sesión se cerró",
  description: "Tu sesión en UMSSY ha finalizado.",
};

export default function SessionClosedPage() {
  return <SessionClosedView />;
}

