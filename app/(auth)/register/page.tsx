import type { Metadata } from "next";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = { title: "Create account · MyMoney" };

export default function RegisterPage() {
  return <RegisterForm />;
}
