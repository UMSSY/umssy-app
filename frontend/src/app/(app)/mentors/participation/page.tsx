import { ParticipationView } from "@/modules/mentors";

export default async function Page({ searchParams }: { searchParams: Promise<{ registered?: string }> }) {
  const params = await searchParams;
  return <ParticipationView registered={params.registered === "1"} />;
}
