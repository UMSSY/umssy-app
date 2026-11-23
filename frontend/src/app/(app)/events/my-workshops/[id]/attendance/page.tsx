import { AttendanceHandoffView } from '@/modules/events';

export default async function AttendancePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AttendanceHandoffView workshopId={id} />;
}
