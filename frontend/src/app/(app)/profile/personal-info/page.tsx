import { redirect } from "next/navigation";

export default function ProfileSectionPage() {
  return redirect("/profile/settings#personal-info");
}
