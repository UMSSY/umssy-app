import type { Metadata } from "next";
import { MyRequestView } from "@/modules/access-requests";
import type { RequestStatusPageProps } from "@/modules/access-requests/types/request-status-page-props.types";
import { getRequestCodeFromLink } from "@/modules/access-requests/utils/get-request-code-from-link";

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
