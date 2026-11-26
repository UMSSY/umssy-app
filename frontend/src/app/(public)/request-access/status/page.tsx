import type { Metadata } from "next";
import { CompanyMyRequestView, MyRequestView } from "@/modules/access-requests";
import type { RequestStatusPageProps } from "@/modules/access-requests/types/request-status-page-props.types";
import { getRequestLinkTarget } from "@/modules/access-requests/utils/get-request-link-target";

export const metadata: Metadata = {
  title: "Revisión de la solicitud",
};

export default async function MyRequestPage({
  searchParams,
}: RequestStatusPageProps) {
  const params = await searchParams;
  const target = getRequestLinkTarget(params.code);

  if (target?.kind === "company") {
    const email = typeof params.email === "string" ? params.email : null;
    return <CompanyMyRequestView requestCode={target.code} email={email} />;
  }

  return <MyRequestView requestCode={target?.code ?? null} />;
}
