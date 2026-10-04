import { requireUser } from "@/lib/auth/session";
import { listCategories } from "@/lib/services/categories";
import { CategoriesView } from "@/components/categories/categories-view";

export const metadata = { title: "Categories" };

export default async function CategoriesPage() {
  const user = await requireUser();
  const categories = await listCategories(user.id);
  return <CategoriesView categories={categories} />;
}
