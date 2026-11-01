import type { Metadata } from "next";
import { MyRequestView } from "@/modules/access-request";
import type { RequestStatusPageProps } from "@/modules/access-request/types/request-status-page-props.types";
import { getRequestCodeFromLink } from "@/modules/access-request/utils/get-request-code-from-link";

export const metadata: Metadata = {
  title: "Revisión de la carrera",
};

export default async function MyRequestPage({
  searchParams,
}: RequestStatusPageProps) {
  const params = await searchParams;
  const requestCode = getRequestCodeFromLink(params.code);

  return <MyRequestView requestCode={requestCode} />;
}
