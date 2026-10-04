import { redirect } from "next/navigation";
import { getCurrentUserId } from "@/lib/auth/session";

export default async function HomePage() {
  const userId = await getCurrentUserId();
  redirect(userId ? "/records" : "/login");
}
