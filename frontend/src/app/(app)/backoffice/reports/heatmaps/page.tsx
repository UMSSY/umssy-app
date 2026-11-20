import { redirect } from "next/navigation";
import { SKILLS_BY_CAREER_HEATMAP_PATH } from "@/modules/heatmaps";

export default function HeatmapsPage() {
  redirect(SKILLS_BY_CAREER_HEATMAP_PATH);
}
