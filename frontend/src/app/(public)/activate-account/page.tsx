import { ActivateApprovedAccountView } from "@/modules/access-request/views/activate-approved-account-view";

export default async function Page({ searchParams }: { searchParams: Promise<{ requestId?: string }> }) {
  const params = await searchParams;
  return <ActivateApprovedAccountView requestId={params.requestId ?? ""} />;
}
