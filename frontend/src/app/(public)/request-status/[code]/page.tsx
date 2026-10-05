import { RequestStatusView } from '@/modules/access-request';

interface RequestStatusPageProps {
  params: Promise<{ code: string }>;
}

export default async function RequestStatusPage({
  params,
}: RequestStatusPageProps) {
  // En Next 16 los params son una Promise y hay que esperarlos
  const { code } = await params;

  return <RequestStatusView requestCode={code} />;
}
