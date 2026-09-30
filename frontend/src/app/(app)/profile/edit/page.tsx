import { parseProfileTab, ProfileEditView } from "@/modules/profile";

export default async function ProfileEditPage({ searchParams }: PageProps<"/profile/edit">) {
  const { tab } = await searchParams;
  return <ProfileEditView initialTab={parseProfileTab(tab)} />;
}
