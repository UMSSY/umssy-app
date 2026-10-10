import { RegisterVacancyView } from "@/modules/vacancies";
import { RecruitersBaseView } from "@/modules/recruiters";

export default function RegisterPage() {
  return (
    <RecruitersBaseView>
      <RegisterVacancyView />
    </RecruitersBaseView>
  );
}