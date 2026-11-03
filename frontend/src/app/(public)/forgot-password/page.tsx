import type { Metadata } from "next";
import { ForgotPasswordView } from "@/modules/auth";

export const metadata: Metadata = {
  title: "Recuperar contraseña",
  description: "Recupera el acceso a tu cuenta institucional en UMSSY.",
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordView />;
}
