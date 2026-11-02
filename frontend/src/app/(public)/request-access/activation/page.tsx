import type { Metadata } from "next";
import { AccountActivationView } from "@/modules/access-request/views/account-activation-view";

export const metadata: Metadata = {
  title: "Activación de cuenta",
};

interface ActivationPageProps {
  searchParams: Promise<{ email?: string | string[] }>;
}

export default async function ActivationPage({ searchParams }: ActivationPageProps) {
  const { email } = await searchParams;
  return <AccountActivationView initialEmail={Array.isArray(email) ? (email[0] ?? "") : (email ?? "")} />;
}
