import { ParticipationView } from "@/modules/mentors";

export default async function Page({ searchParams }: { searchParams: Promise<{ registered?: string; activated?: string }> }) {
  const params = await searchParams;
  return <ParticipationView registered={params.registered === "1"} activated={params.activated === "1"} />;
}
